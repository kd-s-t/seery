const OpenAI = require('openai');
const { Resend } = require('resend');
const prompts = require('./prompts');
require('dotenv').config();

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL = process.env.ALERT_EMAIL || process.env.SUPPORT_EMAIL || 'kendantinio@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || 'kendantinio@gmail.com';
const SCAN_INTERVAL_HOURS = parseInt(process.env.SCAN_INTERVAL_HOURS) || 24; // Default: 24 hours (once per day) - safer for $20/month budget
const SCAN_INTERVAL_MS = SCAN_INTERVAL_HOURS * 60 * 60 * 1000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'; // Default: gpt-3.5-turbo for budget safety
const NEWS_ARTICLE_COUNT = parseInt(process.env.NEWS_ARTICLE_COUNT) || 10; // Reduce articles to save tokens

// Initialize OpenAI (will be set after validation)
let openai = null;

// Initialize Resend
let resend = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.warn('⚠️  RESEND_API_KEY not configured. Alerts will only be logged to console.');
}

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

/**
 * Analyze Bitcoin news for significant events and predictions
 */
async function analyzeBitcoinNews() {
  try {
    console.log(`${colors.cyan}[${new Date().toLocaleString()}] Scanning Bitcoin news...${colors.reset}`);
    
    // Fetch latest Bitcoin news
    const prompt = prompts.getBitcoinNewsPrompt(NEWS_ARTICLE_COUNT); // Configurable article count
    
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: prompts.NEWS_AGGREGATOR_SYSTEM,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000, // Reduced to save costs
    });

    const content = completion.choices[0].message.content.trim();
    let jsonMatch = content.match(/\[[\s\S]*\]/);
    const news = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    // Analyze news for predictions and significant events
    const analysisPrompt = `Analyze these Bitcoin news articles and provide a JSON response with predictions and alerts:

${JSON.stringify(news, null, 2)}

Provide JSON with this structure:
{
  "alertLevel": "high/medium/low/none",
  "prediction": "What is likely to happen with Bitcoin in the next 24-48 hours?",
  "priceDirection": "up/down/stable/uncertain",
  "confidence": 0-100,
  "keyEvents": ["event1", "event2", "event3"],
  "recommendation": "Specific actionable recommendation (e.g., 'A huge downfall of BTC will soon happen, withdraw now' or 'There is going to be a rising of BTC, consider buying')",
  "timeframe": "When this is expected to happen (e.g., 'next 24 hours', 'within 2-3 days')",
  "reasoning": "Brief explanation of the prediction"
}

Focus on:
- Sudden price movements or potential crashes
- Major positive developments that could cause price increases
- Regulatory news that could significantly impact Bitcoin
- Market sentiment shifts
- Technical indicators mentioned in news
- Large institutional moves or whale activity

Only set alertLevel to "high" if there is strong evidence of an imminent significant price movement (>10%) or major market event.`;

    const analysisCompletion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert cryptocurrency market analyst. Provide accurate, data-driven predictions based on news analysis. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 1000, // Reduced to save costs
    });

    const analysisContent = analysisCompletion.choices[0].message.content.trim();
    const analysisJsonMatch = analysisContent.match(/\{[\s\S]*\}/);
    const analysis = analysisJsonMatch ? JSON.parse(analysisJsonMatch[0]) : JSON.parse(analysisContent);

    // Track combined token usage for cost estimation
    let costEstimate = null;
    if (completion.usage && analysisCompletion.usage) {
      const combinedUsage = {
        prompt_tokens: completion.usage.prompt_tokens + analysisCompletion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens + analysisCompletion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens + analysisCompletion.usage.total_tokens,
      };
      costEstimate = estimateCost(combinedUsage, OPENAI_MODEL);
    }

    return { news, analysis, costEstimate };
  } catch (error) {
    // Handle specific OpenAI errors
    if (error.status === 429) {
      if (error.message?.includes('quota')) {
        console.error(`${colors.red}❌ OpenAI Quota Exceeded${colors.reset}`);
        console.error(`${colors.yellow}   Your OpenAI API quota has been exceeded.${colors.reset}`);
        console.error(`${colors.cyan}   Please:${colors.reset}`);
        console.error(`${colors.cyan}   1. Check your billing at https://platform.openai.com/account/billing${colors.reset}`);
        console.error(`${colors.cyan}   2. Add payment method or credits if needed${colors.reset}`);
        console.error(`${colors.cyan}   3. Or wait until your quota resets${colors.reset}`);
      } else {
        console.error(`${colors.red}❌ OpenAI Rate Limit Exceeded${colors.reset}`);
        console.error(`${colors.yellow}   Too many requests. Waiting before retry...${colors.reset}`);
      }
    } else {
      console.error(`${colors.red}❌ Error analyzing news:${colors.reset}`, error.message);
    }
    throw error;
  }
}

