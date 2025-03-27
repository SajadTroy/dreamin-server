const Parser = require('rss-parser');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const PastNews = require('../models/PastNews');

const rssFeeds = [
    "https://www.onmanorama.com/news/world.feeds.onmrss.xml",
    "https://www.manoramaonline.com/news/latest-news.feeds.rss.xml",
    "https://www.onmanorama.com/news/india.feeds.onmrss.xml",
    "https://www.onmanorama.com/kerala.feeds.onmrss.xml", 
    "https://www.mathrubhumi.com/cmlink/rss-feed-1.7275970",
    "https://www.asianetnews.com/rss",
    "https://keralakaumudi.com/rss/topstories",
    "https://keralakaumudi.com/rss/kerala",
    "https://keralakaumudi.com/rss/obit",
    "https://keralakaumudi.com/rss/local",
    "https://keralakaumudi.com/rss/news-360",
    "https://keralakaumudi.com/rss/case-diary",
    "https://keralakaumudi.com/rss/cinema",
    "https://keralakaumudi.com/rss/info",
    "https://keralakaumudi.com/rss/art",
    "https://keralakaumudi.com/rss/cinema/news",
    "https://keralakaumudi.com/rss/local/thiruvananthapuram",
    "https://keralakaumudi.com/rss/local/kollam",
    "https://keralakaumudi.com/rss/local/pathanamthitta",
    "https://keralakaumudi.com/rss/local/alappuzha",
    "https://keralakaumudi.com/rss/local/kottayam",
    "https://keralakaumudi.com/rss/local/idukki",
    "https://keralakaumudi.com/rss/local/ernakulam",
    "https://keralakaumudi.com/rss/local/thrissur",
    "https://keralakaumudi.com/rss/local/palakkad",
    "https://keralakaumudi.com/rss/local/malappuram",
    "https://keralakaumudi.com/rss/local/kozhikode",
    "https://keralakaumudi.com/rss/local/wayanad",
    "https://keralakaumudi.com/rss/local/kannur",
    "https://keralakaumudi.com/rss/local/kasargod",
    "https://keralakaumudi.com/rss/kerala/social-media",
    "https://keralakaumudi.com/rss/kerala/information",
    "https://keralakaumudi.com/rss/kerala/politics",
    "https://keralakaumudi.com/rss/kerala/kalolsavam",
    "https://keralakaumudi.com/rss/en/editorial",
    "https://keralakaumudi.com/rss/en/india",
    "https://keralakaumudi.com/rss/en/world",
    "https://keralakaumudi.com/rss/en/science--technology",
    "https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml",
    "https://www.hindustantimes.com/feeds/rss/cities/rssfeed.xml",
    "https://www.hindustantimes.com/feeds/rss/cities/bengaluru-news/rssfeed.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Africa.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Americas.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    "https://indianexpress.com/section/sports/feed/",
    "https://indianexpress.com/feed/",
    "https://grovixlab.com/api/rss",
    "https://www.twentyfournews.com/feed",
    "https://www.twentyfournews.com/fact-check/feed",
    "https://www.twentyfournews.com/entertainment/feed",
    "https://www.twentyfournews.com/sports/feed",
    "https://www.twentyfournews.com/gallery/video/feed",
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    "https://timesofindia.indiatimes.com/rssfeedmostrecent.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms",
    "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
    "https://services.india.gov.in/feed/rss?cat_id=1&ln=en",
    "https://services.india.gov.in/feed/rss?cat_id=5&ln=en",
    "https://services.india.gov.in/feed/rss?cat_id=3&ln=en",
    "https://services.india.gov.in/feed/rss?cat_id=7&ln=en",
    "https://services.india.gov.in/feed/rss?cat_id=10&ln=en"
];

const parser = new Parser();

// Clean content by removing extra whitespace and normalizing spacing
function cleanContent(text) {
    return text
        .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n')      // Replace multiple newlines with single newline
        .replace(/^\s+|\s+$/g, '')      // Trim start and end
        .trim();
}

// Add this helper function to parse different date formats
function parsePublishDate(dateStr) {
    if (!dateStr) return new Date();

    // Try direct parsing first
    let date = new Date(dateStr);
    
    // If valid date, return it
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Handle IST dates
    if (dateStr.includes('IST')) {
        // Convert IST to GMT by subtracting 5 hours and 30 minutes
        const regex = /(\d{2}) (\w{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2})/;
        const match = dateStr.match(regex);
        
        if (match) {
            const months = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            const [, day, month, year, hours, minutes, seconds] = match;
            date = new Date(
                parseInt(year),
                months[month],
                parseInt(day),
                parseInt(hours),
                parseInt(minutes),
                parseInt(seconds)
            );
            
            // Adjust for IST to UTC conversion
            date.setMinutes(date.getMinutes() - 330); // -5:30 hours in minutes
            return date;
        }
    }

    // If all parsing fails, return current date
    return new Date();
}

async function fetchAndParseRSS(rssUrl) {
    try {
        const feed = await parser.parseURL(rssUrl);
        return feed.items; // Return all articles in the feed
    } catch (error) {
        console.error(`Error parsing RSS feed ${rssUrl}:`, error);
        return [];
    }
}

async function fetchArticleContent(url) {
    try {
        const response = await fetch(url, { timeout: 10000 });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract meta description
        const metaDescription = cleanContent($('meta[name="description"]').attr('content') || "No description available");

        // Extract and clean main content
        const paragraphs = $('p').map((_, p) => $(p).text()).get().join('\n');
        const cleanedContent = cleanContent(paragraphs);

        return { metaDescription, articleContent: cleanedContent };
    } catch (error) {
        console.error(`Error fetching article:`, error);
        return { 
            metaDescription: "No description available", 
            articleContent: "Failed to fetch article content." 
        };
    }
}

async function processFeeds() {
    console.log('Starting RSS feed processing at:', new Date().toISOString());
    
    try {
        for (const rssUrl of rssFeeds) {
            // console.log(`\nProcessing feed: ${rssUrl}`);
            const articles = await fetchAndParseRSS(rssUrl);

            for (const entry of articles) {
                try {
                    // Check if article already exists
                    const exists = await PastNews.findOne({ link: entry.link });
                    if (exists) {
                        // console.log(`Article already exists: ${entry.title}`);
                        continue;
                    }

                    // Fetch and clean article content
                    const { metaDescription, articleContent } = await fetchArticleContent(entry.link);

                    // Use the new date parsing function
                    const publishDate = parsePublishDate(entry.pubDate);
                    
                    // Save to database
                    const newArticle = new PastNews({
                        title: cleanContent(entry.title),
                        link: entry.link,
                        published: publishDate,
                        description: metaDescription,
                        content: articleContent
                    });

                    await newArticle.save();
                    console.log(`Saved new article: ${entry.title} (Published: ${publishDate.toISOString()})`);

                } catch (error) {
                    console.error(`Error processing article ${entry.link}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Feed processing error:', error);
    }
}

async function startScheduler() {
    // Initial run
    await processFeeds();

    setInterval(async () => {
        await processFeeds();
    }, 30 * 60 * 1000);
}

// Start the scheduler
startScheduler().catch(error => {
    console.error('Scheduler error:', error);
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', async () => {
    console.log('Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
});
