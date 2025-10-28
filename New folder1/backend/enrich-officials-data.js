/**
 * ENRICH EXISTING OFFICIALS DATA
 * Updates political_relatives, current_wealth, and knowledgeful fields
 * for all existing officials using multi-source priority
 */

require('dotenv').config();
const { Pool } = require('pg');
const OpenAI = require('openai');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          ENRICH OFFICIALS DATA                             ║');
console.log('║   Updates political_relatives & wealth data                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function fetchProfileImage(politicianName, party) {
  console.log(`   🖼️  Searching for profile image for ${politicianName}...`);
  
  try {
    const prompt = `Find the official profile image URL for ${politicianName} (${party}).

PRIORITY SOURCES:
1. MyNeta.info official profile image
2. Wikipedia Commons official image
3. Official government website photo

Return ONLY the direct image URL in this format:
URL: <direct_image_url>

If no image found: "No image available"

Requirements:
- Must be a direct image URL (.jpg, .jpeg, .png, .webp)
- Must be from a reliable source
- Prefer recent, official photos`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an image URL finder. Return only direct image URLs from MyNeta or Wikipedia." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const result = response.choices[0].message.content.trim();
    
    // Extract URL if present
    const urlMatch = result.match(/URL:\s*(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      const imageUrl = urlMatch[1];
      console.log(`   ✅ Found image: ${imageUrl}\n`);
      return imageUrl;
    }
    
    // Fallback to generated avatar
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${politicianName.replace(/\s+/g, '')}`;
    console.log(`   ⚠️  No image found, using avatar: ${avatarUrl}\n`);
    return avatarUrl;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${politicianName.replace(/\s+/g, '')}`;
    return avatarUrl;
  }
}

async function fetchPoliticalRelatives(politicianName, party, state) {
  console.log(`   🔍 Finding political relatives for ${politicianName}...`);
  
  try {
    const prompt = `SEARCH PRIORITY ORDER:
1. Database (already checked - None found)
2. MyNeta.info (PRIMARY SOURCE - Most reliable for Indian politicians)
3. OpenAI Knowledge Base
4. Wikipedia

Find ALL family members of ${politicianName} (${party}, ${state}) who are or were politicians.

Return format:
- Name (Relationship, Position/Party, Active Status)
Example: "Y. S. Rajasekhara Reddy (Father, Former CM of AP, Deceased)"

If NO political relatives found: "None identified"
If unknown: "To be verified"

Be thorough - include parents, siblings, spouses, children, in-laws.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert on Indian politics and political dynasties. Provide accurate family relationships." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const relatives = response.choices[0].message.content.trim();
    console.log(`   ✅ Found: ${relatives}\n`);
    return relatives;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    return 'To be verified';
  }
}

async function updateWealthInfo(politicianName, party, state) {
  console.log(`   💰 Checking wealth info for ${politicianName}...`);
  
  try {
    const prompt = `Search MyNeta.info and other sources for ${politicianName} (${party}, ${state}).

Provide:
1. Current declared assets (latest available)
2. Family wealth estimate
3. Wealth category: "Wealthy" (>50 crore), "Moderate" (5-50 crore), "Average" (<5 crore), or "Unknown"

Format:
Current: ₹XX crore (Year)
Family: ₹XX crore (estimated)
Category: [Wealthy/Moderate/Average]

If data unavailable: "Unknown"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert on Indian politician asset declarations. Be accurate and cite MyNeta when available." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    const wealthInfo = response.choices[0].message.content.trim();
    console.log(`   ✅ ${wealthInfo}\n`);
    
    // Parse for current_wealth category
    const lines = wealthInfo.split('\n');
    const categoryLine = lines.find(l => l.toLowerCase().includes('category:'));
    const category = categoryLine ? categoryLine.split(':')[1].trim() : 'Unknown';
    
    return { fullInfo: wealthInfo, category };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    return { fullInfo: 'Unknown', category: 'Unknown' };
  }
}

async function enrichOfficials() {
  console.log('📋 Fetching officials to enrich...\n');
  
  const result = await pool.query(`
    SELECT id, name, party, state
    FROM officials
    WHERE political_relatives = 'None identified'
       OR political_relatives IS NULL
    ORDER BY id
  `);
  
  console.log(`Found ${result.rows.length} officials to enrich\n`);
  
  let updated = 0;
  
  for (const official of result.rows) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 Processing: ${official.name} (${official.party})\n`);
    
    // Get profile image
    const imageUrl = await fetchProfileImage(
      official.name,
      official.party
    );
    
    // Get political relatives
    const relatives = await fetchPoliticalRelatives(
      official.name,
      official.party,
      official.state
    );
    
    // Get wealth info
    const wealth = await updateWealthInfo(
      official.name,
      official.party,
      official.state
    );
    
    // Update database
    await pool.query(`
      UPDATE officials
      SET political_relatives = $1,
          current_wealth = $2,
          profile_image_url = $3
      WHERE id = $4
    `, [relatives, wealth.category, imageUrl, official.id]);
    
    console.log(`   💾 Updated database for ${official.name}\n`);
    updated++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return updated;
}

async function showResults() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    ENRICHMENT RESULTS                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const result = await pool.query(`
    SELECT name, party, political_relatives, current_wealth, profile_image_url
    FROM officials
    ORDER BY id
  `);
  
  result.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.name} (${row.party})`);
    console.log(`   Relatives: ${row.political_relatives}`);
    console.log(`   Wealth: ${row.current_wealth}`);
    console.log(`   Image: ${row.profile_image_url ? row.profile_image_url.substring(0, 60) + '...' : 'None'}\n`);
  });
  
  // Statistics
  const stats = await pool.query(`
    SELECT 
      COUNT(CASE WHEN political_relatives != 'None identified' AND political_relatives != 'To be verified' THEN 1 END) as has_relatives,
      COUNT(CASE WHEN current_wealth = 'Wealthy' THEN 1 END) as wealthy,
      COUNT(CASE WHEN current_wealth = 'Moderate' THEN 1 END) as moderate,
      COUNT(*) as total
    FROM officials
  `);
  
  const s = stats.rows[0];
  console.log('📊 Summary:');
  console.log(`   • Officials with political relatives: ${s.has_relatives}/${s.total}`);
  console.log(`   • Wealthy officials: ${s.wealthy}`);
  console.log(`   • Moderate wealth: ${s.moderate}\n`);
}

async function main() {
  try {
    const updated = await enrichOfficials();
    await showResults();
    
    console.log(`✅ Successfully enriched data for ${updated} officials!\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

main();
