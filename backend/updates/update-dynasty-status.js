/**
 * Update dynasty status for existing politicians
 * Queries OpenAI to check if politicians are dynastic or self-made
 */

const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Check dynasty status and family wealth using OpenAI + Wikipedia (with database profile context)
 */
async function checkDynastyStatus(politicianName, state, profileData = null) {
  try {
    console.log(`   🔍 Checking dynasty status for ${politicianName}...`);
    
    let contextInfo = '';
    let assetInfo = '';
    
    // Use provided profile data or query database
    if (!profileData) {
      const existingQuery = `
        SELECT profile_data 
        FROM officials 
        WHERE LOWER(name) = LOWER($1)
        LIMIT 1
      `;
      
      const result = await pool.query(existingQuery, [politicianName]);
      if (result.rows.length > 0) {
        profileData = result.rows[0].profile_data;
      }
    }
    
    if (profileData) {
      console.log(`   📂 Using stored profile data for context`);
      
      // Extract relevant information
      const education = profileData.education?.value || '';
      const background = profileData.politicalBackground?.careerHighlight?.value || '';
      const party = profileData.currentOfficeParty?.party?.value || '';
      const assets = profileData.assetsFinancials?.totalAssets?.value || '';
      
      contextInfo = `\n\nReference from stored profile:
- Education: ${education}
- Background: ${background}
- Party: ${party}`;

      if (assets) {
        assetInfo = `\n- Current Assets: ${assets}`;
        contextInfo += assetInfo;
      }
    }
    
    const prompt = `Is ${politicianName} from ${state} a dynastic politician or self-made? Also determine if their family background is wealthy.

SOURCES TO USE:
- Wikipedia ONLY
- Reliable political encyclopedias
- Official political records
${contextInfo}

SOURCES TO IGNORE:
- MyNeta.info affidavits (unless for wealth verification)
- Asset declarations (only for current wealth context)
- Criminal case records

Check for:
1. DYNASTY STATUS - Family connections to:
   - Former/current Chief Ministers, Prime Ministers
   - MPs, MLAs, Ministers in their family
   - Political dynasty families (Gandhi, Reddy, Thackeray, Yadav, Pawar, etc.)
   - If NO political family connections, mark as "Self-made"

2. FAMILY WEALTH - Based on net worth:
   - "Wealthy" ONLY if net worth is above ₹2 crores (₹20 million)
   - "Not wealthy" if net worth is below ₹2 crores
   ${assetInfo ? '\n   - Current assets from database: ' + assetInfo : ''}
   - Consider: business ownership, land holdings, total assets
   - Threshold: Must exceed ₹2 crore to be marked as "Wealthy"

Respond in this EXACT format on TWO lines:
Dynasty: [Dynastic - relationship | Self-made]
Wealth: [Wealthy | Not wealthy | Unknown]

Examples:
Dynasty: Dynastic - Son of former Chief Minister Y. S. Rajasekhara Reddy
Wealth: Wealthy

Dynasty: Self-made
Wealth: Not wealthy

Dynasty: Dynastic - Member of Nehru-Gandhi family
Wealth: Wealthy

Be concise and factual based on Wikipedia.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a political researcher who verifies dynasty status and wealth of Indian politicians using Wikipedia and reliable sources ONLY. Mark as "Self-made" if no political family. Mark as "Wealthy" ONLY if net worth exceeds ₹2 crores. Be factual and concise.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 200
    });

    const fullResponse = response.choices[0].message.content.trim();
    
    // Parse the response
    const dynastyMatch = fullResponse.match(/Dynasty:\s*(.+)/);
    const wealthMatch = fullResponse.match(/Wealth:\s*(.+)/);
    
    const dynastyStatus = dynastyMatch ? dynastyMatch[1].trim() : 'To be verified';
    const familyWealth = wealthMatch ? wealthMatch[1].trim() : 'Unknown';
    
    console.log(`   ✓ Dynasty Status: ${dynastyStatus}`);
    console.log(`   💰 Family Wealth: ${familyWealth}`);
    console.log(`   📖 Source: OpenAI + Wikipedia`);
    
    // Return both as a combined string
    return `${dynastyStatus} | Family: ${familyWealth}`;
    
  } catch (error) {
    console.error('   ⚠️  Error checking dynasty status:', error.message);
    return 'To be verified | Family: Unknown';
  }
}

/**
 * Update dynasty status in database
 */
async function updateDynastyInDB(officialId, name, dynastyStatus) {
  const updateQuery = `
    UPDATE officials 
    SET profile_data = jsonb_set(
      profile_data,
      '{politicalBackground,dynastyStatus,value}',
      $1
    )
    WHERE id = $2
  `;
  
  await pool.query(updateQuery, [JSON.stringify(dynastyStatus), officialId]);
  console.log(`   ✅ Updated database for ${name} (ID: ${officialId})\n`);
}

/**
 * Main process
 */
async function updateAllDynastyStatuses() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('Dynasty Status Updater');
    console.log('='.repeat(80) + '\n');
    
    // Get all politicians with "To be verified" dynasty status
    const query = `
      SELECT id, name, state, profile_data
      FROM officials
      WHERE profile_data->'politicalBackground'->'dynastyStatus'->>'value' = 'To be verified'
         OR profile_data->'politicalBackground'->'dynastyStatus'->>'value' IS NULL
      ORDER BY id
    `;
    
    const result = await pool.query(query);
    console.log(`📋 Found ${result.rows.length} politicians to update:\n`);
    
    for (const row of result.rows) {
      console.log(`👤 ${row.name} (ID: ${row.id})`);
      
      // Check dynasty status with profile data
      const dynastyStatus = await checkDynastyStatus(row.name, row.state, row.profile_data);
      
      // Update database
      await updateDynastyInDB(row.id, row.name, dynastyStatus);
    }
    
    console.log('='.repeat(80));
    console.log('✨ Dynasty status update completed!\n');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Command-line interface
if (require.main === module) {
  updateAllDynastyStatuses();
}

module.exports = { checkDynastyStatus, updateDynastyInDB };
