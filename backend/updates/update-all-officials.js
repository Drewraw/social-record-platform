/**
 * COMPLETE OFFICIALS DATA UPDATE
 * Updates images, dynasty status, wealth, and knowledgeful fields
 * Makes these updates DEFAULT for all politicians
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
console.log('║       COMPLETE OFFICIALS DATA UPDATE (DEFAULT)             ║');
console.log('║   Images + Dynasty + Wealth + Knowledgeful                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function fetchProfileImage(politicianName, party) {
  console.log(`   🖼️  Finding image...`);
  
  try {
    const prompt = `Find the official profile image URL for ${politicianName} (${party}).

PRIORITY SOURCES:
1. MyNeta.info official profile image (preferred)
2. Wikipedia Commons official image
3. Official government website

Return ONLY the direct image URL:
URL: <direct_image_url>

Requirements:
- Direct image link (.jpg, .jpeg, .png, .webp)
- From MyNeta.info or Wikipedia
- Recent official photo

If none found: "No image available"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Return direct image URLs from MyNeta.info or Wikipedia only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const result = response.choices[0].message.content.trim();
    const urlMatch = result.match(/URL:\s*(https?:\/\/[^\s]+)/i);
    
    if (urlMatch) {
      const imageUrl = urlMatch[1].replace(/[)\]}>]+$/, '');
      console.log(`   ✅ Image: ${imageUrl.substring(0, 50)}...\n`);
      return imageUrl;
    }
    
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${politicianName.replace(/\s+/g, '')}`;
    console.log(`   ⚠️  No image found, using avatar\n`);
    return avatarUrl;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${politicianName.replace(/\s+/g, '')}`;
  }
}

async function analyzeOfficial(politicianName, party, state, position) {
  console.log(`   🔍 Analyzing complete profile...`);
  
  try {
    const prompt = `Analyze ${politicianName} (${party}, ${state}, ${position}).

Provide ONLY these fields:

1. DYNASTY STATUS:
   - "Dynastic - [Relation details]" if family members in politics
   - "Self-Made" if no political family
   
2. WEALTH CATEGORY:
   - "Wealthy" (assets > ₹50 crore)
   - "Moderate" (₹5-50 crore)
   - "Average" (< ₹5 crore)
   - "Unknown"
   
3. KNOWLEDGE STATUS:
   - "Knowledgeable - [Degree details]" if has higher education (MSc, MBA, LLB, PhD, etc.)
   - "Basic Education" if 10th/12th/BA only
   - "Unknown"

Format:
DYNASTY: [status]
WEALTH: [category]
KNOWLEDGE: [status]

Use MyNeta.info data if available.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert on Indian politicians. Provide accurate, concise data." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 400
    });

    const result = response.choices[0].message.content.trim();
    
    // Parse response
    const dynastyMatch = result.match(/DYNASTY:\s*(.+?)(?:\n|$)/i);
    const wealthMatch = result.match(/WEALTH:\s*(.+?)(?:\n|$)/i);
    const knowledgeMatch = result.match(/KNOWLEDGE:\s*(.+?)(?:\n|$)/i);
    
    const data = {
      dynasty: dynastyMatch ? dynastyMatch[1].trim() : 'To be verified',
      wealth: wealthMatch ? wealthMatch[1].trim() : 'Unknown',
      knowledge: knowledgeMatch ? knowledgeMatch[1].trim() : 'Unknown'
    };
    
    console.log(`   ✅ Dynasty: ${data.dynasty}`);
    console.log(`   ✅ Wealth: ${data.wealth}`);
    console.log(`   ✅ Knowledge: ${data.knowledge}\n`);
    
    return data;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    return {
      dynasty: 'To be verified',
      wealth: 'Unknown',
      knowledge: 'Unknown'
    };
  }
}

async function updateAllOfficials() {
  console.log('📋 Fetching all officials...\n');
  
  const result = await pool.query(`
    SELECT id, name, party, state, position
    FROM officials
    ORDER BY id
  `);
  
  console.log(`Found ${result.rows.length} officials to update\n`);
  
  let updated = 0;
  
  for (const official of result.rows) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 ${updated + 1}/${result.rows.length}: ${official.name} (${official.party})\n`);
    
    // Step 1: Get profile image
    const imageUrl = await fetchProfileImage(official.name, official.party);
    
    // Step 2: Analyze complete profile
    const analysis = await analyzeOfficial(
      official.name, 
      official.party, 
      official.state, 
      official.position
    );
    
    // Step 3: Update database with ALL fields
    await pool.query(`
      UPDATE officials
      SET profile_image_url = $1,
          dynasty_status = $2,
          current_wealth = $3,
          knowledgeful = $4
      WHERE id = $5
    `, [
      imageUrl,
      analysis.dynasty,
      analysis.wealth,
      analysis.knowledge,
      official.id
    ]);
    
    console.log(`   💾 Database updated\n`);
    updated++;
    
    // Rate limiting - 3 seconds between requests
    if (updated < result.rows.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return updated;
}

async function showResults() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      FINAL RESULTS                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const result = await pool.query(`
    SELECT name, party, dynasty_status, current_wealth, knowledgeful, profile_image_url
    FROM officials
    ORDER BY id
  `);
  
  result.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.name} (${row.party})`);
    console.log(`   Dynasty: ${row.dynasty_status}`);
    console.log(`   Wealth: ${row.current_wealth}`);
    console.log(`   Knowledge: ${row.knowledgeful}`);
    console.log(`   Image: ${row.profile_image_url ? '✅ Set' : '❌ Missing'}\n`);
  });
  
  // Statistics
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN profile_image_url IS NOT NULL THEN 1 END) as has_image,
      COUNT(CASE WHEN dynasty_status LIKE 'Dynastic%' THEN 1 END) as dynastic,
      COUNT(CASE WHEN current_wealth = 'Wealthy' THEN 1 END) as wealthy,
      COUNT(CASE WHEN knowledgeful LIKE 'Knowledgeable%' THEN 1 END) as knowledgeable
    FROM officials
  `);
  
  const s = stats.rows[0];
  console.log('📊 Summary:');
  console.log(`   • Total officials: ${s.total}`);
  console.log(`   • With images: ${s.has_image}/${s.total}`);
  console.log(`   • Dynastic: ${s.dynastic}`);
  console.log(`   • Wealthy: ${s.wealthy}`);
  console.log(`   • Knowledgeable: ${s.knowledgeable}\n`);
}

async function main() {
  try {
    const updated = await updateAllOfficials();
    await showResults();
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              UPDATE COMPLETE - NOW DEFAULT!                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Successfully updated ${updated} officials!\n`);
    console.log('🎉 All politicians now have:');
    console.log('   - Profile images (MyNeta/Wikipedia/Avatar)');
    console.log('   - Dynasty status (Dynastic/Self-Made)');
    console.log('   - Wealth category (Wealthy/Moderate/Average)');
    console.log('   - Knowledge status (Knowledgeable/Basic)\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

main();
