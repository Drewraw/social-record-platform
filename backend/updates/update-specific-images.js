/**
 * Update specific politicians with real images
 * Checks Chandrababu Naidu and YS Jagan Mohan Reddy
 */

const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Fetch HTML from URL
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Search MyNeta and get image
async function getMyNetaImage(politicianName) {
  console.log(`   🔍 Searching MyNeta for: ${politicianName}`);
  
  try {
    const searchQuery = politicianName.replace(/\s+/g, '+');
    const searchUrl = `https://myneta.info/search.php?q=${searchQuery}`;
    
    const html = await fetchHTML(searchUrl);
    
    // Find profile link
    const profileLinkMatch = html.match(/href="(\/[^"]*profile\.php[^"]*)"/i);
    
    if (!profileLinkMatch) {
      console.log(`   ⚠️  No MyNeta profile found`);
      return null;
    }
    
    const profileUrl = `https://myneta.info${profileLinkMatch[1]}`;
    console.log(`   ✅ Profile: ${profileUrl}`);
    
    // Fetch profile page
    const profileHtml = await fetchHTML(profileUrl);
    
    // Extract image
    const imagePatterns = [
      /<img[^>]+src="([^"]*images\/[^"]*candidate[^"]*\.(?:jpg|jpeg|png|gif))"/i,
      /<img[^>]+src="([^"]*images\/person[^"]*\.(?:jpg|jpeg|png|gif))"/i,
      /<img[^>]+src="([^"]*images\/[^"]*\.(?:jpg|jpeg|png|gif))"[^>]*class="[^"]*photo[^"]*"/i
    ];
    
    for (const pattern of imagePatterns) {
      const match = profileHtml.match(pattern);
      if (match) {
        let imageUrl = match[1];
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://myneta.info${imageUrl}`;
        } else if (!imageUrl.startsWith('http')) {
          imageUrl = `https://myneta.info/${imageUrl}`;
        }
        console.log(`   🖼️  MyNeta image: ${imageUrl}`);
        return imageUrl;
      }
    }
    
    console.log(`   ⚠️  No image on profile page`);
    return null;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Get Wikipedia image
async function getWikipediaImage(politicianName) {
  console.log(`   🌐 Trying Wikipedia...`);
  
  try {
    const searchQuery = politicianName.replace(/\s+/g, '_');
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${searchQuery}&prop=pageimages&format=json&pithumbsize=500`;
    
    const data = await fetchHTML(apiUrl);
    const parsed = JSON.parse(data);
    const pages = parsed.query?.pages;
    
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const imageUrl = pages[pageId]?.thumbnail?.source;
      
      if (imageUrl) {
        console.log(`   ✅ Wikipedia image: ${imageUrl}`);
        return imageUrl;
      }
    }
    
    console.log(`   ⚠️  No Wikipedia image`);
    return null;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function updatePolitician(id, name) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 ${name}\n`);
  
  // Try MyNeta first
  let imageUrl = await getMyNetaImage(name);
  let source = 'myneta';
  
  // Try Wikipedia if MyNeta fails
  if (!imageUrl) {
    imageUrl = await getWikipediaImage(name);
    source = imageUrl ? 'wikipedia' : null;
  }
  
  if (!imageUrl) {
    console.log(`   ❌ No image found for ${name}\n`);
    return false;
  }
  
  // Update database
  await pool.query(
    'UPDATE officials SET profile_image_url = $1 WHERE id = $2',
    [imageUrl, id]
  );
  
  console.log(`   💾 Updated! (Source: ${source})\n`);
  return true;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      UPDATE SPECIFIC POLITICIANS WITH REAL IMAGES         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Get politicians to update
  const result = await pool.query(`
    SELECT id, name, profile_image_url 
    FROM officials 
    WHERE name LIKE '%Chandrababu%' OR name LIKE '%Jagan%'
    ORDER BY id
  `);
  
  console.log(`Found ${result.rows.length} politicians to check:\n`);
  
  result.rows.forEach(row => {
    const isAvatar = row.profile_image_url && row.profile_image_url.includes('dicebear');
    console.log(`• ${row.name}`);
    console.log(`  Current: ${isAvatar ? '👤 Avatar (needs update)' : '🖼️  Real image'}`);
    console.log(`  URL: ${row.profile_image_url}\n`);
  });
  
  console.log('Starting updates...\n');
  
  let updated = 0;
  for (const row of result.rows) {
    const success = await updatePolitician(row.id, row.name);
    if (success) updated++;
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    UPDATE COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Updated ${updated}/${result.rows.length} politicians with real images\n`);
  
  // Show final result
  const finalResult = await pool.query(`
    SELECT id, name, profile_image_url 
    FROM officials 
    WHERE name LIKE '%Chandrababu%' OR name LIKE '%Jagan%'
    ORDER BY id
  `);
  
  console.log('📊 Final Status:\n');
  finalResult.rows.forEach(row => {
    const isAvatar = row.profile_image_url && row.profile_image_url.includes('dicebear');
    const isMyNeta = row.profile_image_url && row.profile_image_url.includes('myneta');
    const isWikipedia = row.profile_image_url && row.profile_image_url.includes('wikipedia');
    
    let source = '❓ Unknown';
    if (isMyNeta) source = '🏛️  MyNeta';
    else if (isWikipedia) source = '🌐 Wikipedia';
    else if (isAvatar) source = '👤 Avatar';
    
    console.log(`• ${row.name}`);
    console.log(`  ${source}: ${row.profile_image_url.substring(0, 70)}...\n`);
  });
  
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  pool.end();
});
