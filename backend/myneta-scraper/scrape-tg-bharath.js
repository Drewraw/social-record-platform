/**
 * Scrape T.G. Bharath from MyNeta
 * URL: https://www.myneta.info/AndhraPradesh2024/candidate.php?candidate_id=357
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║      SCRAPING T.G. BHARATH FROM MYNETA                     ║');
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

async function scrapeTGBharath() {
  const profileUrl = 'https://www.myneta.info/AndhraPradesh2024/candidate.php?candidate_id=357';
  
  console.log(`📡 Fetching profile: ${profileUrl}\n`);
  
  try {
    const html = await fetchHTML(profileUrl);
    
    // Save raw HTML for inspection
    const htmlFile = path.join(__dirname, 'tg-bharath-profile.html');
    fs.writeFileSync(htmlFile, html);
    console.log(`💾 Saved HTML to: ${htmlFile}\n`);
    
    // Extract basic information
    console.log('📋 Extracting Profile Data...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Name
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                      html.match(/<title>([^<]+?)\s*-/i);
    const name = nameMatch ? nameMatch[1].trim() : 'T.G. Bharath';
    console.log(`👤 Name: ${name}`);
    
    // Constituency
    const constituencyMatch = html.match(/Constituency[:\s]*<[^>]*>([^<]+)</i) ||
                              html.match(/Constituency[:\s]*([^\n<]+)/i);
    const constituency = constituencyMatch ? constituencyMatch[1].trim() : 'Kurnool';
    console.log(`📍 Constituency: ${constituency}`);
    
    // Party
    const partyMatch = html.match(/Party[:\s]*<[^>]*>([^<]+)</i) ||
                       html.match(/Party[:\s]*([^\n<]+)/i);
    const party = partyMatch ? partyMatch[1].trim() : 'Unknown';
    console.log(`🏛️  Party: ${party}`);
    
    // Assets
    const assetsMatch = html.match(/Total Assets[:\s]*<[^>]*>Rs\s*([0-9,]+)/i) ||
                        html.match(/Total Assets[:\s]*Rs\s*([0-9,]+)/i);
    const assets = assetsMatch ? assetsMatch[1] : 'Unknown';
    console.log(`💰 Total Assets: Rs ${assets}`);
    
    // Liabilities
    const liabilitiesMatch = html.match(/Total Liabilities[:\s]*<[^>]*>Rs\s*([0-9,]+)/i) ||
                             html.match(/Total Liabilities[:\s]*Rs\s*([0-9,]+)/i);
    const liabilities = liabilitiesMatch ? liabilitiesMatch[1] : '0';
    console.log(`📊 Total Liabilities: Rs ${liabilities}`);
    
    // Criminal Cases
    const criminalMatch = html.match(/Criminal Cases[:\s]*<[^>]*>(\d+)/i) ||
                          html.match(/Criminal Cases[:\s]*(\d+)/i);
    const criminalCases = criminalMatch ? criminalMatch[1] : '0';
    console.log(`⚖️  Criminal Cases: ${criminalCases}`);
    
    // Education
    const educationMatch = html.match(/Education[:\s]*<[^>]*>([^<]+)</i) ||
                           html.match(/Education[:\s]*([^\n<]+)/i);
    const education = educationMatch ? educationMatch[1].trim() : 'Unknown';
    console.log(`🎓 Education: ${education}`);
    
    // Age
    const ageMatch = html.match(/Age[:\s]*<[^>]*>(\d+)/i) ||
                     html.match(/Age[:\s]*(\d+)/i);
    const age = ageMatch ? ageMatch[1] : 'Unknown';
    console.log(`📅 Age: ${age}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Create JSON data file for myneta-to-scorecard.js
    const jsonData = {
      url: profileUrl,
      name: name,
      constituency: constituency,
      party: party,
      state: 'Andhra Pradesh',
      election: '2024',
      assets: assets,
      liabilities: liabilities,
      criminalCases: criminalCases,
      education: education,
      age: age,
      position: 'MLA' // Andhra Pradesh 2024 election
    };
    
    const jsonFile = path.join(__dirname, 'tg-bharath-data.json');
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));
    console.log(`💾 Saved JSON data to: ${jsonFile}\n`);
    
    console.log('✅ Profile data extracted successfully!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Review the data above');
    console.log('   2. Run the main scraper to add to database:');
    console.log('      node myneta-to-scorecard.js tg-bharath-data.json\n');
    console.log('   This will automatically:');
    console.log('   • Fetch profile image from MyNeta or Wikipedia');
    console.log('   • Analyze dynasty status with OpenAI');
    console.log('   • Determine wealth category');
    console.log('   • Extract political relatives');
    console.log('   • Store complete data in database\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

scrapeTGBharath();
