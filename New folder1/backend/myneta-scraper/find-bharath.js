/**
 * Try multiple search variations for T.G. Bharath
 */

const https = require('https');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║    MYNETA SEARCH - MULTIPLE VARIATIONS                     ║');
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

async function trySearch(query) {
  const searchUrl = `https://myneta.info/search.php?q=${encodeURIComponent(query)}`;
  console.log(`🔍 Trying: "${query}"`);
  console.log(`   URL: ${searchUrl}`);
  
  try {
    const html = await fetchHTML(searchUrl);
    const profileMatches = html.matchAll(/href="(\/[^"]*profile\.php[^"]*)"/gi);
    const profiles = [...profileMatches].map(m => m[1]);
    
    console.log(`   Results: ${profiles.length} profile(s) found`);
    
    if (profiles.length > 0) {
      console.log('   ✅ FOUND PROFILES!\n');
      
      // Show first 3 profile URLs
      for (let i = 0; i < Math.min(profiles.length, 3); i++) {
        console.log(`   ${i + 1}. https://myneta.info${profiles[i]}`);
      }
      
      return true;
    } else {
      console.log('   ❌ No results\n');
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function searchMultipleVariations() {
  const variations = [
    'Bharath Kurnool',
    'TG Bharath',
    'T G Bharath',
    'Bharath Andhra Pradesh',
    'Bharath AP MLA',
    'Bharath Kurnool MLA',
    'T Bharath Kurnool'
  ];
  
  console.log('🔍 Searching MyNeta with multiple variations...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  for (const query of variations) {
    const found = await trySearch(query);
    if (found) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✅ SUCCESS! Found profiles with this search term.');
      console.log('\n📋 Next Steps:');
      console.log('   1. Visit the profile URLs above');
      console.log('   2. Verify it\'s the correct T.G. Bharath from Kurnool');
      console.log('   3. If correct, provide the MyNeta profile URL\n');
      return;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n❌ No profiles found with any search variation.');
  console.log('\n💡 Suggestions:');
  console.log('   1. Search manually on https://myneta.info/');
  console.log('   2. Check if the name is spelled differently');
  console.log('   3. Try searching for just "Kurnool" to see all MLAs');
  console.log('   4. If you have the exact MyNeta URL, provide it directly\n');
}

searchMultipleVariations();
