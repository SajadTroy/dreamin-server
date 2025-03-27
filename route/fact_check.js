const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FactCheck = require('../models/FactCheck');
const axios = require('axios');
const Fuse = require("fuse.js");
const logFactCheck = require("../logger");
const Groq = require("groq-sdk");
const { exec } = require("child_process");
const PastNews = require('../models/PastNews');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

const client = new Groq({
    apiKey: process.env['GROQ_API_KEY']
});

const ALLOWED_ORIGINS = [
    "https://verifeye.grovixlab.com"
];

let TRANSLATION_STATUS = true;
let LIVE_NEWS_STATUS = true;
let FACT_CHECKING_STATUS = true;

function extractKeywords(text) {
    let words = tokenizer.tokenize(text);
    let importantWords = words.filter(word => word.length > 3); // Filtering short words
    return [...new Set(importantWords)];
}

function extractKeywordsML(text) {
    let words = text.match(/[\p{Script=Malayalam}]+/gu) || []; // Extract Malayalam words
    let importantWords = words.filter(word => word.length > 3); // Remove short words
    return [...new Set(importantWords)]; // Remove duplicates
}

function fetchNewsFromPython(queries) {
    return new Promise((resolve, reject) => {
        const queryArgs = queries.map(q => `"${q}"`).join(" ");
        const options = {
            encoding: 'utf8',
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        };

        exec(`python3 python/fetch_news.py ${queryArgs}`, options, (error, stdout, stderr) => {
            if (error) return reject(error);
            if (stderr) return reject(stderr);
            try {
                resolve(JSON.parse(stdout));
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
}

function findRelatedItems(queries, data) {
    const options = {
        keys: ["title", "description", "content"],
        includeScore: true,
        threshold: 0.4,
    };

    const fuse = new Fuse(data, options);
    let allResults = [];

    // Process each query and get 2 results per query
    queries.forEach(query => {
        const results = fuse.search(query);
        allResults = allResults.concat(results.slice(0, 1).map(result => result.item));
    });

    return allResults;
}

function getRelatedItems(query, data) {
    const options = {
        keys: ["title", "description", "content"],
        includeScore: true,
        threshold: 0.4,
    };
    const fuse = new Fuse(data, options);
    const results = fuse.search(query);

    return results.slice(0, 2).map(result => result.item);
};

function findRelatedCheckItems(query, data) {
    const options = {
        keys: ["claim", "claim_english", "explanation", "explanation_english"],
        includeScore: true,
        threshold: 0.4,
    };

    const fuse = new Fuse(data, options);
    const results = fuse.search(query);

    return results.slice(0, 2).map(result => result.item);
}

router.get('/status', (req, res) => {
    const startTime = process.hrtime();

    if (FACT_CHECKING_STATUS) {
        const response = {
            message: "Fact checking service operational",
            server: {
                latency_ms: 0.0,
                timestamp: new Date().toISOString(),
                uptime: true
            },
            status: "success"
        };

        const endTime = process.hrtime(startTime);
        response.server.latency_ms = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(3);

        res.json(response);
    } else {
        const response = {
            message: "Fact checking service down",
            server: {
                latency_ms: 0.0,
                timestamp: new Date().toISOString(),
                uptime: true
            },
            status: "failed"
        };

        const endTime = process.hrtime(startTime);
        response.server.latency_ms = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(3);

        return (response);
    }
});

router.get('/translation_status', (req, res) => {
    const startTime = process.hrtime();
    if (TRANSLATION_STATUS) {
        const response = {
            message: "Translation service operational",
            server: {
                latency_ms: 0.0,
                timestamp: new Date().toISOString(),
                uptime: true
            },
            status: "success"
        };

        const endTime = process.hrtime(startTime);
        response.server.latency_ms = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(3);

        res.json(response);
    } else {
        const response = {
            message: "Translation service down",
            server: {
                latency_ms: 0.0,
                timestamp: new Date().toISOString(),
                uptime: true
            },
            status: "failed"
        };

        const endTime = process.hrtime(startTime);
        response.server.latency_ms = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(3);

        return (response);
    }
});

router.get('/live_news_status', (req, res) => {
    const startTime = process.hrtime();
    if (LIVE_NEWS_STATUS) {
        const response = {
            message: "Live news service operational",
            server: {
                latency_ms: 0.0,
                timestamp: new Date().toISOString(),
                uptime: true
            },
            status: "success"
        };

        const endTime = process.hrtime(startTime);
        response.server.latency_ms = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(3);

        res.json(response);
    } else {
        const response = {
            message: "Live news service down",
            server: {
                latency_ms: 0.0,
                timestamp: new Date().toISOString(),
                uptime: true
            },
            status: "failed"
        };

        const endTime = process.hrtime(startTime);
        response.server.latency_ms = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(3);

        return (response);
    }
});

const translator = async (text, from, to) => {
    try {
        if (!text) return ({ message: 'Text is required' });
        const resp = await axios.get(`https://api.mymemory.translated.net/get?q=${text}&langpair=${from}|${to}`);
        const translatedClaim = resp.data.responseData.translatedText;

        let response = {
            translation: translatedClaim
        }

        TRANSLATION_STATUS = true;
        return (response);
    } catch (error) {
        TRANSLATION_STATUS = false;
        console.error(error);
        return ({ message: error.message });
    }
}

const searchable_queries = async (text) => {
    try {
        if (!text) return ({ message: 'Text is required' });

        const system_prompt = `
        You are an advanced AI that extracts highly relevant search queries from a given English input.  
        
        Your Task:  
        - Analyze the input text and extract key search terms for searching related information.  
        - Identify important entities such as names, places, events, organizations, and dates.  
        - Exclude common words and focus only on meaningful searchable queries.  
        
        Expected JSON Output Format:  
        \`\`\`json
        ["query_one", "name_one", "event_one", "organization_one", "etc"]
        \`\`\`
        - Minimum 1 query must be returned.  
        - Queries should be optimized for search engines (short, relevant, and effective).  
        
        Input: "${text}"  
        Response only in JSON format—do not include any other text, comments, or explanations.
`;

        const chatCompletion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: text },
            ],
            model: 'deepseek-r1-distill-qwen-32b',
        });

        const aiResponse = chatCompletion.choices[0].message.content.trim();

        const match = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonStr = match ? match[1].trim() : aiResponse;

        let searchableQueries;
        try {
            searchableQueries = JSON.parse(jsonStr);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return ({ message: 'Failed to parse AI response' });
        }

        let response = {
            queries: searchableQueries
        }
        return (response);
    } catch (error) {
        console.error(error);
        return ({ message: error.message });
    }
}

const fetch_past_checks = async (claim) => {
    try {
        if (!claim) return ({ message: 'Claim is required' });

        const pastChecks = await FactCheck.find().sort({ timestamp: -1 }).lean();

        const retrivedChecks = await findRelatedCheckItems(claim, pastChecks)

        const formattedChecks = retrivedChecks
            .map(check => (
                `Similar Claim: ${check.claim}\n` +
                `Similar Claim in English: ${check.claim_english}\n` +
                `Verdict: ${check.fact}\n` +
                `Confidence: ${check.confidence_level}%\n` +
                `Explanation: ${check.explanation}\n` +
                `Explanation in English: ${check.explanation_english}\n` +
                `Date: ${new Date(check.timestamp).toISOString()}`
            )).join('\n\n');

        let response = {
            past_checks: formattedChecks
        };

        return (response);
    } catch (error) {
        console.error(error);
        return ({ message: error.message });
    }
}

const fetch_news = async (queries) => {
    try {
        if (!Array.isArray(queries) || queries.length === 0) {
            return ({ message: 'An array of queries is required' });
        }

        const pastNews = await PastNews.find().sort({ published: -1 }).lean();

        let retrivedNews = await findRelatedItems(queries, pastNews);

        const formattedNews = retrivedNews
            .map(check => (
                `Title: ${check.title}\n` +
                `Description: ${check.description}\n` +
                `Content: ${check.content.slice(0, 300)}...\n` +
                `Link: ${check.link}\n` +
                `Published: ${new Date(check.published).toISOString()}`
            )).join('\n\n');

        let response = {
            past_news: formattedNews
        };

        LIVE_NEWS_STATUS = true;

        return (response);
    } catch (error) {
        LIVE_NEWS_STATUS = false;
        console.error(error);
        return ({ message: error.message });
    }
}

const fetch_news_google = async (queries) => {
    try {
        if (!queries) return ({ message: 'Queries are required' });

        return new Promise((resolve, reject) => {
            fetchNewsFromPython(queries)
                .then(news => {
                    let response = {
                        google_news: news
                    };

                    LIVE_NEWS_STATUS = true;
                    resolve(response);
                })
                .catch(err => {
                    console.error("Error:", err);
                    reject({ message: err.message });
                });
        });
    } catch (error) {
        LIVE_NEWS_STATUS = false;
        console.error(error);
        throw { message: error.message };
    }
}

const claim_fact_check = async (claim, retrived_checks, past_news, past_news_second, translated_claim, google_news) => {
    try {
        if (!claim) return ({ message: 'Claim is required' });
        if (!translated_claim) return ({ message: 'Translated claim is required' });

        const current_datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

        const system_prompt = `
You are VerifEye, a fact-checking AI trained by Grovix Lab, specializing in Malayalam news verification.  

Your task is to analyze a claim and classify it as Fake or Real using the following methods:  

1️⃣ Past Fact-Checking History (Previously fact-checked claims using this same verification method)  
2️⃣ Live Search Results (Cross-check from multiple reliable sources; discard misleading or unreliable information)  
3️⃣ Contextual Analysis (Identify misleading claims, false attributions, or missing context)  
4️⃣ Image & Video Verification (Detect AI manipulation, reverse-search old media used in a new context)  
5️⃣ Historical Claim Comparison (Check if a similar claim was debunked before)  
6️⃣ Source Reliability Assessment (Rate sources based on their past accuracy and credibility)  

📅 Current Date & Time: ${current_datetime}  

📌 Claim to Verify:  
- Original: "${claim}"  
- Translated (English): "${translated_claim}"  

📂 Past Fact-Checking History (Previously Verified Claims, Not a Trusted Source by Itself):  
${retrived_checks}  

🌍 Live Search Results (Cross-Verify Before Using):  
${past_news}\n\n${past_news_second}\n\n${google_news}   

### Classification Guidelines:  
✔️ Fake: The claim is false, lacks credible evidence, is misleading, or has been debunked by multiple authoritative sources.  
✔️ Real: The claim is factually correct, well-supported by multiple trustworthy sources, and not manipulated.  

### 🚀 Expected JSON Output (Strict Format, No Extra Text):  
\`\`\`json
{{
    "fact": "real" | "fake",
    "confidence_level": 0-100,  // Confidence percentage in classification
    "explanation": "A precise English explanation (max 300 characters) justifying the classification. No introductions or extra details—only a direct, fact-based reasoning.",
}}
\`\`\`  
Response only in JSON format—do not include any other text, comments, or explanations. 
`;

        const chatCompletion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: claim },
            ],
            model: 'deepseek-r1-distill-llama-70b',
        });

        const aiResponse = chatCompletion.choices[0].message.content.trim();

        const match = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonStr = match ? match[1].trim() : aiResponse;

        let factCheck;
        try {
            factCheck = JSON.parse(jsonStr);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return ({ message: 'Failed to parse AI response' });
        }

        const { translation } = await translator(factCheck.explanation, 'en-GB', 'ml-IN');

        FactCheck.create({ claim, fact: factCheck.fact, confidence_level: factCheck.confidence_level, claim_english: translated_claim, explanation: translation, explanation_english: factCheck.explanation });
        logFactCheck.logFactCheck(claim, factCheck.fact, factCheck.confidence_level, translation);

        factCheck.explanation = translation;
        const response = {
            result: factCheck
        };

        return (response);
    } catch (error) {
        console.error(error);
        return ({ message: error.message });
    }
}

