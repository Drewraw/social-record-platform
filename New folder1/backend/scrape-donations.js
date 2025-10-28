/**
 * AUTOMATED POLITICAL DONATIONS SCRAPER
 * Runs periodically to find and extract donations from news articles
 * 
 * Features:
 * - Searches Google/DuckDuckGo for recent donation articles
 * - Extracts donation info using OpenAI
 * - Automatically stores in database
 * - Avoids duplicates
 * 
 * Usage: node automated-donations-scraper.js [search_query]
 */

require('dotenv').config();
const OpenAI = require('openai');
const { Pool } = require('pg');
const https = require('https');
const http = require('http');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// News sources to search
const NEWS_SOURCES = [
  'economictimes.indiatimes.com',
  'thehindu.com',
  'indianexpress.com',
  'hindustantimes.com',
  'timesofindia.indiatimes.com',
  'ndtv.com',
  'thewire.in'
];

// Political parties to track
const PARTIES = ['BJP', 'Congress', 'INC', 'AAP', 'TMC', 'DMK', 'TDP', 'YSRCP', 'Shiv Sena'];

/**
 * Search DuckDuckGo for donation articles
 */
async function searchDonationArticles(query, maxResults = 10) {
  console.log(`\n🔍 Searching for: "${query}"\n`);
  
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  return new Promise((resolve, reject) => {
    https.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = parseSearchResults(data, maxResults);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Parse search results HTML
 */
function parseSearchResults(html, maxResults) {
  const results = [];
  
  // Simple regex to find links and titles
  const linkPattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)</g;
  
  let match;
  while ((match = linkPattern.exec(html)) !== null && results.length < maxResults) {
    const url = match[1];
    const title = match[2].trim();
    
    // Filter for relevant news sources
    if (NEWS_SOURCES.some(source => url.includes(source))) {
      results.push({ url, title });
      console.log(`   ✅ Found: ${title}`);
    }
  }
  
  console.log(`\n   📊 Found ${results.length} relevant articles\n`);
  return results;
}

/**
 * Fetch article content
 */
async function fetchArticle(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Clean HTML to text
 */
function htmlToText(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract donations from article using OpenAI
 */
async function extractDonations(articleUrl, articleText, articleTitle) {
  const prompt = `Analyze this Indian political news article for donation information.

ARTICLE TITLE: ${articleTitle}
ARTICLE URL: ${articleUrl}

ARTICLE TEXT (first 3000 chars):
${articleText.substring(0, 3000)}

EXTRACT ALL political donations/funding mentioned:

For EACH donation, provide in this EXACT format:
DONATION:
Donor: [Full company/individual name]
Type: [Private Company/Public Company/Individual]
Amount: [Exact amount with currency, or "Not specified"]
Year: [Year, or current year if recent]
Recipient: [Political party name OR politician name]
RecipientType: [Party/Politician/Both]

IMPORTANT:
- Only extract explicitly mentioned donations
- Convert lakhs/crores: "50 lakh" = 5000000, "2 crore" = 20000000
- Include company type (Private/Public)
- Specify if donation is to party or individual politician

If NO donations found, respond with: NO_DATA`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting structured political donation data from Indian news articles. Be precise and only extract explicitly stated information. Focus on electoral bonds, corporate donations, and party funding."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500
    });
    
    const response = completion.choices[0].message.content.trim();
    
    if (response === 'NO_DATA' || response.includes('NO_DATA')) {
      return [];
    }
    
    // Parse response
    const donations = [];
    const lines = response.split('\n');
    let current = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('DONATION:')) {
        if (Object.keys(current).length > 0 && current.donor_name) {
          donations.push(current);
        }
        current = {};
      } else if (trimmed.startsWith('Donor:')) {
        current.donor_name = trimmed.replace('Donor:', '').trim();
      } else if (trimmed.startsWith('Type:')) {
        current.donor_type = trimmed.replace('Type:', '').trim();
      } else if (trimmed.startsWith('Amount:')) {
        const amountStr = trimmed.replace('Amount:', '').trim();
        if (!amountStr.includes('Not specified')) {
          const numMatch = amountStr.match(/[\d,]+\.?\d*/);
          if (numMatch) {
            let amount = parseFloat(numMatch[0].replace(/,/g, ''));
            if (amountStr.toLowerCase().includes('crore')) amount *= 10000000;
            else if (amountStr.toLowerCase().includes('lakh')) amount *= 100000;
            current.amount = amount;
          }
        }
      } else if (trimmed.startsWith('Year:')) {
        const yearMatch = trimmed.match(/\d{4}/);
        if (yearMatch) current.year = parseInt(yearMatch[0]);
      } else if (trimmed.startsWith('Recipient:')) {
        current.recipient = trimmed.replace('Recipient:', '').trim();
      } else if (trimmed.startsWith('RecipientType:')) {
        current.recipient_type = trimmed.replace('RecipientType:', '').trim();
      }
    }
    
    if (Object.keys(current).length > 0 && current.donor_name) {
      donations.push(current);
    }
    
    return donations;
    
  } catch (error) {
    console.error(`   ❌ OpenAI Error: ${error.message}`);
    return [];
  }
}

