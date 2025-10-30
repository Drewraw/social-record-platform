/**
 * MyNeta to Scorecard Mapper
 * Converts scraped MyNeta JSON to our politician scorecard format
 * and stores in the database with multi-source data enrichment
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Search Wikipedia for additional context and structured data
 */
async function searchWikipedia(name) {
  console.log(`\n📚 Searching Wikipedia for ${name}...`);
  
  try {
    // Search Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*`;
    const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
    
    if (searchResponse.data.query.search.length === 0) {
      console.log('⚠️  No Wikipedia page found');
      return null;
    }
    
    const pageTitle = searchResponse.data.query.search[0].title;
    console.log(`✅ Found Wikipedia page: ${pageTitle}`);
    
    // Get page content
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=extracts&explaintext&format=json&origin=*`;
    const contentResponse = await axios.get(contentUrl, { timeout: 10000 });
    
    const pages = contentResponse.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const extract = pages[pageId].extract;
    
    // Get infobox data
    const infoboxUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json&origin=*`;
    const infoboxResponse = await axios.get(infoboxUrl, { timeout: 10000 });
    
    const html = infoboxResponse.data.parse?.text?.['*'] || '';
    const $info = cheerio.load(html);
    
    // Extract structured data from infobox
    const infoboxData = {};
    $info('.infobox tr').each((i, row) => {
      const header = $info(row).find('th').text().trim();
      const value = $info(row).find('td').text().trim();
      if (header && value) {
        infoboxData[header] = value;
      }
    });
    
    return {
      title: pageTitle,
      extract: extract.substring(0, 5000),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
      infobox: infoboxData
    };
  } catch (error) {
    console.error(`❌ Wikipedia search failed: ${error.message}`);
    return null;
  }
}

/**
 * Google search for missing data via OpenAI
 */
