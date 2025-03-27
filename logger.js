const axios = require('axios');

class DiscordFactCheckLogger {
  constructor(webhookUrl) {
    if (!webhookUrl) {
      throw new Error('webhookUrl is undefined. Please set DISCORD_FACTCHECK_WEBHOOK_URL.');
    }
    this.webhookUrl = webhookUrl;
    this.logFactCheck = this.logFactCheck.bind(this);
  }

  async logFactCheck(claim, fact, confidenceLevel, explanation) {
    try {
      const color = fact === 'real' ? 3066993 : 15158332; // Green for real, Red for fake
      const factLabel = fact.toUpperCase();
      
      const factCheckData = {
        content: null,
        embeds: [
          {
            title: `${factLabel} - ${confidenceLevel}% CONFIDENT`,
            color: color,
            fields: [
              {
                name: 'Claim',
                value: claim || 'No claim provided'
              },
              {
                name: 'Confidence Level',
                value: `${confidenceLevel}%`
              },
              {
                name: 'Explanation',
                value: explanation || 'No explanation provided'
              },
              {
                name: 'Timestamp',
                value: new Date().toISOString()
              },
              {
                name: 'Check Now',
                value: 'https://verifeye.grovixlab.com'
              }
            ]
          }
        ]
      };
      
      await axios.post(this.webhookUrl, factCheckData);
    } catch (err) {
      console.error('Failed to send fact-check log to Discord:', err);
    }
  }
}

const factCheckLogger = new DiscordFactCheckLogger(process.env.DISCORD_FACTCHECK_WEBHOOK_URL);

module.exports = { logFactCheck: factCheckLogger.logFactCheck };