/**
 * Store donations in database
 */
async function storeDonations(donations, sourceUrl) {
  let stored = 0;
  let skipped = 0;
  
  for (const donation of donations) {
    try {
      // Check if already exists
      const existing = await pool.query(
        `SELECT id FROM political_donations 
         WHERE donor_name = $1 AND COALESCE(year, 0) = COALESCE($2, 0)`,
        [donation.donor_name, donation.year || null]
      );
      
      if (existing.rows.length > 0) {
        console.log(`   ⏭️  Skip: ${donation.donor_name} (already exists)`);
        skipped++;
        continue;
      }
      
      // Determine party name
      let partyName = null;
      if (donation.recipient_type === 'Party' || donation.recipient_type === 'Both') {
        partyName = donation.recipient;
      }
      
      // Insert
      const result = await pool.query(
        `INSERT INTO political_donations (
          politician_id, donor_name, donor_type, amount, year,
          source_url, source_type, verified, notes,
          donation_recipient_type, party_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          null, // Will link to politician later if needed
          donation.donor_name,
          donation.donor_type || 'Unknown',
          donation.amount || null,
          donation.year || new Date().getFullYear(),
          sourceUrl,
          'News Article',
          false, // Needs manual verification
          `Auto-extracted from ${new URL(sourceUrl).hostname}`,
          donation.recipient_type || 'Party',
          partyName
        ]
      );
      
      console.log(`   ✅ Stored: ${donation.donor_name} → ${donation.recipient}`);
      if (donation.amount) {
        console.log(`      Amount: ₹${donation.amount.toLocaleString('en-IN')}`);
      }
      stored++;
      
    } catch (error) {
      console.error(`   ❌ DB Error for ${donation.donor_name}: ${error.message}`);
    }
  }
  
  return { stored, skipped };
}

/**
 * Process a single article
 */
async function processArticle(article) {
  console.log(`\n📰 Processing: ${article.title}`);
  console.log(`   URL: ${article.url}`);
  
  try {
    // Fetch article
    console.log(`   🌐 Fetching...`);
    const html = await fetchArticle(article.url);
    const text = htmlToText(html);
    
    if (text.length < 200) {
      console.log(`   ⚠️  Article too short (${text.length} chars), skipping`);
      return { donations: 0, stored: 0 };
    }
    
    console.log(`   ✅ Downloaded ${text.length} characters`);
    
    // Extract donations
    console.log(`   🤖 Extracting donations with AI...`);
    const donations = await extractDonations(article.url, text, article.title);
    
    if (donations.length === 0) {
      console.log(`   ℹ️  No donations found`);
      return { donations: 0, stored: 0 };
    }
    
    console.log(`   ✅ Found ${donations.length} donation(s)`);
    
    // Store in database
    const { stored, skipped } = await storeDonations(donations, article.url);
    
    return { donations: donations.length, stored, skipped };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { donations: 0, stored: 0 };
  }
}

/**
 * Main automated scraper
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       AUTOMATED POLITICAL DONATIONS SCRAPER                ║');
  console.log('║       Searches news → Extracts donations → Stores data     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const customQuery = process.argv[2];
  
  // Build search queries
  const queries = customQuery ? [customQuery] : [
    'BJP political donations India 2024 2025',
    'Congress INC party funding donations 2024',
    'electoral bonds political parties India',
    'corporate donations Indian political parties',
    'TDP donations Andhra Pradesh',
    'YSRCP party funding',
    'political funding transparency India'
  ];
  
  let totalArticles = 0;
  let totalDonations = 0;
  let totalStored = 0;
  
  for (const query of queries) {
    try {
      // Search for articles
      const articles = await searchDonationArticles(query, 5);
      totalArticles += articles.length;
      
      // Process each article
      for (const article of articles) {
        const result = await processArticle(article);
        totalDonations += result.donations;
        totalStored += result.stored;
        
        // Rate limiting - wait 2 seconds between articles
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Wait between search queries
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`\n❌ Error with query "${query}": ${error.message}\n`);
    }
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`   📰 Articles processed: ${totalArticles}`);
  console.log(`   💰 Donations found: ${totalDonations}`);
  console.log(`   💾 Stored in database: ${totalStored}`);
  console.log(`   🔄 Next run: Schedule with cron or Task Scheduler\n`);
  
  await pool.end();
}

main().catch(console.error);