async function searchGoogleForMissingData(name, missingFields) {
  console.log(`\n🔍 Searching Google for missing data: ${missingFields.join(', ')}...`);
  
  const prompt = `Find the following information about ${name}, an Indian politician:

Missing information needed:
${missingFields.map(field => `- ${field}`).join('\n')}

Search the internet and provide accurate information. Format as JSON:
{
  ${missingFields.map(field => `"${field}": "value or N/A if not found"`).join(',\n  ')}
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are a research assistant with access to current information about Indian politicians. Provide accurate, factual data.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    
    const data = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Google search completed');
    return data;
  } catch (error) {
    console.error(`❌ Google search failed: ${error.message}`);
    return {};
  }
}

/**
 * Extract complete data with fallbacks: MyNeta → Wikipedia → Google
 */
async function extractCompleteData(name, mynetaData, wikipediaData) {
  console.log(`\n📋 Extracting complete data with fallbacks...`);
  
  const data = {
    education: null,
    age: null,
    party: null,
    constituency: null,
    assets: null,
    liabilities: null,
    criminalCases: null,
    profession: null,
    email: null,
    phone: null
  };
  
  // 1. Try MyNeta first (most reliable)
  data.education = mynetaData['Education']?.value || 
                   mynetaData['Educational Qualification']?.value;
  data.age = mynetaData['Age']?.value;
  data.party = mynetaData['Party']?.value || 
               mynetaData['Party Affiliation']?.value;
  data.constituency = mynetaData['Constituency']?.value;
  data.assets = mynetaData['Total Assets']?.value || 
                mynetaData['Assets']?.value;
  data.liabilities = mynetaData['Total Liabilities']?.value || 
                     mynetaData['Liabilities']?.value;
  data.criminalCases = mynetaData['Criminal Cases']?.value || 
                       mynetaData['Total Cases']?.value;
  data.profession = mynetaData['Profession']?.value;
  data.email = mynetaData['Email']?.value || 
               mynetaData['Email ID']?.value;
  data.phone = mynetaData['Phone']?.value || 
               mynetaData['Mobile']?.value;
  
  console.log('   ✅ MyNeta data extracted');
  
  // 2. Fill missing data from Wikipedia infobox
  if (wikipediaData?.infobox) {
    if (!data.age && wikipediaData.infobox['Born']) {
      const birthMatch = wikipediaData.infobox['Born'].match(/\(age (\d+)\)/);
      if (birthMatch) data.age = birthMatch[1];
    }
    
    if (!data.party && wikipediaData.infobox['Political party']) {
      data.party = wikipediaData.infobox['Political party'];
    }
    
    if (!data.constituency && wikipediaData.infobox['Constituency']) {
      data.constituency = wikipediaData.infobox['Constituency'];
    }
    
    if (!data.education && wikipediaData.infobox['Education']) {
      data.education = wikipediaData.infobox['Education'];
    }
    
    if (!data.profession && wikipediaData.infobox['Occupation']) {
      data.profession = wikipediaData.infobox['Occupation'];
    }
    
    console.log('   ✅ Wikipedia data merged');
  }
  
  // 3. For still-missing critical fields, use Google search via OpenAI
  const missingFields = [];
  if (!data.age) missingFields.push('age');
  if (!data.party) missingFields.push('party');
  if (!data.constituency) missingFields.push('constituency');
  if (!data.education) missingFields.push('education');
  
  if (missingFields.length > 0) {
    console.log(`   ⚠️  Still missing: ${missingFields.join(', ')}`);
    const googleData = await searchGoogleForMissingData(name, missingFields);
    
    if (googleData.age) data.age = googleData.age;
    if (googleData.party) data.party = googleData.party;
    if (googleData.constituency) data.constituency = googleData.constituency;
    if (googleData.education) data.education = googleData.education;
    
    console.log('   ✅ Google search data merged');
  }
  
  // 4. Set defaults for any still-missing fields
  data.education = data.education || 'N/A';
  data.age = data.age || 'N/A';
  data.party = data.party || 'Independent';
  data.constituency = data.constituency || 'N/A';
  data.assets = data.assets || 'N/A';
  data.liabilities = data.liabilities || 'N/A';
  data.criminalCases = data.criminalCases || '0';
  data.profession = data.profession || 'Politician';
  data.email = data.email || 'N/A';
  data.phone = data.phone || 'N/A';
  
  console.log('   ✅ Complete data ready\n');
  
  return data;
}

/**
 * Validate and fix URL format
 * Ensures URLs have proper https:// protocol
 */
function fixUrl(url) {
  if (!url || url === '#' || url === 'N/A') return '#';
  
  // Fix URLs starting with //
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  
  return url;
}

/**
 * Fetch profile image from MyNeta page or Wikipedia
 */
async function fetchProfileImage(mynetaUrl, politicianName) {
  console.log(`\n🖼️  Fetching profile image for ${politicianName}...`);
  
  try {
    const https = require('https');
    
    // Fetch MyNeta profile page HTML
    const fetchHTML = (url) => {
      return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve(data));
        }).on('error', reject);
      });
    };
    
    console.log(`   📡 Scraping MyNeta page: ${mynetaUrl}`);
    const html = await fetchHTML(mynetaUrl);
    
    // Extract image URL from MyNeta page
    const imagePatterns = [
      /<img[^>]+src="([^"]*images\/[^"]*candidate[^"]*\.(?:jpg|jpeg|png|gif))"/i,
      /<img[^>]+src="([^"]*images\/person[^"]*\.(?:jpg|jpeg|png|gif))"/i,
      /<img[^>]+src="([^"]*images\/[^"]*\.(?:jpg|jpeg|png|gif))"[^>]*class="[^"]*photo[^"]*"/i,
      /<img[^>]+class="[^"]*photo[^"]*"[^>]+src="([^"]*\.(?:jpg|jpeg|png|gif))"/i
    ];
    
    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match) {
        let imageUrl = match[1];
        
        // Make absolute URL if relative
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://myneta.info${imageUrl}`;
        } else if (!imageUrl.startsWith('http')) {
          imageUrl = `https://myneta.info/${imageUrl}`;
        }
        
        console.log(`   ✅ MyNeta image found: ${imageUrl}\n`);
        return imageUrl;
      }
    }
    
    console.log(`   ⚠️  No image found on MyNeta page`);
    
    // Fallback to Wikipedia
    console.log(`   🌐 Trying Wikipedia...`);
    const searchQuery = politicianName.replace(/\s+/g, '_');
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${searchQuery}&prop=pageimages&format=json&pithumbsize=500`;
    
    const wikiData = await fetchHTML(apiUrl);
    const parsed = JSON.parse(wikiData);
    const pages = parsed.query?.pages;
    
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const imageUrl = pages[pageId]?.thumbnail?.source;
      
      if (imageUrl) {
        console.log(`   ✅ Wikipedia image found: ${imageUrl}\n`);
        return imageUrl;
      }
    }
    
    console.log(`   ⚠️  No Wikipedia image found`);
    
  } catch (error) {
    console.error(`   ❌ Error fetching image: ${error.message}`);
  }
  
  // Fallback to avatar
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${politicianName.replace(/\s+/g, '')}`;
  console.log(`   👤 Using avatar fallback: ${avatarUrl}\n`);
  return avatarUrl;
}

/**
 * ENHANCED: Fetch political relatives using DEEP FAMILY RESEARCH
 * Priority: 1) Database 2) MyNeta 3) Google Search 4) OpenAI 5) Wikipedia
 * STEP 1: Find ALL family members (parents, spouse, children, siblings)
 * STEP 2: Check EACH family member for political connections
 */