/**
 * Estimate cost based on token usage
 */
function estimateCost(usage, model = 'gpt-4-turbo') {
  // Pricing per 1M tokens (as of 2025)
  const pricing = {
    'gpt-4-turbo': { input: 10, output: 30 }, // $10/$30 per 1M tokens
    'gpt-4': { input: 30, output: 60 }, // $30/$60 per 1M tokens
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 }, // $0.50/$1.50 per 1M tokens
  };
  
  const prices = pricing[model] || pricing['gpt-4-turbo'];
  const inputCost = (usage.prompt_tokens / 1000000) * prices.input;
  const outputCost = (usage.completion_tokens / 1000000) * prices.output;
  
  return {
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    estimatedCost: inputCost + outputCost,
    model,
  };
}

/**
 * Calculate monthly cost projection
 */
function calculateMonthlyCost(scanIntervalHours, costPerScan) {
  const scansPerDay = 24 / scanIntervalHours;
  const scansPerMonth = scansPerDay * 30;
  return {
    scansPerDay: scansPerDay.toFixed(1),
    scansPerMonth: scansPerMonth.toFixed(0),
    estimatedMonthlyCost: (costPerScan * scansPerMonth).toFixed(2),
    daysPer20Dollars: (20 / (costPerScan * scansPerDay)).toFixed(1),
  };
}

/**
 * Send email alert
 */
async function sendEmailAlert(analysis, news) {
  if (!resend) {
    console.log(`${colors.yellow}📧 Email not configured. Alert would be sent:${colors.reset}`);
    console.log(`${colors.cyan}${formatEmailText(analysis, news)}${colors.reset}`);
    return;
  }

  try {
    const subject = `🚨 Bitcoin Alert: ${analysis.alertLevel.toUpperCase()} - ${analysis.priceDirection === 'up' ? '📈' : analysis.priceDirection === 'down' ? '📉' : '➡️'} ${analysis.prediction}`;
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ALERT_EMAIL,
      subject: subject,
      html: formatEmailContent(analysis, news),
      text: formatEmailText(analysis, news),
    });

    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }

    console.log(`${colors.green}✅ Email alert sent to ${ALERT_EMAIL}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error sending email:${colors.reset}`, error.message);
  }
}

/**
 * Format email HTML content
 */