router.post('/fact_check', async (req, res) => {
    try {
        const origin = req.get('Origin') || req.get('Referer');

        if (!origin || !ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
            return res .status(401).json({ status: "error", message: "Unauthorized access" });
        } 

        const startTime = process.hrtime();
        const { claim } = req.body;
        if (!claim) return ({ message: 'Claim is required' });

        const { translation } = await translator(claim, 'ml-IN', 'en-GB');
        // const { queries } = await searchable_queries(translation);
        const queries = await extractKeywords(translation);
        const mlQueries = await extractKeywordsML(claim);
        const { past_checks } = await fetch_past_checks(claim);
        const { past_news } = await fetch_news(mlQueries);
        const { past_news_second } = await fetch_news(queries);

        const { google_news } = await fetch_news_google([translation]);

        const factCheck = await claim_fact_check(claim, past_checks, past_news, past_news_second, translation, google_news);

        let response = {
            claim,
            fact_check: factCheck.result,
            translated_claim: translation,
            server: {
                latency_ms: 0.0,
                timestamp: new Date().toISOString(),
                uptime: true
            },
            status: "success"
        };

        const endTime = process.hrtime(startTime);
        response.server.latency_ms = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(3);

        FACT_CHECKING_STATUS = true;
        res.json(response);
    } catch (error) {
        FACT_CHECKING_STATUS = false;
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;