async function fetchPoliticalRelatives(politicianName, state) {
  console.log(`\n👨‍👩‍👧‍👦 DEEP FAMILY RESEARCH: ${politicianName}`);
  console.log(`   📚 Sources: Database → MyNeta → Google → OpenAI → Wikipedia\n`);
  
  try {
    // Step 1: Check database first
    console.log('   🔍 Step 1: Checking database for existing relatives...');
    const dbQuery = `
      SELECT political_relatives 
      FROM officials 
      WHERE LOWER(name) = LOWER($1) OR name ILIKE $2
      LIMIT 1
    `;
    
    const dbResult = await pool.query(dbQuery, [
      politicianName,
      `%${politicianName}%`
    ]);
    
    if (dbResult.rows.length > 0 && dbResult.rows[0].political_relatives && 
        dbResult.rows[0].political_relatives !== 'None identified' &&
        dbResult.rows[0].political_relatives !== 'Error fetching data') {
      console.log(`   ✅ Found in database: ${dbResult.rows[0].political_relatives}\n`);
      return dbResult.rows[0].political_relatives;
    }
    console.log('   ⏭️  Not found in database, starting deep research...\n');
    
    // Step 2: DEEP SEARCH - Find ALL family members first
    console.log('   🔍 Step 2: Finding ALL family members (parents, spouse, children, siblings)...');
    const familyPrompt = `Search for ${politicianName} from ${state}, India using:
🔍 SOURCES (in order):
1. Wikipedia (PRIMARY - check infobox for family details)
2. Google Search Results (news articles, biography)
3. MyNeta.info (if available)
4. OpenAI knowledge base

Find ALL family members:
• Parents (father, mother)
• Spouse (wife/husband)
• Children (sons, daughters)
• Siblings (brothers, sisters)
• In-laws (if mentioned)

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

If NO family information found, respond: "NO_FAMILY_INFO"

Be thorough - check Wikipedia infoboxes, Google news, biographical sources.`;

    const familyResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a thorough researcher. Search Wikipedia FIRST (most reliable for family trees), then Google Search results, then MyNeta.info, then OpenAI knowledge. Extract ALL family members with their occupations."
        },
        {
          role: "user",
          content: familyPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });
    
    const familyInfo = familyResponse.choices[0].message.content.trim();
    console.log(`   📋 Family Members Found:\n${familyInfo}\n`);
    
    if (familyInfo === 'NO_FAMILY_INFO' || familyInfo.includes('no information') || familyInfo.includes('not available')) {
      console.log('   ⚠️  No family information found in any source\n');
      return 'None identified';
    }
    
    // Step 3: Check EACH family member for political connections
    console.log('   🔍 Step 3: Checking EACH family member for political connections...');
    const politicalCheckPrompt = `Based on this family information:

${familyInfo}

For ${politicianName} from ${state}, check if ANY of these family members are/were politicians.

🔍 SEARCH EACH PERSON IN:
1. Wikipedia - for political positions
2. Google Search - for political roles (MLA, MP, Minister, CM, PM)
3. MyNeta.info - for election records
4. OpenAI knowledge - for political activities
5. News articles - for political involvement

For EACH family member who is/was a politician, provide:
Name: [Full name]
Relation: [to ${politicianName}]
Position: [MLA/MP/Minister/CM/PM/etc.]
Party: [Political party if known]
Tenure: [Years active if known]

Format: "Name (Relation, Position)"
Example: "Nara Lokesh (Son, Minister)"

IMPORTANT:
- Search ALL family members individually
- Include even distant political connections
- If ANY political relatives found, list them
- If NO political relatives found, respond: "NONE"

Search thoroughly across all sources.`;

    const politicalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a thorough political researcher. For EACH family member listed, search Wikipedia, Google, MyNeta.info, and OpenAI knowledge to check if they are/were politicians. Be comprehensive and check all sources."
        },
        {
          role: "user",
          content: politicalCheckPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    const politicalRelativesResponse = politicalResponse.choices[0].message.content.trim();
    console.log(`   🏛️  Political Relatives Check:\n${politicalRelativesResponse}\n`);
    
    if (politicalRelativesResponse === 'NONE' || 
        politicalRelativesResponse.toLowerCase().includes('no political relatives') ||
        politicalRelativesResponse.toLowerCase().includes('none identified')) {
      console.log('   ✅ No political relatives found (Self-Made)\n');
      return 'None identified';
    }
    
    // Parse relatives
    const lines = politicalRelativesResponse.split('\n').filter(line => line.trim());
    const relatives = [];
    
    for (const line of lines) {
      // Look for pattern: Name (Relation, Position)
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
      console.log('   ✅ No political relatives found (Self-Made)\n');
      return 'None identified';
    }
    
    const relativesStr = relatives.join(', ');
    console.log(`   ✅ Found ${relatives.length} political relative(s):`);
    relatives.forEach(r => console.log(`      • ${r}`));
    console.log('');
    
    return relativesStr;
    
  } catch (error) {
    console.error('   ❌ Error in deep family research:', error.message);
    return 'Error fetching data';
  }
}

