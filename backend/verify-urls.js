require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Verify Source URLs - Check quality and validity of URLs in profile_data
 */
async function verifySourceUrls(politicianName = null) {
  try {
    console.log('🔍 URL Verification Tool\n');
    console.log('================================================================================\n');
    
    let query, params;
    if (politicianName) {
      query = 'SELECT id, name, profile_data FROM officials WHERE name ILIKE $1';
      params = [`%${politicianName}%`];
    } else {
      query = 'SELECT id, name, profile_data FROM officials ORDER BY id DESC';
      params = [];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      console.log('❌ No politicians found.');
      return;
    }
    
    console.log(`📊 Analyzing ${result.rows.length} politician(s):\n`);
    
    for (const official of result.rows) {
      console.log(`\n👤 ${official.name} (ID: ${official.id})`);
      console.log('─'.repeat(80));
      
      if (!official.profile_data) {
        console.log('   ❌ No profile_data found\n');
        continue;
      }
      
      const urlAnalysis = {
        total: 0,
        valid: 0,
        broken: 0,
        placeholder: 0,
        wikipedia: 0,
        myneta: 0,
        news: 0,
        other: 0,
        urls: []
      };
      
      function analyzeUrls(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (key === 'sourceUrl' && typeof value === 'string') {
            urlAnalysis.total++;
            
            const urlInfo = {
              path: currentPath,
              url: value,
              status: '',
              type: ''
            };
            
            // Check if placeholder/invalid
            if (value === '#' || value === '') {
              urlInfo.status = '⚠️  PLACEHOLDER';
              urlAnalysis.placeholder++;
            }
            // Check if missing protocol
            else if (!value.startsWith('http://') && !value.startsWith('https://')) {
              urlInfo.status = '❌ BROKEN (no protocol)';
              urlAnalysis.broken++;
            }
            // Check if starts with //
            else if (value.startsWith('//')) {
              urlInfo.status = '❌ BROKEN (starts with //)';
              urlAnalysis.broken++;
            }
            // Check for fake IDs in MyNeta
            else if (value.includes('myneta.info') && (value.includes('1234') || value.includes('xxxxx') || value.includes('[id]'))) {
              urlInfo.status = '❌ FAKE MyNeta ID';
              urlAnalysis.broken++;
            }
            // Valid URL
            else {
              urlInfo.status = '✅ VALID';
              urlAnalysis.valid++;
              
              // Categorize by source type
              if (value.includes('wikipedia.org')) {
                urlInfo.type = '📚 Wikipedia';
                urlAnalysis.wikipedia++;
              } else if (value.includes('myneta.info')) {
                urlInfo.type = '🗳️  MyNeta';
                urlAnalysis.myneta++;
              } else if (value.includes('indiatoday.in') || value.includes('ft.com') || value.includes('thehindu.com') || value.includes('indianexpress.com')) {
                urlInfo.type = '📰 News';
                urlAnalysis.news++;
              } else {
                urlInfo.type = '🌐 Other';
                urlAnalysis.other++;
              }
            }
            
            urlAnalysis.urls.push(urlInfo);
          } else if (typeof value === 'object' && value !== null && key !== 'sourceUrl') {
            analyzeUrls(value, currentPath);
          }
        }
      }
      
      analyzeUrls(official.profile_data);
      
      // Display summary
      console.log(`\n   📊 Summary:`);
      console.log(`      Total URLs: ${urlAnalysis.total}`);
      console.log(`      ✅ Valid: ${urlAnalysis.valid}`);
      console.log(`      ❌ Broken: ${urlAnalysis.broken}`);
      console.log(`      ⚠️  Placeholder: ${urlAnalysis.placeholder}`);
      
      if (urlAnalysis.valid > 0) {
        console.log(`\n   📚 Sources:`);
        console.log(`      Wikipedia: ${urlAnalysis.wikipedia}`);
        console.log(`      MyNeta: ${urlAnalysis.myneta}`);
        console.log(`      News: ${urlAnalysis.news}`);
        console.log(`      Other: ${urlAnalysis.other}`);
      }
      
      // Show all URLs
      console.log(`\n   📋 All URLs:\n`);
      urlAnalysis.urls.forEach((urlInfo, index) => {
        const fieldName = urlInfo.path.replace(/\.sourceUrl$/, '');
        console.log(`   ${index + 1}. ${urlInfo.status} ${urlInfo.type || ''}`);
        console.log(`      Field: ${fieldName}`);
        console.log(`      URL: ${urlInfo.url}`);
        console.log('');
      });
      
      // Quality score
      const qualityScore = urlAnalysis.total > 0 
        ? Math.round((urlAnalysis.valid / urlAnalysis.total) * 100) 
        : 0;
      
      const scoreEmoji = qualityScore >= 90 ? '🌟' : qualityScore >= 70 ? '👍' : qualityScore >= 50 ? '⚠️' : '❌';
      console.log(`   ${scoreEmoji} URL Quality Score: ${qualityScore}%`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Get politician name from command line
const politicianName = process.argv[2];

if (process.argv.length > 2 && (process.argv[2] === '--help' || process.argv[2] === '-h')) {
  console.log(`
Usage: node verify-urls.js [politician_name]

Examples:
  node verify-urls.js                    # Analyze all politicians
  node verify-urls.js "Amit Shah"       # Analyze specific politician
  node verify-urls.js "Chandrababu"     # Partial name search works

This tool checks:
  ✅ URL validity (proper https:// protocol)
  ❌ Broken URLs (missing protocol, starts with //)
  ⚠️  Fake MyNeta IDs (1234, xxxxx, [id])
  📚 Source distribution (Wikipedia, MyNeta, News)
  🌟 Overall quality score
`);
  process.exit(0);
}

verifySourceUrls(politicianName);
