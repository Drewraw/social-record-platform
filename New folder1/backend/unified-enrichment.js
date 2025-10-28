require('dotenv').config();
const pool = require('./config/database');
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==================== SCRAPING FUNCTIONS ====================

async function scrapeMyNeta(url) {
  console.log(`\n🔍 Scraping MyNeta: ${url}`);
  
  try {
    // Use Python scraper for better data extraction (includes Assets, Liabilities)
    const pythonScript = path.join(__dirname, 'myneta-scraper', 'myneta_direct_url.py');
    const tempName = `temp_${Date.now()}`;
    const outputFile = path.join(__dirname, 'myneta-scraper', `myneta_${tempName}_0.json`);
    
    // Run Python scraper
    await new Promise((resolve, reject) => {
      exec(`python "${pythonScript}" "${url}" "${tempName}"`, 
        { cwd: path.join(__dirname, 'myneta-scraper') },
        (error, stdout, stderr) => {
          if (error) {
            console.error(`   ⚠️  Python scraper error: ${error.message}`);
            reject(error);
          } else {
            console.log(`   ✅ Python scraper completed`);
            resolve();
          }
        }
      );
    });
    
    // Read scraped data
    if (fs.existsSync(outputFile)) {
      const rawData = fs.readFileSync(outputFile, 'utf8');
      const data = JSON.parse(rawData);
      
      // Clean up temp file
      fs.unlinkSync(outputFile);
      
      console.log(`✅ Scraped ${Object.keys(data).length} fields`);
      return data;
    } else {
      throw new Error('Python scraper did not create output file');
    }
    
  } catch (error) {
    console.error(`❌ Python scraping failed: ${error.message}`);
    console.log(`   🔄 Falling back to Node.js scraper...`);
    
    // Fallback to inline Node.js scraping
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const data = {
        _source_url: url,
        _scraped_at: new Date().toISOString()
      };
      
      // Extract all table data
      $('table').each((i, table) => {
        $(table).find('tr').each((j, row) => {
          const cells = $(row).find('td, th');
          if (cells.length >= 2) {
            const key = $(cells[0]).text().trim();
            const value = $(cells[1]).text().trim();
            
            if (key && value) {
              data[key] = {
                value: value,
                sourceUrl: url
              };
            }
          }
        });
      });
      
      console.log(`✅ Scraped ${Object.keys(data).length} fields (Node.js fallback)`);
      return data;
    } catch (fallbackError) {
      console.error(`❌ Node.js scraping also failed: ${fallbackError.message}`);
      return null;
    }
  }
}

// ==================== WIKIPEDIA SCRAPING ====================

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
      extract: extract.substring(0, 5000), // First 5000 chars
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
      infobox: infoboxData
    };
  } catch (error) {
    console.error(`❌ Wikipedia search failed: ${error.message}`);
    return null;
  }
}

// ==================== GOOGLE SEARCH FOR MISSING DATA ====================

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

// ==================== SMART DATA EXTRACTION WITH FALLBACKS ====================

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
  
  // Try multiple field names for Assets/Liabilities
  data.assets = mynetaData['Total Assets']?.value || 
                mynetaData['Assets:']?.value ||
                mynetaData['Assets']?.value ||
                mynetaData['Lok Sabha 2019']?.value ||  // Latest declaration
                mynetaData['Loksabha 2014']?.value;
                
  data.liabilities = mynetaData['Total Liabilities']?.value || 
                     mynetaData['Liabilities:']?.value ||
                     mynetaData['Liabilities']?.value ||
                     mynetaData['Grand Total of Liabilities (as per affidavit)']?.value;
                     
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

// ==================== DEEP FAMILY RESEARCH ====================