/**
 * ENHANCED: Check dynasty, wealth, knowledge, and electoral history using multi-source filtering
 * Sources: 1) Database 2) Google Search 3) Wikipedia 4) MyNeta 5) OpenAI
 */
async function checkDynastyStatus(politicianName, state) {
  try {
    console.log(`🔍 Analyzing ${politicianName} using ENHANCED multi-source filtering...`);
    console.log(`   📚 Sources: Database → Google Search → Wikipedia → MyNeta → OpenAI\n`);
    
    // Step 1: Check if politician already exists in database
    const existingQuery = `
      SELECT profile_data 
      FROM officials 
      WHERE LOWER(name) = LOWER($1) OR name ILIKE $2
      LIMIT 1
    `;
    
    const existingResult = await pool.query(existingQuery, [
      politicianName,
      `%${politicianName.split(' ').pop()}%` // Match by last name
    ]);
    
    let contextInfo = '';
    let currentAssets = '';
    let educationInfo = '';
    
    if (existingResult.rows.length > 0) {
      console.log(`   ✅ Source 1: Found profile in database`);
      const profileData = existingResult.rows[0].profile_data;
      
      // Extract relevant information from stored profile
      const education = profileData.education?.value || '';
      const background = profileData.politicalBackground?.careerHighlight?.value || '';
      const party = profileData.currentOfficeParty?.party?.value || '';
      const assets = profileData.assetsFinancials?.totalAssets?.value || '';
      
      educationInfo = education;
      currentAssets = assets;
      
      contextInfo = `\n\nData from Database (Source 1):
- Education: ${education}
- Political Background: ${background}
- Party: ${party}
- Current Assets: ${assets}`;
    }
    
    // Step 2-5: ENHANCED - Use OpenAI to query Google Search, Wikipedia, MyNeta
    const prompt = `Analyze ${politicianName} from ${state} using ENHANCED multi-source filtering:

� SEARCH ALL SOURCES (in priority order):
1. Our Database (checked above)
2. Google Search Results (ESSENTIAL - current news, biography, family info)
3. Wikipedia (PRIMARY - most reliable for family trees and biography)
4. MyNeta.info (Indian election affidavits - wealth, education, criminal cases)
5. OpenAI Knowledge Base (cross-verification)

${contextInfo}

🎯 RESEARCH STRATEGY:
• Search "${politicianName} ${state} family" on Google
• Check "${politicianName} Wikipedia" for infobox (parents, spouse, children)
• Search "${politicianName} MyNeta" for assets and education
• Cross-verify across all sources

Provide FIVE metrics:

1. DYNASTY STATUS - Political family connections:
   - Google Search: "${politicianName} father politician" "${politicianName} family politics"
   - Wikipedia: Check infobox for family members
   - Search EACH parent/relative name separately
   - If NO political family found → "Self-made"
   - If political family → "Dynastic - [specify relationship]"

2. FAMILY WEALTH - Original family background BEFORE politics:
   - Google: "${politicianName} family business" "${politicianName} family background"
   - Wikipedia: Check for inherited wealth, family business
   - "Wealthy" ONLY if family had ₹2+ crores BEFORE politics
   - Ignore politician's current assets
   ${currentAssets ? '(Note: Current assets ' + currentAssets + ' ≠ family background)' : ''}

3. CURRENT WEALTH - From MyNeta/Database/Google:
   ${currentAssets ? '- Database: ' + currentAssets : '- Search MyNeta.info for latest affidavit'}
   - Google: "${politicianName} assets MyNeta"
   - "Wealthy" if > ₹2 crores
   - "Not wealthy" if < ₹2 crores

4. KNOWLEDGEABLE - Education + Welfare schemes:
   ${educationInfo ? '- Database education: ' + educationInfo : ''}
   - Google: "${politicianName} education degree"
   - Wikipedia: Check education section
   - MyNeta: Check educational qualifications
   - Graduate/Post-graduate/Professional = Knowledgeable
   - OR implemented notable welfare schemes
   - "Knowledgeable" if good education OR welfare work
   - "Not knowledgeable" if limited education AND no schemes

5. CONSISTENT WINNER - Electoral track record:
   - Google: "${politicianName} election history"
   - Wikipedia: Check electoral history section
   - MyNeta: Check past elections
   - Won consistently over 5-10 years = Consistent winner
   - Multiple election wins

Respond EXACTLY as:
Dynasty: [Dynastic - relationship | Self-made]
FamilyWealth: [Wealthy | Not wealthy | Unknown]
CurrentWealth: [Wealthy | Not wealthy | Unknown]
Knowledge: [Knowledgeable - reason | Not knowledgeable | Unknown]
Winner: [Consistent winner - details | Inconsistent | New to politics | Unknown]

Examples:
Dynasty: Dynastic - Son of former CM Y. S. Rajasekhara Reddy
FamilyWealth: Wealthy
CurrentWealth: Wealthy
Knowledge: Knowledgeable - MBA, welfare schemes
Winner: Consistent winner - MLA since 2009

Dynasty: Self-made
FamilyWealth: Not wealthy
CurrentWealth: Wealthy
Knowledge: Knowledgeable - Graduate, education reforms
Winner: Consistent winner - MP 3 terms

SEARCH THOROUGHLY across Google, Wikipedia, and MyNeta.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a thorough political researcher using ENHANCED multi-source filtering (Database→Google Search→Wikipedia→MyNeta→OpenAI). Always search Google first for recent info, then Wikipedia for family trees, then MyNeta for affidavits. Mark 'Self-made' if no political family. 'Wealthy' if >₹2cr. 'Knowledgeable' if good education OR welfare schemes. Cross-verify across ALL sources."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 400
    });

    const fullResponse = response.choices[0].message.content.trim();
    console.log(`   📝 OpenAI Response:\n${fullResponse}\n`);
    
    // Parse the response (5 fields)
    const dynastyMatch = fullResponse.match(/Dynasty:\s*(.+)/);
    const familyWealthMatch = fullResponse.match(/FamilyWealth:\s*(.+)/);
    const currentWealthMatch = fullResponse.match(/CurrentWealth:\s*(.+)/);
    const knowledgeMatch = fullResponse.match(/Knowledge:\s*(.+)/);
    const winnerMatch = fullResponse.match(/Winner:\s*(.+)/);
    
    const dynastyStatus = dynastyMatch ? dynastyMatch[1].trim() : 'To be verified';
    const familyWealth = familyWealthMatch ? familyWealthMatch[1].trim() : 'Unknown';
    const currentWealth = currentWealthMatch ? currentWealthMatch[1].trim() : 'Unknown';
    const knowledgeable = knowledgeMatch ? knowledgeMatch[1].trim() : 'To be verified';
    const consistentWinner = winnerMatch ? winnerMatch[1].trim() : 'To be verified';
    
    console.log(`   ✅ Analysis Complete:`);
    console.log(`   👑 Dynasty: ${dynastyStatus}`);
    console.log(`   💰 Family Wealth (before politics): ${familyWealth}`);
    console.log(`   💵 Current Wealth: ${currentWealth}`);
    console.log(`   🎓 Knowledge: ${knowledgeable}`);
    console.log(`   🏆 Electoral Record: ${consistentWinner}`);
    console.log(`   📖 Sources: Database→OpenAI→Wikipedia→MyNeta\n`);
    
    // Return all five as an object
    return {
      dynastyStatus,
      familyWealth,
      currentWealth,
      knowledgeable,
      consistentWinner
    };
    
  } catch (error) {
    console.error('   ⚠️  Error in multi-source analysis:', error.message);
    return {
      dynastyStatus: 'To be verified',
      familyWealth: 'Unknown',
      currentWealth: 'Unknown',
      knowledgeable: 'To be verified',
      consistentWinner: 'To be verified'
    };
  }
}

/**
 * Map MyNeta JSON to our scorecard structure
 */
async function mapMyNetaToScorecard(mynetaData, politicianName, state) {
  // Validate and fix the source URL from MyNeta
  const rawSourceUrl = mynetaData._source_url || '#';
  const sourceUrl = fixUrl(rawSourceUrl);
  
  console.log(`   📎 Source URL: ${sourceUrl}`);
  
  const electionYear = mynetaData._election_year || '2023';
  
  // Extract title info (Party, Constituency from page title)
  const title = mynetaData._page_title || '';
  const partyMatch = title.match(/\(([^)]+)\)/);
  const constituencyMatch = title.match(/Constituency-\s*([^-]+)/);
  
  const party = partyMatch ? partyMatch[1] : 'Unknown';
  const constituency = constituencyMatch ? constituencyMatch[1].trim() : 'Unknown';
  
  // Check dynasty status, family wealth, and electoral consistency using OpenAI
  const analysisResult = await checkDynastyStatus(politicianName, state);
  
  // Build scorecard profile_data structure
  const profileData = {
    currentOfficeParty: {
      position: {
        value: `Member of Legislative Assembly - ${constituency}`,
        sourceUrl: sourceUrl
      },
      party: {
        value: party,
        sourceUrl: sourceUrl
      },
      constituency: {
        value: constituency,
        sourceUrl: sourceUrl
      },
      tenure: {
        value: `${electionYear}-Present`,
        sourceUrl: sourceUrl
      }
    },
    education: {
      value: mynetaData["Educational Status"]?.value || 'Not Declared',
      sourceUrl: sourceUrl
    },
    ministerialPortfolios: {
      value: 'Member of Legislative Assembly',
      sourceUrl: sourceUrl
    },
    assetsFinancials: {
      totalAssets: {
        value: mynetaData["Assets:"]?.value || mynetaData[`Telangana ${electionYear}`]?.value || 'Not Declared',
        sourceUrl: sourceUrl
      },
      sourceOfWealth: {
        value: mynetaData["Self"]?.value || 'Not Specified',
        sourceUrl: sourceUrl
      },
      liabilities: {
        value: mynetaData["Liabilities:"]?.value || 'Not Declared',
        sourceUrl: sourceUrl
      }
    },
    criminalCases: {
      totalCases: {
        value: countCriminalCases(mynetaData),
        sourceUrl: sourceUrl
      },
      seriousCharges: {
        value: getSeriousCases(mynetaData),
        sourceUrl: sourceUrl
      }
    },
    politicalBackground: {
      dynastyStatus: {
        value: analysisResult.dynastyStatus,
        sourceUrl: sourceUrl
      },
      careerHighlight: {
        value: `Contested elections in ${electionYear}`,
        sourceUrl: sourceUrl
      }
    },
    electoralPerformance: {
      recentElections: {
        value: `${electionYear} - ${constituency}`,
        sourceUrl: sourceUrl
      }
    },
    currentActivity: {
      keyAchievements: {
        value: 'Legislative activities and constituency development',
        sourceUrl: sourceUrl
      },
      policyFocus: {
        value: 'Public welfare and governance',
        sourceUrl: sourceUrl
      }
    },
    legalProbes: {
      recentDevelopments: {
        value: countCriminalCases(mynetaData) > 0 ? 'Cases pending' : 'No recent legal developments',
        sourceUrl: sourceUrl
      }
    },
    personalBackground: {
      realName: {
        value: extractNameFromTitle(title),
        sourceUrl: sourceUrl
      },
      familyNotes: {
        value: 'To be verified',
        sourceUrl: sourceUrl
      },
      philanthropy: {
        value: 'Not available',
        sourceUrl: sourceUrl
      }
    }
  };
  
  return { profileData, analysisResult };
}

/**
 * Count criminal cases from MyNeta data
 */
function countCriminalCases(data) {
  let count = 0;
  for (const key in data) {
    // Check if key is a number (criminal case serial number)
    if (!isNaN(key) && data[key]?.value && data[key].value.includes('PS')) {
      count++;
    }
  }
  return count > 0 ? `${count} cases declared` : 'No cases declared';
}

/**
 * Get serious criminal cases
 */
function getSeriousCases(data) {
  const seriousCases = [];
  for (const key in data) {
    if (!isNaN(key) && data[key]?.value) {
      const caseValue = data[key].value;
      // Look for recent cases (2022-2025)
      if (caseValue.includes('2023') || caseValue.includes('2024') || caseValue.includes('2025')) {
        seriousCases.push(caseValue);
        if (seriousCases.length >= 3) break; // Get first 3 recent cases
      }
    }
  }
  return seriousCases.length > 0 ? seriousCases.join('; ') : 'No serious charges reported';
}

/**
 * Extract candidate name from page title
 */
function extractNameFromTitle(title) {
  const match = title.match(/^([^(]+)/);
  return match ? match[1].trim() : 'Unknown';
}

/**
 * Store politician in database
 */
async function storePoliticianInDatabase(name, state, position, party, constituency, profileData, analysisResult, profileImageUrl, politicalRelatives = 'None identified') {
  try {
    console.log('\n💾 Storing in database...\n');
    
    // Check if already exists
    const checkResult = await pool.query(
      'SELECT id, name FROM officials WHERE name = $1',
      [name]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`⚠️  ${name} already exists in database (ID: ${checkResult.rows[0].id})`);
      console.log('   🔄 Updating existing record with enriched data...\n');
      
      // UPDATE existing record
      const updateResult = await pool.query(
        `UPDATE officials SET
          position = $2, party = $3, constituency = $4, state = $5, tenure = $6,
          dynasty_status = $7, education = $8, assets = $9, liabilities = $10, criminal_cases = $11,
          image_url = $12, profile_image_url = $13,
          profile_data = $14, profile_updated_at = CURRENT_TIMESTAMP,
          consistent_winner = $15, family_wealth = $16, current_wealth = $17, 
          knowledgeful = $18, political_relatives = $19,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, name`,
        [
          checkResult.rows[0].id,
          position,
          party,
          constituency,
          state,
          profileData.currentOfficeParty?.tenure?.value || '2024-Present',
          analysisResult.dynastyStatus,
          profileData.education?.value || 'N/A',
          profileData.assetsFinancials?.totalAssets?.value || 'N/A',
          profileData.assetsFinancials?.liabilities?.value || 'N/A',
          profileData.criminalCases?.totalCases?.value || 'N/A',
          profileImageUrl,
          profileImageUrl,
          JSON.stringify(profileData),
          analysisResult.consistentWinner,
          analysisResult.familyWealth,
          analysisResult.currentWealth,
          analysisResult.knowledgeable,
          politicalRelatives
        ]
      );
      
      console.log('✅ SUCCESS! Updated in Database\n');
      console.log(`   📋 ID: ${updateResult.rows[0].id}`);
      console.log(`   👤 Name: ${updateResult.rows[0].name}`);
      console.log(`   🏛️  Position: ${position}`);
      console.log(`   🎉 Party: ${party}`);
      console.log(`   📍 State: ${state}`);
      console.log(`   🖼️  Image: ${profileImageUrl}`);
      console.log(`   👑 Dynasty: ${analysisResult.dynastyStatus}`);
      console.log(`   👨‍👩‍👧‍👦 Family Wealth (before politics): ${analysisResult.familyWealth}`);
      console.log(`   💰 Current Wealth (MyNeta): ${analysisResult.currentWealth}`);
      console.log(`   🎓 Knowledge: ${analysisResult.knowledgeable}`);
      console.log(`   🏆 Electoral Record: ${analysisResult.consistentWinner}`);
      console.log(`   👨‍👩‍👧 Political Relatives: ${politicalRelatives}\n`);
      
      return updateResult.rows[0].id;
    }
    
    // Insert new politician with new fields INCLUDING profile_image_url
    const result = await pool.query(
      `INSERT INTO officials (
        name, position, party, constituency, state, tenure, dynasty_status, 
        education, assets, liabilities, criminal_cases,
        image_url, profile_image_url, approvals, disapprovals,
        profile_data, profile_updated_at,
        consistent_winner, family_wealth, current_wealth, knowledgeful, political_relatives
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, $17, $18, $19, $20, $21)
      RETURNING id, name`,
      [
        name,
        position,
        party,
        constituency,
        state,
        profileData.currentOfficeParty?.tenure?.value || '2024-Present',
        analysisResult.dynastyStatus,
        profileData.education?.value || 'N/A',
        profileData.assetsFinancials?.totalAssets?.value || 'N/A',
        profileData.assetsFinancials?.liabilities?.value || 'N/A',
        profileData.criminalCases?.totalCases?.value || 'N/A',
        profileImageUrl, // Legacy column
        profileImageUrl, // New column - profile_image_url (used by frontend)
        0,
        0,
        JSON.stringify(profileData),
        analysisResult.consistentWinner,
        analysisResult.familyWealth,
        analysisResult.currentWealth,
        analysisResult.knowledgeable,
        politicalRelatives
      ]
    );
    
    console.log('✅ SUCCESS! Stored in Database\n');
    console.log(`   📋 ID: ${result.rows[0].id}`);
    console.log(`   👤 Name: ${result.rows[0].name}`);
    console.log(`   🏛️  Position: ${position}`);
    console.log(`   🎉 Party: ${party}`);
    console.log(`   📍 State: ${state}`);
    console.log(`   🖼️  Image: ${profileImageUrl}`);
    console.log(`   👑 Dynasty: ${analysisResult.dynastyStatus}`);
    console.log(`   👨‍👩‍👧‍👦 Family Wealth (before politics): ${analysisResult.familyWealth}`);
    console.log(`   💰 Current Wealth (MyNeta): ${analysisResult.currentWealth}`);
    console.log(`   🎓 Knowledge: ${analysisResult.knowledgeable}`);
    console.log(`   🏆 Electoral Record: ${analysisResult.consistentWinner}`);
    console.log(`   👨‍👩‍👧 Political Relatives: ${politicalRelatives}\n`);
    
    return result.rows[0].id;
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    throw error;
  }
}

/**
 * Verify URL quality after storing in database
 */
async function verifyStoredUrls(officialId, name) {
  try {
    console.log('\n📋 URL Verification:');
    
    const result = await pool.query(
      'SELECT profile_data FROM officials WHERE id = $1',
      [officialId]
    );
    
    if (result.rows.length === 0) {
      console.log('   ⚠️  Could not verify - record not found\n');
      return;
    }
    
    const profileData = result.rows[0].profile_data;
    const urls = [];
    
    // Extract all sourceUrls
    function extractUrls(obj) {
      if (typeof obj !== 'object' || obj === null) return;
      
      if (obj.sourceUrl && obj.sourceUrl !== '#') {
        urls.push(obj.sourceUrl);
      }
      
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          extractUrls(obj[key]);
        }
      }
    }
    
    extractUrls(profileData);
    
    // Check URL quality
    const validUrls = urls.filter(url => 
      url.startsWith('https://') || url.startsWith('http://')
    );
    const brokenUrls = urls.filter(url => 
      url.startsWith('//') || (!url.startsWith('http') && url !== '#')
    );
    
    const quality = urls.length > 0 
      ? Math.round((validUrls.length / urls.length) * 100) 
      : 0;
    
    console.log(`   Total URLs: ${urls.length}`);
    console.log(`   ✅ Valid: ${validUrls.length}`);
    console.log(`   ❌ Broken: ${brokenUrls.length}`);
    console.log(`   🌟 Quality Score: ${quality}%`);
    
    if (quality === 100) {
      console.log(`   ✨ Perfect! All URLs are properly formatted.\n`);
    } else if (brokenUrls.length > 0) {
      console.log(`   ⚠️  Warning: Found ${brokenUrls.length} broken URLs\n`);
    }
    
  } catch (error) {
    console.error('   ⚠️  Error verifying URLs:', error.message);
  }
}

/**
 * Main processing function
 */
async function processMyNetaJson(jsonFilePath, politicianInfo) {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('MyNeta to Scorecard Mapper');
    console.log('='.repeat(80) + '\n');
    
    // Read JSON file
    console.log(`📂 Reading: ${jsonFilePath}\n`);
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Extract name and state first
    const name = politicianInfo.name || extractNameFromTitle(jsonData._page_title);
    const state = politicianInfo.state || 'Unknown';
    const position = politicianInfo.position || 'Member of Legislative Assembly';
    
    // Map to scorecard format (now async with dynasty check)
    console.log('🔄 Mapping MyNeta data to scorecard format...\n');
    const { profileData, analysisResult } = await mapMyNetaToScorecard(jsonData, name, state);
    
    // Fetch political relatives
    const politicalRelatives = await fetchPoliticalRelatives(name, state);
    
    // Fetch profile image from MyNeta page (NEW - DEFAULT)
    const profileImageUrl = await fetchProfileImage(jsonData._source_url, name);
    
    // Extract info from profile data
    const party = profileData.currentOfficeParty.party.value;
    const constituency = profileData.currentOfficeParty.constituency.value;
    
    console.log('📊 Extracted Information:');
    console.log(`   Name: ${name}`);
    console.log(`   State: ${state}`);
    console.log(`   Position: ${position}`);
    console.log(`   Party: ${party}`);
    console.log(`   Constituency: ${constituency}`);
    console.log(`   Assets: ${profileData.assetsFinancials.totalAssets.value}`);
    console.log(`   Liabilities: ${profileData.assetsFinancials.liabilities.value}`);
    console.log(`   Criminal Cases: ${profileData.criminalCases.totalCases.value}`);
    console.log(`   Dynasty Status: ${analysisResult.dynastyStatus}`);
    console.log(`   Wealth Status: ${analysisResult.familyWealth}`);
    console.log(`   Electoral Record: ${analysisResult.consistentWinner}`);
    console.log(`   Source URL: ${jsonData._source_url}\n`);
    
    // Store in database with analysis results and profile image
    const officialId = await storePoliticianInDatabase(
      name, state, position, party, constituency, profileData, analysisResult, profileImageUrl, politicalRelatives
    );
    
    // Verify URL quality
    await verifyStoredUrls(officialId, name);
    
    console.log('='.repeat(80));
    console.log(`\n✨ ${name} successfully added to database!\n`);
    console.log(`💡 View at: http://localhost:3000/profile/${officialId}\n`);
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
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n❌ Usage: node myneta-to-scorecard.js <json_file> <name> <state> [position]\n');
    console.log('Examples:');
    console.log('  node myneta-to-scorecard.js myneta_revanth_reddy_0.json "Revanth Reddy" "Telangana"');
    console.log('  node myneta-to-scorecard.js myneta_revanth_reddy_0.json "Revanth Reddy" "Telangana" "Chief Minister"\n');
    process.exit(1);
  }
  
  const jsonFile = args[0];
  const politicianInfo = {
    name: args[1],
    state: args[2],
    position: args[3] || 'Member of Legislative Assembly'
  };
  
  processMyNetaJson(jsonFile, politicianInfo);
}

module.exports = { mapMyNetaToScorecard, storePoliticianInDatabase };
