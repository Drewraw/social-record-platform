/**
 * Enhanced Deep Family Research for Politicians
 * Searches parents, spouse, children, siblings recursively
 */

const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function deepFamilyResearch(politicianName, state) {
  console.log(`\n👨‍👩‍👧‍👦 DEEP FAMILY RESEARCH: ${politicianName}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Step 1: Get family members (parents, spouse, children, siblings)
  console.log('🔍 Step 1: Finding family members...\n');
  
  const familyPrompt = `Search for ${politicianName} from ${state}, India in Wikipedia, Google, and news sources.

Find ALL family members:
1. Parents (father, mother)
2. Spouse
3. Children (sons, daughters)
4. Siblings (brothers, sisters)
5. In-laws (if politically relevant)

For EACH family member found, provide:
- Full name
- Relationship to ${politicianName}
- Brief background (occupation/role)

If you find family members, respond in this format:
Father: [Name] - [occupation]
Mother: [Name] - [occupation]
Spouse: [Name] - [occupation]
Children: [Names with occupations]
Siblings: [Names with occupations]

If NO family information available, respond: "NO_FAMILY_INFO"

Be thorough - check Wikipedia infoboxes, news articles, and biographical sources.`;

  try {
    const familyResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: familyPrompt }],
      temperature: 0.3
    });
    
    const familyInfo = familyResponse.choices[0].message.content.trim();
    console.log('📋 Family Members Found:');
    console.log(familyInfo);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (familyInfo === 'NO_FAMILY_INFO') {
      console.log('⚠️  No family information found\n');
      return 'NONE';
    }
    
    // Step 2: Check each family member for political connections
    console.log('🔍 Step 2: Checking political connections of family members...\n');
    
    const politicalCheckPrompt = `Based on this family information:

${familyInfo}

For ${politicianName} from ${state}, check if ANY of these family members are/were politicians:

Search each person in:
- Wikipedia for political positions
- Google for political roles (MLA, MP, Minister, CM, PM, etc.)
- News articles about political activities

For EACH family member who is/was a politician, provide:
Name: [Full name]
Relationship: [to ${politicianName}]
Position: [MLA/MP/Minister/CM/PM/etc.]
Party: [Political party]
Tenure: [Years active]

If NO political relatives found, respond: "NONE"

If political relatives found, list them clearly.`;

    const politicalResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: politicalCheckPrompt }],
      temperature: 0.3
    });
    
    const politicalRelatives = politicalResponse.choices[0].message.content.trim();
    console.log('🏛️  Political Relatives Check:');
    console.log(politicalRelatives);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (politicalRelatives === 'NONE') {
      console.log('✅ Result: No political relatives found (Self-Made)\n');
      return 'NONE';
    }
    
    // Step 3: Format the final result
    console.log('✅ Political relatives identified!\n');
    return politicalRelatives;
    
  } catch (error) {
    console.error('❌ Error in deep family research:', error.message);
    return 'NONE';
  }
}

// Test with T.G. Bharath
async function testTGBharath() {
  const result = await deepFamilyResearch('T.G. Bharath', 'Andhra Pradesh');
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL RESULT                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(result);
  console.log('\n');
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  testTGBharath();
}

module.exports = { deepFamilyResearch };