async function researchPoliticalRelatives(name, mynetaData, wikipediaData) {
  console.log(`\n🔍 Deep research: Political relatives of ${name}...`);
  
  const prompt = `Research the complete family tree and political relatives of ${name}, an Indian politician.

AVAILABLE DATA:

1. MyNeta Data:
   - Education: ${mynetaData['Education']?.value || 'N/A'}
   - Age: ${mynetaData['Age']?.value || 'N/A'}
   - Party: ${mynetaData['Party']?.value || 'N/A'}
   - Father's Name: ${mynetaData["Father's Name"]?.value || 'N/A'}
   - Mother's Name: ${mynetaData["Mother's Name"]?.value || 'N/A'}
   - Spouse: ${mynetaData['Spouse']?.value || 'N/A'}

2. Wikipedia Data:
${wikipediaData ? wikipediaData.extract : 'Not available'}

TASK: Research and list ALL family members in politics, including:
- Parents (father, mother)
- Siblings (brothers, sisters)
- Spouse (husband, wife)
- Children (sons, daughters)
- In-laws (father-in-law, mother-in-law, brother-in-law, sister-in-law)
- Extended family (uncles, aunts, cousins, nephews, nieces)
- Previous generations (grandfather, grandmother)

For EACH political relative, provide:
- Full name
- Relationship to ${name}
- Political position (MP, MLA, Minister, etc.)
- Party affiliation
- Current status (active/retired/deceased)

Format as JSON:
{
  "politicalRelatives": [
    {
      "name": "Full Name",
      "relationship": "Father/Mother/Spouse/etc",
      "position": "Chief Minister/MP/MLA/etc",
      "party": "Party name",
      "status": "Active/Retired/Deceased"
    }
  ],
  "dynastyStatus": "Self-Made" or "Dynastic - [specify which relative]",
  "familySummary": "Brief summary of political family background"
}

If no political relatives found, return empty array for politicalRelatives.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert researcher on Indian political families and dynasties. Use your knowledge of Indian politics combined with the provided data to give comprehensive family information. Be thorough and accurate.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    
    const research = JSON.parse(completion.choices[0].message.content);
    console.log(`✅ Found ${research.politicalRelatives?.length || 0} political relatives`);
    
    return research;
  } catch (error) {
    console.error(`❌ Family research failed: ${error.message}`);
    return {
      politicalRelatives: [],
      dynastyStatus: 'Unknown',
      familySummary: 'Unable to research family background'
    };
  }
}

// ==================== OPENAI ANALYSIS ====================

async function analyzeWithOpenAI(mynetaData, name, wikipediaData, familyResearch) {
  console.log(`\n🤖 Comprehensive analysis of ${name}...`);
  
  const prompt = `Analyze this Indian politician's complete profile:

Name: ${name}
Education: ${mynetaData['Education']?.value || 'N/A'}
Age: ${mynetaData['Age']?.value || 'N/A'}
Assets: ${mynetaData['Total Assets']?.value || mynetaData['Assets']?.value || 'N/A'}
Liabilities: ${mynetaData['Total Liabilities']?.value || mynetaData['Liabilities']?.value || 'N/A'}
Criminal Cases: ${mynetaData['Criminal Cases']?.value || mynetaData['Total Cases']?.value || 'N/A'}
Party: ${mynetaData['Party']?.value || 'N/A'}

Family Background: ${familyResearch.familySummary || 'No political family'}
Political Relatives: ${familyResearch.politicalRelatives?.length || 0} found

Provide assessment of:

1. Family Wealth (before politics): What was their family's financial background?
2. Current Wealth: Assess current wealth from assets
3. Knowledge Level: Based on education, are they knowledgeable about governance/welfare schemes?
4. Electoral Performance: Are they a consistent winner?

Format as JSON:
{
  "familyWealth": "description of family wealth before politics",
  "currentWealth": "assessment from assets",
  "knowledgeable": "Yes/No with reasoning",
  "consistentWinner": "Yes/No with record"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert on Indian politics, politicians, and their backgrounds. Provide accurate, factual assessments.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    
    const analysis = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Analysis complete');
    return analysis;
  } catch (error) {
    console.error(`❌ Analysis failed: ${error.message}`);
    return {
      familyWealth: 'Unknown',
      currentWealth: 'Unknown',
      knowledgeable: 'Unknown',
      consistentWinner: 'Unknown'
    };
  }
}