function formatEmailContent(analysis, news) {
  const alertColor = analysis.alertLevel === 'high' ? '#ff4444' : 
                    analysis.alertLevel === 'medium' ? '#ffaa00' : '#44aa44';
  const directionEmoji = analysis.priceDirection === 'up' ? '📈' : 
                        analysis.priceDirection === 'down' ? '📉' : '➡️';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert-box { background-color: ${alertColor}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .recommendation { background-color: #f0f0f0; padding: 15px; border-left: 4px solid ${alertColor}; margin: 20px 0; font-weight: bold; }
        .info-box { background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 10px 0; }
        h1 { color: #333; }
        h2 { color: #555; }
        ul { margin: 10px 0; }
        .news-item { margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-radius: 3px; }
        .timestamp { color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚨 Bitcoin Market Alert</h1>
        <div class="alert-box">
          <h2>Alert Level: ${analysis.alertLevel.toUpperCase()}</h2>
          <p><strong>${directionEmoji} ${analysis.prediction}</strong></p>
          <p>Confidence: ${analysis.confidence}%</p>
          <p>Timeframe: ${analysis.timeframe}</p>
        </div>
        
        <div class="recommendation">
          <h2>💡 Recommendation:</h2>
          <p>${analysis.recommendation}</p>
        </div>
        
        <div class="info-box">
          <h2>📊 Analysis:</h2>
          <p>${analysis.reasoning}</p>
        </div>
        
        <h2>🎯 Key Events:</h2>
        <ul>
          ${analysis.keyEvents.map(event => `<li>${event}</li>`).join('')}
        </ul>
        
        <h2>📰 Recent News (Top 5):</h2>
        ${news.slice(0, 5).map(article => `
          <div class="news-item">
            <strong>${article.title}</strong>
            <p>${article.summary}</p>
            <span class="timestamp">${article.source} ${article.date || ''}</span>
          </div>
        `).join('')}
        
        <div class="timestamp" style="margin-top: 30px;">
          <p>Alert generated: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format email text content
 */
function formatEmailText(analysis, news) {
  return `
BITCOIN MARKET ALERT
===================

Alert Level: ${analysis.alertLevel.toUpperCase()}
Prediction: ${analysis.prediction}
Price Direction: ${analysis.priceDirection}
Confidence: ${analysis.confidence}%
Timeframe: ${analysis.timeframe}

RECOMMENDATION:
${analysis.recommendation}

ANALYSIS:
${analysis.reasoning}

KEY EVENTS:
${analysis.keyEvents.map(e => `- ${e}`).join('\n')}

TOP NEWS:
${news.slice(0, 5).map(a => `\n${a.title}\n${a.summary}\n${a.source} ${a.date || ''}`).join('\n\n')}

Generated: ${new Date().toLocaleString()}
  `;
}

/**
 * Main monitoring function
 */
async function runMonitoring() {
  try {
    const result = await analyzeBitcoinNews();
    const { news, analysis, costEstimate } = result;
    
    console.log(`${colors.blue}📊 Analysis Results:${colors.reset}`);
    console.log(`   Alert Level: ${colors.yellow}${analysis.alertLevel.toUpperCase()}${colors.reset}`);
    console.log(`   Prediction: ${analysis.prediction}`);
    console.log(`   Price Direction: ${analysis.priceDirection}`);
    console.log(`   Confidence: ${analysis.confidence}%`);
    console.log(`   Recommendation: ${colors.cyan}${analysis.recommendation}${colors.reset}`);
    
    // Show cost estimate if available
    if (costEstimate) {
      const monthly = calculateMonthlyCost(SCAN_INTERVAL_HOURS, costEstimate.estimatedCost);
      console.log(`\n${colors.gray}💰 Cost Estimate:${colors.reset}`);
      console.log(`   This scan: $${costEstimate.estimatedCost.toFixed(4)}`);
      console.log(`   Scans per day: ${monthly.scansPerDay}`);
      console.log(`   Estimated monthly: $${monthly.estimatedMonthlyCost}`);
      console.log(`   $20 budget lasts: ~${monthly.daysPer20Dollars} days`);
    }
    
    // Send alert if there's a significant finding
    if (analysis.alertLevel !== 'none' && analysis.alertLevel !== 'low') {
      await sendEmailAlert(analysis, news);
    } else {
      console.log(`${colors.gray}   No significant alerts at this time.${colors.reset}`);
    }
    
    console.log(`${colors.green}✅ Scan complete. Next scan in ${SCAN_INTERVAL_HOURS} hours.${colors.reset}\n`);
    
  } catch (error) {
    // If quota exceeded, don't retry immediately - wait longer
    if (error.status === 429 && error.message?.includes('quota')) {
      console.error(`${colors.red}❌ Monitoring paused due to quota limit${colors.reset}`);
      console.error(`${colors.yellow}   The monitor will continue running but will retry on the next scheduled scan.${colors.reset}`);
      console.error(`${colors.yellow}   Please resolve the quota issue in your OpenAI account.${colors.reset}\n`);
    } else {
      console.error(`${colors.red}❌ Monitoring error:${colors.reset}`, error.message);
    }
  }
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  
  // Required variables
  if (!OPENAI_API_KEY) {
    errors.push({
      variable: 'OPENAI_API_KEY',
      message: 'OpenAI API key is required',
      help: 'Get your API key from https://platform.openai.com/api-keys\n   Add it to your .env file: OPENAI_API_KEY=sk-your-key-here'
    });
  } else if (!OPENAI_API_KEY.startsWith('sk-')) {
    warnings.push({
      variable: 'OPENAI_API_KEY',
      message: 'OpenAI API key format looks incorrect (should start with "sk-")',
    });
  }
  
  // Email configuration (optional but recommended)
  if (!RESEND_API_KEY) {
    warnings.push({
      variable: 'RESEND_API_KEY',
      message: 'Email not configured - alerts will only be logged to console',
      help: 'To enable email alerts:\n   1. Sign up at https://resend.com\n   2. Get your API key from the dashboard\n   3. Add to .env: RESEND_API_KEY=re_your_key_here\n   4. Set RESEND_FROM_EMAIL (e.g., "Your Name <noreply@yourdomain.com>")'
    });
  }
  
  // Validate scan interval
  if (SCAN_INTERVAL_HOURS < 1 || SCAN_INTERVAL_HOURS > 168) {
    errors.push({
      variable: 'SCAN_INTERVAL_HOURS',
      message: `Invalid scan interval: ${SCAN_INTERVAL_HOURS} hours`,
      help: 'Must be between 1 and 168 hours (1 week)\n   Recommended: 12-24 hours for budget safety'
    });
  }
  
  // Validate news article count
  if (NEWS_ARTICLE_COUNT < 1 || NEWS_ARTICLE_COUNT > 20) {
    errors.push({
      variable: 'NEWS_ARTICLE_COUNT',
      message: `Invalid article count: ${NEWS_ARTICLE_COUNT}`,
      help: 'Must be between 1 and 20\n   Recommended: 10 for budget safety, 15 for more comprehensive analysis'
    });
  }
  
  // Display errors
  if (errors.length > 0) {
    console.error(`\n${colors.red}${'='.repeat(60)}${colors.reset}`);
    console.error(`${colors.red}❌ Configuration Errors Found${colors.reset}`);
    console.error(`${colors.red}${'='.repeat(60)}${colors.reset}\n`);
    
    errors.forEach((error, index) => {
      console.error(`${colors.red}${index + 1}. ${error.variable}${colors.reset}`);
      console.error(`   ${colors.yellow}${error.message}${colors.reset}`);
      if (error.help) {
        console.error(`   ${colors.cyan}${error.help}${colors.reset}`);
      }
      console.error('');
    });
    
    console.error(`${colors.yellow}💡 Create or update your .env file in the project root${colors.reset}`);
    console.error(`${colors.gray}   Example .env file:${colors.reset}`);
    console.error(`${colors.gray}   OPENAI_API_KEY=sk-your-key-here${colors.reset}`);
    console.error(`${colors.gray}   RESEND_API_KEY=re_your_key_here${colors.reset}`);
    console.error(`${colors.gray}   FROM_EMAIL=alerts@yourdomain.com${colors.reset}`);
    console.error(`${colors.gray}   ALERT_EMAIL=kendantinio@gmail.com${colors.reset}\n`);
    
    return false;
  }
  
  // Display warnings
  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Configuration Warnings${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}\n`);
    
    warnings.forEach((warning, index) => {
      console.log(`${colors.yellow}${index + 1}. ${warning.variable}${colors.reset}`);
      console.log(`   ${warning.message}`);
      if (warning.help) {
        console.log(`   ${colors.cyan}${warning.help}${colors.reset}`);
      }
      console.log('');
    });
    
    console.log(`${colors.gray}   Continuing anyway...${colors.reset}\n`);
  }
  
  return true;
}

/**
 * Start the monitoring service
 */
function startMonitoring() {
  // Validate environment before starting
  console.log(`${colors.cyan}🔍 Validating configuration...${colors.reset}`);
  
  if (!validateEnvironment()) {
    console.error(`${colors.red}❌ Cannot start monitor due to configuration errors${colors.reset}`);
    process.exit(1);
  }
  
  // Initialize OpenAI after validation passes
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
  
  console.log(`${colors.green}✅ Configuration validated${colors.reset}`);
  console.log(`${colors.green}🚀 Bitcoin News Monitor Started${colors.reset}`);
  console.log(`${colors.cyan}   Scanning every ${SCAN_INTERVAL_HOURS} hours (${(24 / SCAN_INTERVAL_HOURS).toFixed(1)} times per day)${colors.reset}`);
  console.log(`${colors.cyan}   Using model: ${OPENAI_MODEL}${colors.reset}`);
  console.log(`${colors.cyan}   Articles per scan: ${NEWS_ARTICLE_COUNT}${colors.reset}`);
  console.log(`${colors.cyan}   Alert email: ${ALERT_EMAIL}${colors.reset}`);
  if (!resend) {
    console.log(`${colors.yellow}   ⚠️  Email not configured - alerts will only be logged to console${colors.reset}`);
    console.log(`${colors.gray}   Set RESEND_API_KEY to enable email alerts${colors.reset}`);
  } else {
    console.log(`${colors.green}   ✅ Email alerts enabled (Resend)${colors.reset}`);
    console.log(`${colors.gray}   From: ${FROM_EMAIL}${colors.reset}`);
  }
  console.log(`${colors.gray}   Press Ctrl+C to stop${colors.reset}\n`);
  
  // Run immediately on start
  runMonitoring();
  
  // Then run every configured interval
  setInterval(runMonitoring, SCAN_INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}👋 Shutting down monitor...${colors.reset}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}👋 Shutting down monitor...${colors.reset}`);
  process.exit(0);
});

// Start the service
startMonitoring();

