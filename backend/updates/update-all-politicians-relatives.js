/**
 * Update political relatives for ALL politicians in database
 * Uses deep family research for each politician
 */

const { Pool } = require('pg');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Deep family research function
 */
async function researchPoliticalRelatives(politicianName, state) {
  console.log(`\n👨‍👩‍👧‍👦 DEEP FAMILY RESEARCH: ${politicianName}`);
  console.log(`   📚 Sources: Wikipedia → Google → OpenAI\n`);
  
  try {
    // Step 1: Find ALL family members
    console.log('   🔍 Step 1: Finding ALL family members...');
    
    const familyPrompt = `Search for ${politicianName} from ${state}, India using Wikipedia, Google Search, and other sources.

Find ALL family members:
• Parents (father, mother)
• Spouse (wife/husband)
• Children (sons, daughters)
• Siblings (brothers, sisters)
• Grandparents (if notable)
• In-laws (if politically relevant)

For EACH family member, provide:
- Full name
- Relationship
- Brief occupation/background

Format your response as:
Father: [Name] - [occupation]
Mother: [Name] - [occupation]
Spouse: [Name] - [occupation]
Children: [Names with occupations]
Siblings: [Names with occupations]
Grandparents: [Names if notable]

If NO family information available, respond: "NO_FAMILY_INFO"`;

    const familyResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a thorough researcher. Search Wikipedia FIRST (most reliable for family trees), then Google Search results. Extract ALL family members with their occupations."
        },
        {
          role: "user",
          content: familyPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    const familyInfo = familyResponse.choices[0].message.content.trim();
    console.log(`   ✅ Found family information`);
    
    if (familyInfo === 'NO_FAMILY_INFO' || familyInfo.includes('no information') || familyInfo.includes('not available')) {
      console.log(`   ⚠️  No family information available\n`);
      return 'None identified';
    }
    
    // Step 2: Check EACH family member for political connections
    console.log('   🔍 Step 2: Checking EACH family member for political connections...');
    
    const politicalCheckPrompt = `Based on this family information:

${familyInfo}

For ${politicianName} from ${state}, check if ANY of these family members are/were politicians.

🔍 SEARCH EACH PERSON IN:
1. Wikipedia - for political positions
2. Google Search - for political roles (MLA, MP, Minister, CM, PM)
3. OpenAI knowledge - for political activities

For EACH family member who is/was a politician, provide:
Name: [Full name]
Relation: [to ${politicianName}]
Position: [MLA/MP/Minister/CM/PM/etc.]
Party: [Political party if known]

Format: "Name (Relation, Position, Party)"
Example: "Sonia Gandhi (Mother, Former Congress President, INC)"

IMPORTANT:
- Search ALL family members individually
- Include both current and former politicians
- If ANY political relatives found, list them ALL
- If NO political relatives found, respond: "NONE"`;

    const politicalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a thorough political researcher. For EACH family member listed, check if they are/were politicians. Be comprehensive and check all sources."
        },
        {
          role: "user",
          content: politicalCheckPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });
    
    const politicalRelativesResponse = politicalResponse.choices[0].message.content.trim();
    
    if (politicalRelativesResponse === 'NONE' || 
        politicalRelativesResponse.toLowerCase().includes('no political relatives') ||
        politicalRelativesResponse.toLowerCase().includes('none identified')) {
      console.log(`   ✅ No political relatives found (Self-Made)\n`);
      return 'None identified';
    }
    
    // Parse relatives
    const lines = politicalRelativesResponse.split('\n').filter(line => line.trim());
    const relatives = [];
    
    for (const line of lines) {
      // Look for pattern: Name (Relation, Position) or Name (Relation, Position, Party)
      const match = line.match(/(.+?)\s*\(([^,)]+),?\s*([^)]*)\)/);
      if (match) {
        const name = match[1].trim();
        const relation = match[2].trim();
        const position = match[3].trim();
        if (position) {
          relatives.push(`${name} (${relation}, ${position})`);
        } else {
          relatives.push(`${name} (${relation})`);
        }
      } else if (line.includes('(') && line.includes(')')) {
        relatives.push(line.trim());
      }
    }
    
    if (relatives.length === 0) {
      console.log(`   ✅ No political relatives found (Self-Made)\n`);
      return 'None identified';
    }
    
    const relativesStr = relatives.join(', ');
    console.log(`   ✅ Found ${relatives.length} political relative(s)`);
    relatives.forEach(r => console.log(`      • ${r}`));
    console.log('');
    
    return relativesStr;
    
  } catch (error) {
    console.error(`   ❌ Error in family research: ${error.message}\n`);
    return 'Error fetching data';
  }
}

/**
 * Main function to update all politicians
 */
async function updateAllPoliticians() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   UPDATE POLITICAL RELATIVES FOR ALL POLITICIANS           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Get all politicians
    const result = await pool.query(`
      SELECT id, name, state, political_relatives
      FROM officials
      ORDER BY id
    `);
    
    const politicians = result.rows;
    console.log(`📊 Found ${politicians.length} politicians in database\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < politicians.length; i++) {
      const politician = politicians[i];
      const progress = `[${i + 1}/${politicians.length}]`;
      
      console.log(`${progress} Processing: ${politician.name}`);
      console.log(`   Current relatives: ${politician.political_relatives || 'Not set'}`);
      
      // Skip if already has data (unless it's an error)
      if (politician.political_relatives && 
          politician.political_relatives !== 'None identified' &&
          politician.political_relatives !== 'Error fetching data' &&
          politician.political_relatives !== 'To be verified') {
        console.log(`   ⏭️  Skipping - already has relatives data\n`);
        skipped++;
        continue;
      }
      
      // Research political relatives
      const relatives = await researchPoliticalRelatives(
        politician.name,
        politician.state || 'India'
      );
      
      // Update database
      try {
        await pool.query(
          `UPDATE officials 
           SET political_relatives = $1
           WHERE id = $2`,
          [relatives, politician.id]
        );
        
        console.log(`   ✅ Updated: ${relatives}\n`);
        updated++;
        
        // Rate limiting - wait 2 seconds between requests
        if (i < politicians.length - 1) {
          console.log(`   ⏳ Waiting 2 seconds before next politician...\n`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (updateError) {
        console.error(`   ❌ Error updating database: ${updateError.message}\n`);
        errors++;
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log(`   Total politicians: ${politicians.length}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n');
    
    console.log('🎉 All politicians processed!\n');
    console.log('💡 Refresh your browser to see the updated political relations.\n');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the update
updateAllPoliticians();