// ==================== IMAGE FETCHING ====================

async function fetchProfileImage(name, mynetaData) {
  console.log(`\n📸 Fetching profile image for ${name}...`);
  
  // Try MyNeta image first
  if (mynetaData._source_url) {
    try {
      const response = await axios.get(mynetaData._source_url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(response.data);
      const imgSrc = $('img[src*="candidate"]').first().attr('src');
      
      if (imgSrc) {
        const fullUrl = imgSrc.startsWith('http') ? imgSrc : `https://myneta.info${imgSrc}`;
        console.log(`✅ Found MyNeta image: ${fullUrl}`);
        return fullUrl;
      }
    } catch (error) {
      console.log('⚠️  No MyNeta image found');
    }
  }
  
  // Fallback to avatar
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  console.log(`✅ Using avatar fallback`);
  return fallbackUrl;
}

// ==================== DATABASE OPERATIONS ====================

async function checkDatabaseStatus() {
  console.log('\n📊 Checking database status...\n');
  
  const result = await pool.query(`
    SELECT 
      serial_number, id, name, position, party, constituency,
      education, assets, dynasty_status, image_url
    FROM officials 
    ORDER BY serial_number
  `);
  
  console.log('Serial | ID  | Name                          | Education | Assets | Dynasty | Image');
  console.log('-------+-----+-------------------------------+-----------+--------+---------+-------');
  
  let enrichedCount = 0;
  const needsEnrichment = [];
  
  result.rows.forEach(row => {
    const hasEducation = row.education && row.education !== 'To be updated' && row.education !== 'N/A';
    const hasAssets = row.assets && row.assets !== 'To be updated' && row.assets !== 'N/A';
    const hasDynasty = row.dynasty_status && row.dynasty_status !== 'Unknown';
    const hasImage = row.image_url && !row.image_url.includes('dicebear');
    
    const enriched = hasEducation && hasAssets;
    if (enriched) enrichedCount++;
    else needsEnrichment.push(row);
    
    const status = enriched ? '✅' : '❌';
    
    console.log(
      `${status} ${String(row.serial_number || '').padEnd(3)} | ` +
      `${String(row.id).padEnd(3)} | ` +
      `${(row.name || '').padEnd(29).substring(0, 29)} | ` +
      `${(hasEducation ? 'YES' : 'NO').padEnd(9)} | ` +
      `${(hasAssets ? 'YES' : 'NO').padEnd(6)} | ` +
      `${(hasDynasty ? 'YES' : 'NO').padEnd(7)} | ` +
      `${hasImage ? 'YES' : 'NO'}`
    );
  });
  
  console.log('\n' + '='.repeat(100));
  console.log(`📈 Progress: ${enrichedCount}/${result.rows.length} officials enriched (${Math.round(enrichedCount/result.rows.length*100)}%)`);
  console.log('='.repeat(100) + '\n');
  
  return { total: result.rows.length, enriched: enrichedCount, needsEnrichment };
}

async function updateOfficial(name, mynetaUrl) {
  console.log('\n' + '='.repeat(80));
  console.log(`🚀 ENRICHING: ${name}`);
  console.log('='.repeat(80));
  
  try {
    // 1. Scrape MyNeta
    const mynetaData = await scrapeMyNeta(mynetaUrl);
    if (!mynetaData) {
      console.error(`❌ Failed to scrape data for ${name}`);
      return false;
    }
    
    // 2. Search Wikipedia for additional context
    const wikipediaData = await searchWikipedia(name);
    
    // 3. Extract complete data with fallbacks (MyNeta → Wikipedia → Google)
    const completeData = await extractCompleteData(name, mynetaData, wikipediaData);
    
    // 4. Deep research on political relatives (using MyNeta + Wikipedia + OpenAI knowledge)
    const familyResearch = await researchPoliticalRelatives(name, mynetaData, wikipediaData);
    
    // 5. Comprehensive analysis with all data sources
    const analysis = await analyzeWithOpenAI(mynetaData, name, wikipediaData, familyResearch);
    
    // 6. Fetch profile image
    const imageUrl = await fetchProfileImage(name, mynetaData);
    
    // 7. Format political relatives as readable text
    let politicalRelativesText = 'None known';
    if (familyResearch.politicalRelatives && familyResearch.politicalRelatives.length > 0) {
      politicalRelativesText = familyResearch.politicalRelatives.map(rel => 
        `${rel.name} (${rel.relationship}) - ${rel.position}, ${rel.party} [${rel.status}]`
      ).join('; ');
    }
    
    // 8. Check if official exists
    const checkResult = await pool.query(
      'SELECT id, serial_number FROM officials WHERE name = $1',
      [name]
    );
    
    if (checkResult.rows.length === 0) {
      console.log(`⚠️  ${name} not found in database. Please add them first.`);
      return false;
    }
    
    const officialId = checkResult.rows[0].id;
    const serialNumber = checkResult.rows[0].serial_number;
    
    console.log(`\n💾 Updating database (ID: ${officialId}, Serial: ${serialNumber})...`);
    
    // 9. Prepare enriched profile data
    const enrichedProfileData = {
      myneta: mynetaData,
      wikipedia: wikipediaData,
      completeData: completeData,
      familyResearch: familyResearch,
      analysis: analysis
    };
    
    // 10. Update database with complete data from all sources
    await pool.query(`
      UPDATE officials SET
        education = $2,
        assets = $3,
        liabilities = $4,
        criminal_cases = $5,
        age = $6,
        party = $7,
        constituency = $8,
        dynasty_status = $9,
        family_wealth = $10,
        current_wealth = $11,
        knowledgeful = $12,
        consistent_winner = $13,
        political_relatives = $14,
        image_url = $15,
        profile_image_url = $15,
        contact_email = $16,
        profile_data = $17,
        profile_updated_at = CURRENT_TIMESTAMP,
        updated_at = NOW()
      WHERE id = $1
    `, [
      officialId,
      completeData.education,
      completeData.assets,
      completeData.liabilities,
      completeData.criminalCases,
      completeData.age,
      completeData.party,
      completeData.constituency,
      familyResearch.dynastyStatus,
      analysis.familyWealth,
      analysis.currentWealth,
      analysis.knowledgeable,
      analysis.consistentWinner,
      politicalRelativesText,
      imageUrl,
      completeData.email,
      JSON.stringify(enrichedProfileData)
    ]);
    
    console.log('\n✅ SUCCESS! Official enriched with multi-source data\n');
    console.log(`   👤 Name: ${name}`);
    console.log(`   🎓 Education: ${completeData.education}`);
    console.log(`   🎂 Age: ${completeData.age}`);
    console.log(`   🎉 Party: ${completeData.party}`);
    console.log(`   📍 Constituency: ${completeData.constituency}`);
    console.log(`   💰 Assets: ${completeData.assets}`);
    console.log(`   📊 Liabilities: ${completeData.liabilities}`);
    console.log(`   ⚖️  Criminal Cases: ${completeData.criminalCases}`);
    console.log(`   💼 Profession: ${completeData.profession}`);
    console.log(`   📧 Email: ${completeData.email}`);
    console.log(`   👑 Dynasty: ${familyResearch.dynastyStatus}`);
    console.log(`   👨‍👩‍👧‍👦 Family Summary: ${familyResearch.familySummary}`);
    console.log(`   👨‍👩‍👧 Political Relatives (${familyResearch.politicalRelatives?.length || 0}):`);
    
    if (familyResearch.politicalRelatives && familyResearch.politicalRelatives.length > 0) {
      familyResearch.politicalRelatives.forEach(rel => {
        console.log(`      - ${rel.name} (${rel.relationship}): ${rel.position}, ${rel.party} [${rel.status}]`);
      });
    } else {
      console.log(`      - None found`);
    }
    
    console.log(`   🖼️  Image: ${imageUrl}`);
    console.log(`\n   📊 Data Sources Used:`);
    console.log(`      - MyNeta: ✅`);
    console.log(`      - Wikipedia: ${wikipediaData ? '✅' : '❌'}`);
    console.log(`      - OpenAI Research: ✅`);
    console.log(`   👤 Name: ${name}`);
    console.log(`   📚 Wikipedia: ${wikipediaData ? 'Found ✅' : 'Not found ❌'}`);
    
    return true;
    
  } catch (error) {
    console.error(`\n❌ Error enriching ${name}:`, error.message);
    return false;
  }
}

// ==================== DUPLICATE DETECTION & REMOVAL ====================

async function checkAndRemoveDuplicates() {
  console.log('\n🔍 CHECKING FOR DUPLICATE OFFICIALS');
  console.log('='.repeat(80) + '\n');
  
  try {
    const duplicatesQuery = await pool.query(`
      SELECT 
        LOWER(TRIM(name)) as normalized_name,
        array_agg(name ORDER BY created_at ASC) as names,
        array_agg(id ORDER BY created_at ASC) as ids,
        array_agg(created_at ORDER BY created_at ASC) as created_dates,
        COUNT(*) as count
      FROM officials
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
    `);
    
    if (duplicatesQuery.rows.length === 0) {
      console.log('✅ No duplicates found - all names are unique\n');
      return 0;
    }
    
    console.log(`⚠️  Found ${duplicatesQuery.rows.length} duplicate name(s):\n`);
    
    let totalDeleted = 0;
    
    for (const duplicate of duplicatesQuery.rows) {
      const ids = duplicate.ids;
      const dates = duplicate.created_dates;
      const names = duplicate.names;
      const oldestId = ids[0];
      const duplicateIds = ids.slice(1);
      
      console.log(`📋 Duplicate: "${names[0]}"`);
      console.log(`   Keeping oldest: ID ${oldestId} (created ${new Date(dates[0]).toLocaleString()})`);
      console.log(`   Deleting ${duplicateIds.length} newer copy/copies`);
      
      const deleteResult = await pool.query(
        'DELETE FROM officials WHERE id = ANY($1) RETURNING id',
        [duplicateIds]
      );
      
      totalDeleted += deleteResult.rows.length;
      console.log(`   ✅ Deleted ${deleteResult.rows.length} duplicate(s)\n`);
    }
    
    console.log('='.repeat(80));
    console.log(`✅ Removed ${totalDeleted} duplicate official(s)\n`);
    
    return totalDeleted;
    
  } catch (error) {
    console.error('❌ Error checking duplicates:', error.message);
    return 0;
  }
}

// ==================== DATABASE VALIDATION ====================

async function validateDatabaseFields() {
  console.log('\n📊 VALIDATING DATABASE FIELDS');
  console.log('='.repeat(80) + '\n');
  
  try {
    const result = await pool.query(`
      SELECT 
        id, serial_number, name, position,
        education, age, assets, liabilities, criminal_cases,
        dynasty_status, political_relatives, image_url
      FROM officials 
      ORDER BY serial_number
    `);
    
    const stats = {
      total: result.rows.length,
      missingFields: [],
      needsEnrichment: []
    };
    
    result.rows.forEach(official => {
      const missing = [];
      
      if (!official.education || ['To be updated', 'N/A'].includes(official.education)) missing.push('education');
      if (!official.age || ['To be updated', 'N/A'].includes(official.age)) missing.push('age');
      if (!official.assets || ['To be updated', 'N/A'].includes(official.assets)) missing.push('assets');
      if (!official.liabilities || ['To be updated', 'N/A'].includes(official.liabilities)) missing.push('liabilities');
      if (!official.criminal_cases && official.criminal_cases !== '0') missing.push('criminal_cases');
      if (!official.dynasty_status || official.dynasty_status === 'Unknown') missing.push('dynasty_status');
      if (!official.political_relatives || official.political_relatives === 'Unknown') missing.push('political_relatives');
      if (!official.image_url || official.image_url.includes('dicebear')) missing.push('image');
      
      if (missing.length > 0) {
        stats.needsEnrichment.push({
          id: official.id,
          serial: official.serial_number,
          name: official.name,
          position: official.position,
          missing: missing
        });
      }
    });
    
    console.log(`📋 Total Officials: ${stats.total}`);
    console.log(`✅ Fully Enriched: ${stats.total - stats.needsEnrichment.length}`);
    console.log(`⚠️  Need Enrichment: ${stats.needsEnrichment.length}\n`);
    
    if (stats.needsEnrichment.length > 0) {
      console.log('Officials with missing data:\n');
      stats.needsEnrichment.forEach(official => {
        console.log(`  ${official.serial}. ${official.name} (${official.position})`);
        console.log(`     Missing: ${official.missing.join(', ')}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(80) + '\n');
    
    return stats;
    
  } catch (error) {
    console.error('❌ Error validating database:', error.message);
    return null;
  }
}

// ==================== MAIN EXECUTION ====================

async function main() {
  const args = process.argv.slice(2);
  
  console.log('\n🎯 UNIFIED ENRICHMENT SYSTEM');
  console.log('=' .repeat(80) + '\n');
  
  try {
    if (args.length === 0) {
      // No arguments - show database status
      await checkDatabaseStatus();
      console.log('💡 Usage:');
      console.log('   node unified-enrichment.js                          (check status)');
      console.log('   node unified-enrichment.js "Name" "MyNeta URL"      (enrich one official)');
      console.log('   node unified-enrichment.js all                      (enrich all from myneta-urls.js)\n');
      
    } else if (args[0] === 'all') {
      // Enrich all officials from myneta-urls.js
      console.log('🔄 Batch enrichment mode (from myneta-urls.js)\n');
      
      const urlsPath = path.join(__dirname, 'bbmp-corporators', 'myneta-urls.js');
      if (!fs.existsSync(urlsPath)) {
        console.error('❌ myneta-urls.js not found!');
        process.exit(1);
      }
      
      const urlsModule = require(urlsPath);
      const officials = Object.entries(urlsModule);
      
      console.log(`📋 Found ${officials.length} officials in myneta-urls.js\n`);
      
      let successCount = 0;
      let skippedCount = 0;
      
      for (const [name, data] of officials) {
        if (!data.myneta_url || data.myneta_url.includes('XXXX')) {
          console.log(`⏭️  Skipping ${name} - no URL provided`);
          skippedCount++;
          continue;
        }
        
        const success = await updateOfficial(name, data.myneta_url);
        if (success) successCount++;
        
        // Delay between requests
        if (officials.indexOf([name, data]) < officials.length - 1) {
          console.log('\n⏳ Waiting 5 seconds before next official...\n');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      console.log('\n' + '='.repeat(80));
      console.log(`🎉 Batch enrichment complete!`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ⏭️  Skipped: ${skippedCount}`);
      console.log('='.repeat(80) + '\n');
      
      // Show final status
      await checkDatabaseStatus();
      
    } else if (args.length >= 2) {
      // Enrich specific official
      const [name, url] = args;
      const success = await updateOfficial(name, url);
      
      if (success) {
        console.log('\n📊 Current status:\n');
        await checkDatabaseStatus();
      }
      
    } else {
      console.error('❌ Invalid arguments');
      console.log('Usage:');
      console.log('   node unified-enrichment.js                          (check status)');
      console.log('   node unified-enrichment.js "Name" "MyNeta URL"      (enrich one)');
      console.log('   node unified-enrichment.js all                      (enrich all)\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updateOfficial, checkDatabaseStatus, scrapeMyNeta, analyzeWithOpenAI };
