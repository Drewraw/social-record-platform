/**
 * Search and scrape T.G. Bharath from MyNeta
 * Kurnool, Andhra Pradesh
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         MYNETA SCRAPER - T.G. BHARATH                      ║');
console.log('║         Kurnool, Andhra Pradesh                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Fetch HTML
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function searchMyNeta() {
  console.log('🔍 Searching MyNeta for: T.G. Bharath, Kurnool, AP\n');
  
  try {
    // Search MyNeta
    const searchQuery = 'T.G.+Bharath+Kurnool+Andhra+Pradesh';
    const searchUrl = `https://myneta.info/search.php?q=${searchQuery}`;
    
    console.log(`📡 Search URL: ${searchUrl}\n`);
    console.log('⏳ Fetching search results...\n');
    
    const searchHtml = await fetchHTML(searchUrl);
    
    // Extract all profile links
    const profileMatches = searchHtml.matchAll(/href="(\/[^"]*profile\.php[^"]*)"/gi);
    const profiles = [...profileMatches].map(m => m[1]);
    
    if (profiles.length === 0) {
      console.log('❌ No profiles found on MyNeta\n');
      console.log('💡 Try alternative searches:');
      console.log('   - Search directly on https://myneta.info/');
      console.log('   - Try "Bharath Kurnool" or "TG Bharath"\n');
      return;
    }
    
    console.log(`✅ Found ${profiles.length} profile(s):\n`);
    
    // Fetch each profile and extract basic info
    for (let i = 0; i < Math.min(profiles.length, 5); i++) {
      const profileUrl = `https://myneta.info${profiles[i]}`;
      console.log(`${i + 1}. Fetching: ${profileUrl}`);
      
      try {
        const profileHtml = await fetchHTML(profileUrl);
        
        // Extract basic info
        const nameMatch = profileHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const constituencyMatch = profileHtml.match(/Constituency[:\s]*([^<\n]+)/i);
        const partyMatch = profileHtml.match(/Party[:\s]*([^<\n]+)/i);
        
        console.log(`   Name: ${nameMatch ? nameMatch[1].trim() : 'Unknown'}`);
        console.log(`   Constituency: ${constituencyMatch ? constituencyMatch[1].trim() : 'Unknown'}`);
        console.log(`   Party: ${partyMatch ? partyMatch[1].trim() : 'Unknown'}\n`);
        
        // Check if this matches "Bharath" and "Kurnool"
        const fullText = profileHtml.toLowerCase();
        if (fullText.includes('bharath') && fullText.includes('kurnool')) {
          console.log('   ✅ MATCH FOUND! This appears to be T.G. Bharath from Kurnool\n');
          
          // Save the HTML for manual inspection
          const filename = path.join(__dirname, 'tg-bharath-myneta.html');
          fs.writeFileSync(filename, profileHtml);
          console.log(`   💾 Saved profile HTML to: ${filename}\n`);
          
          console.log('📋 Next Steps:');
          console.log('   1. Review the HTML file to confirm details');
          console.log('   2. If correct, convert to JSON format');
          console.log('   3. Run: node myneta-to-scorecard.js <json-file>\n');
          
          console.log(`🔗 MyNeta Profile URL: ${profileUrl}\n`);
          return;
        }
        
      } catch (error) {
        console.log(`   ❌ Error fetching profile: ${error.message}\n`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (profiles.length > 5) {
      console.log(`ℹ️  Showing first 5 of ${profiles.length} results\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

searchMyNeta();
