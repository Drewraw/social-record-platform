/**
 * Download T.G. Bharath profile from MyNeta and save as JSON
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const profileUrl = 'https://www.myneta.info/AndhraPradesh2024/candidate.php?candidate_id=357';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║    DOWNLOADING T.G. BHARATH PROFILE FROM MYNETA            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractValue(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].trim() : 'N/A';
}

async function downloadProfile() {
  try {
    console.log(`📡 Fetching: ${profileUrl}\n`);
    const html = await fetchHTML(profileUrl);
    
    // Extract key information
    const name = extractValue(html, /<h1[^>]*>([^<]+)<\/h1>/i) || 'T.G. Bharath';
    const constituency = extractValue(html, /Constituency[:\s]*<[^>]*>([^<]+)</i);
    const party = extractValue(html, /Party[:\s]*<[^>]*>([^<]+)</i);
    const assets = extractValue(html, /Total Assets[:\s]*<[^>]*>Rs\s*([0-9,]+[^<]*)</i);
    const liabilities = extractValue(html, /Total Liabilities[:\s]*<[^>]*>Rs\s*([0-9,]+[^<]*)</i);
    const criminal = extractValue(html, /Criminal Cases[:\s]*<[^>]*>(\d+)/i);
    const education = extractValue(html, /Education[:\s]*<[^>]*>([^<]+)</i);
    const age = extractValue(html, /Age[:\s]*<[^>]*>(\d+)/i);
    
    console.log('✅ Extracted Profile Data:');
    console.log(`   Name: ${name}`);
    console.log(`   Constituency: ${constituency}`);
    console.log(`   Party: ${party}`);
    console.log(`   Assets: ${assets}`);
    console.log(`   Liabilities: ${liabilities}`);
    console.log(`   Criminal Cases: ${criminal}`);
    console.log(`   Education: ${education}`);
    console.log(`   Age: ${age}\n`);
    
    // Create JSON in MyNeta format
    const jsonData = {
      "_source_url": profileUrl,
      "_scraped_at": new Date().toISOString().slice(0, 19).replace('T', ' '),
      "_page_title": `${name} - ${constituency} - ${party}`,
      "Assets:": {
        "value": assets,
        "sourceUrl": profileUrl
      },
      "Liabilities:": {
        "value": liabilities,
        "sourceUrl": profileUrl
      },
      "Criminal Cases": {
        "value": criminal,
        "sourceUrl": profileUrl
      },
      "Education": {
        "value": education,
        "sourceUrl": profileUrl
      },
      "Age": {
        "value": age,
        "sourceUrl": profileUrl
      },
      "Constituency": {
        "value": constituency,
        "sourceUrl": profileUrl
      },
      "Party": {
        "value": party,
        "sourceUrl": profileUrl
      },
      "_search_result_text": name.replace(/\s+/g, ''),
      "_search_result_index": 0,
      "_total_results": 1
    };
    
    const filename = path.join(__dirname, 'myneta_tg_bharath_0.json');
    fs.writeFileSync(filename, JSON.stringify(jsonData, null, 2));
    
    console.log(`💾 Saved JSON to: ${filename}\n`);
    console.log('📋 Next Step:');
    console.log(`   node myneta-to-scorecard.js myneta_tg_bharath_0.json "T.G. Bharath" "Andhra Pradesh" "MLA"\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

downloadProfile();
