//Converts MyNeta JSON files and store to database records with proper field mapping
 

const fs = require('fs');
const path = require('path');
const pool = require('./config/database');
const { processStructuredData } = require('./services/structuredDataProcessor');

const JSON_DIR = path.join(__dirname, 'myneta-scraper');

/**
 * Extract field with source URL - Enhanced to handle Wikipedia/Wikidata sources
 */
function extractFieldWithSource(jsonData, ...fieldNames) {
  for (const field of fieldNames) {
    if (jsonData[field]) {
      if (typeof jsonData[field] === 'object' && jsonData[field].value) {
        return {
          value: jsonData[field].value,
          source: jsonData[field].sourceUrl || jsonData._source_url || ''
        };
      } else if (typeof jsonData[field] === 'string') {
        return {
          value: jsonData[field],
          source: jsonData._source_url || ''
        };
      }
    }
  }
  return { value: '', source: '' };
}

/**
 * Extract field with priority handling for multi-source data
 * MyNeta > Wikidata > Wikipedia priority
 */
function extractFieldWithMultiSource(jsonData, ...fieldNames) {
  let bestMatch = { value: '', source: '', priority: 0 };
  
  for (const field of fieldNames) {
    if (jsonData[field]) {
      console.log(`   🔎 Checking field "${field}":`, jsonData[field]);
      let fieldData = null;
      
      if (typeof jsonData[field] === 'object' && jsonData[field].value) {
        fieldData = {
          value: jsonData[field].value,
          source: jsonData[field].sourceUrl || jsonData._source_url || ''
        };
        console.log(`   ✅ Extracted from object:`, fieldData);
      } else if (typeof jsonData[field] === 'string') {
        fieldData = {
          value: jsonData[field],
          source: jsonData._source_url || ''
        };
        console.log(`   ✅ Extracted from string:`, fieldData);
      } else {
        console.log(`   ❌ Field type not handled:`, typeof jsonData[field]);
      }
      
      if (fieldData && fieldData.value) {
        // Determine source priority
        let priority = 0;
        if (fieldData.source.includes('myneta.info')) {
          priority = 3; // Highest priority
        } else if (fieldData.source.includes('wikidata') || fieldData.source.includes('multi-source-analysis')) {
          priority = 2; // Medium priority - includes hybrid analysis
        } else if (fieldData.source.includes('wikipedia')) {
          priority = 1; // Lower priority
        } else if (fieldData.value) {
          priority = 1; // Default priority for any valid data
        }
        
        console.log(`   📊 Priority assigned: ${priority} (source: ${fieldData.source})`);
        
        // Keep the highest priority match
        if (priority >= bestMatch.priority) {  // Changed > to >= to handle equal priorities
          bestMatch = { ...fieldData, priority };
          console.log(`   🏆 New best match:`, bestMatch);
        }
      }
    }
  }
  
  return { value: bestMatch.value, source: bestMatch.source };
}

/**
 * Extract field value from text that might contain embedded source like "Value [Source: url]"
 */
function extractValueFromEmbeddedSource(text) {
  if (!text) return { value: '', source: '' };
  
  // Check if text contains embedded source pattern
  const sourceMatch = text.match(/^(.*?)\s*\[Source:\s*(.*?)\]$/);
  if (sourceMatch) {
    return {
      value: sourceMatch[1].trim(),
      source: sourceMatch[2].trim()
    };
  }
  
  // If no embedded source, return the text as value
  return {
    value: text,
    source: ''
  };
}

/**
 * Convert and validate data types according to database schema
 */
function convertToProperDataType(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (fieldName) {
    case 'criminal_cases':
    case 'convicted_cases':
    case 'approvals':
    case 'disapprovals':
      // Integer fields
      const intValue = parseInt(value);
      return isNaN(intValue) ? 0 : intValue;
      
    case 'age':
      // Age should be integer, but stored as varchar in schema
      if (value && typeof value === 'string') {
        // If it's a date string (like "1970-06-19T00:00:00Z"), calculate age
        if (value.includes('-') && (value.includes('T') || value.length === 10)) {
          const birthDate = new Date(value);
          if (!isNaN(birthDate.getTime())) {
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            return age.toString();
          }
        }
        // If it's already a number, extract it
        const ageMatch = String(value).match(/(\d+)/);
        return ageMatch ? ageMatch[1] : value;
      }
      return value;
      
    case 'tenure':
      // Tenure should be a text field showing period, not a date
      if (value && typeof value === 'string') {
        // Convert "2019 to 2024" -> "2019-2024"
        const periodMatch = value.match(/(\d{4})\s*to\s*(\d{4})/i);
        if (periodMatch) {
          return `${periodMatch[1]}-${periodMatch[2]}`;
        }
        // Convert "2019-2024" -> keep as is
        const rangeMatch = value.match(/(\d{4})-(\d{4})/);
        if (rangeMatch) {
          return value;
        }
        // Single year -> "2019-Present"
        const yearMatch = value.match(/(\d{4})/);
        if (yearMatch) {
          return `${yearMatch[1]}-Present`;
        }
      }
      return value || 'Not Available';
      
    case 'consistent_winner':
    case 'knowledgeful':
      // Boolean-like fields stored as text
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      return String(value);
      
    default:
      // Text fields
      return String(value);
  }
}

/**
 * Extract criminal cases count from JSON data - Returns integer
 */
function extractCriminalCases(jsonData) {
  console.log('🔍 Criminal Cases Debug:');
  
  // First priority: Enhanced criminal cases data from scraper
  if (jsonData._enhanced_criminal_cases?.total_cases_count) {
    const cases = parseInt(jsonData._enhanced_criminal_cases.total_cases_count) || 0;
    console.log(`✅ Found in _enhanced_criminal_cases: ${cases}`);
    return cases;
  }
  
  // Second priority: Direct Criminal Cases field with .value
  if (jsonData['Criminal Cases']?.value) {
    const cases = parseInt(jsonData['Criminal Cases'].value) || 0;
    console.log(`✅ Found in Criminal Cases.value: ${cases}`);
    return cases;
  }
  
  // Try direct fields
  if (jsonData.criminal_cases) {
    const cases = parseInt(jsonData.criminal_cases) || 0;
    console.log(`✅ Found in criminal_cases: ${cases}`);
    return cases;
  }
  if (jsonData['Total Cases']?.value) {
    const cases = parseInt(jsonData['Total Cases'].value) || 0;
    console.log(`✅ Found in Total Cases.value: ${cases}`);
    return cases;
  }
  
  // If Criminal Cases field exists but only contains header text, count numbered cases
  if (jsonData['Criminal Cases']?.value && jsonData['Criminal Cases'].value.includes('Number of Criminal Cases:')) {
    // Count numbered criminal case entries (1, 2, 3, etc.)
    let count = 0;
    for (let i = 1; i <= 50; i++) { // Check up to 50 cases
      if (jsonData[i.toString()] && jsonData[i.toString()].value) {
        // Check if it contains criminal case indicators
        const caseText = jsonData[i.toString()].value.toLowerCase();
        if (caseText.includes('crime') || caseText.includes('fir') || caseText.includes('police station') || 
            caseText.includes('court') || caseText.includes('complaint')) {
          count++;
        }
      }
    }
    console.log(`✅ Counted numbered cases: ${count}`);
    return count;
  }
  
  // Enhanced detection: Count numbered criminal case entries even without "Criminal Cases" header
  // This handles cases where criminal cases are listed as numbered fields (1, 2, 3, etc.)
  let count = 0;
  for (let i = 1; i <= 50; i++) { // Check up to 50 cases
    if (jsonData[i.toString()] && jsonData[i.toString()].value) {
      // Check if it contains criminal case indicators
      const caseText = jsonData[i.toString()].value.toLowerCase();
      if (caseText.includes('police station') || caseText.includes('fir') || 
          caseText.includes('crime') || caseText.includes('court') || 
          caseText.includes('complaint') || caseText.includes('case no')) {
        count++;
        console.log(`   ✅ Found case ${i}: ${jsonData[i.toString()].value.substring(0, 50)}...`);
      }
    }
  }
  
  if (count > 0) {
    console.log(`✅ Counted ${count} numbered criminal cases`);
    return count;
  }
  
  console.log('❌ No criminal cases found, returning 0');
  return 0; // Default to 0 if no cases found
}

/**
 * Map JSON fields to database schema
 */
function mapJsonToDatabase(jsonData) {
  // Extract name from page title or search result
  let name = '';
  if (jsonData._page_title) {
    // Extract name from title like "Anumula Revanth Reddy(Indian National Congress(INC)):Constituency- KODANGAL"
    const match = jsonData._page_title.match(/^([^(]+)/);
    name = match ? match[1].trim() : '';
  } else if (jsonData._search_result_text) {
    name = jsonData._search_result_text;
  } else {
    name = jsonData.name || jsonData.candidate_name || '';
  }

  // Extract party from page title
  let party = '';
  if (jsonData._page_title) {
    const partyMatch = jsonData._page_title.match(/\(([^)]+)\)/);
    party = partyMatch ? partyMatch[1] : '';
  }

  // Extract constituency from page title
  let constituency = '';
  if (jsonData._page_title) {
    // Updated regex to capture full constituency including parentheses, stopping at " - Affidavit" or end of string
    const constituencyMatch = jsonData._page_title.match(/Constituency-\s*([^-]+?)(?:\s*-\s*Affidavit|$)/);
    constituency = constituencyMatch ? constituencyMatch[1].trim() : '';
  }

  // Extract state from constituency or page title
  let state = '';
  if (jsonData._page_title) {
    // Try to extract state from page title like "BANGALORE CENTRAL(KARNATAKA)" or "PULIVENDLA(KADAPA)"
    const stateMatch = jsonData._page_title.match(/\(([^)]*(?:KARNATAKA|ANDHRA|PRADESH|TELANGANA|KERALA|TAMIL|NADU|BIHAR|PUNJAB|HARYANA|RAJASTHAN|GUJARAT|MAHARASHTRA|ODISHA|BENGAL|ASSAM|HIMACHAL|UTTARAKHAND|JHARKHAND|CHHATTISGARH|MADHYA|UTTAR)[^)]*)\)/i);
    if (stateMatch) {
      state = stateMatch[1].trim();
    } else if (jsonData._source_url) {
      // Extract from URL like "AndhraPradesh2024" or "Karnataka2023"
      const urlStateMatch = jsonData._source_url.match(/(AndhraPradesh|Karnataka|Telangana|TamilNadu|Kerala|Maharashtra|Gujarat|Rajasthan|Punjab|Haryana|Bihar|Odisha|Bengal|Assam)/i);
      if (urlStateMatch) {
        state = urlStateMatch[1].replace(/([A-Z])/g, ' $1').trim(); // Convert "AndhraPradesh" to "Andhra Pradesh"
      }
    }
  }

  // Extract fields with multi-source priority handling (MyNeta > Wikidata > Wikipedia)
  const educationData = extractFieldWithMultiSource(jsonData, 
    'education', 'Education', 'Educational Qualification', 'Qualification',
    'Educational Institution', 'Education Details'
  );
  
  const ageData = extractFieldWithMultiSource(jsonData, 
    'age', 'Calculated Age', 'Age', 'Date of Birth', 'DOB', 'Birth Date', 'Birth Info'
  );
  
  const emailData = extractFieldWithMultiSource(jsonData, 
    'email', 'Email', 'Email ID'
  );
  
  // Extract dynasty and political relatives with multi-source support
  console.log('🔍 Dynasty Debug - Available fields:', Object.keys(jsonData).filter(k => k.includes('dynasty') || k.includes('Dynasty')));
  const dynastyData = extractFieldWithMultiSource(jsonData,
    'dynasty_status', 'Dynasty Status', 'Political Family', 'Family Background'
  );
  console.log('🔍 Dynasty extracted:', dynastyData);
  
  console.log('🔍 Relatives Debug - Available fields:', Object.keys(jsonData).filter(k => k.includes('relatives') || k.includes('Relatives')));
  const relativesData = extractFieldWithMultiSource(jsonData,
    'political_relatives', 'Political Relatives', 'Family Members'
  );
  console.log('🔍 Relatives extracted:', relativesData);
  
  // Extract tenure data 
  const tenureData = extractFieldWithMultiSource(jsonData,
    'tenure', 'Tenure', 'Term', 'Constituency Details', 'Service Period', 'Years in Office'
  );
  
  // Extract image URL
  const imageData = extractFieldWithMultiSource(jsonData,
    'image_url', 'Image URL', 'Photo URL', 'Picture', 'Image', 'Wikipedia Image', 'profile_image_myneta'
  );
  
  // Extract profession/business interests
  const professionData = extractFieldWithMultiSource(jsonData,
    'profession', 'Profession', 'Occupation', 'Business', 'Professional Background', 'Business Interests'
  );
  
  // For assets and liabilities, extract both value and source
  const assetsRaw = jsonData.assets || jsonData['Total Assets']?.value || jsonData['Assets:']?.value || jsonData['Assets']?.value || '';
  const assetsData = extractValueFromEmbeddedSource(assetsRaw);
  if (!assetsData.source) {
    assetsData.source = jsonData._source_url || '';
  }
  
  const liabilitiesRaw = jsonData.liabilities || jsonData['Total Liabilities']?.value || jsonData['Liabilities:']?.value || jsonData['Liabilities']?.value || '';
  const liabilitiesData = extractValueFromEmbeddedSource(liabilitiesRaw);
  if (!liabilitiesData.source) {
    liabilitiesData.source = jsonData._source_url || '';
  }

  // Extract enhanced criminal cases data with conviction status
  const enhancedCriminalData = jsonData._enhanced_criminal_cases;
  const convictedCases = enhancedCriminalData ? parseInt(enhancedCriminalData.conviction_breakdown.convicted) || 0 : 0;
  
  // Extract and format business interests/family wealth from multiple sources
  const businessSources = [
    jsonData['Family Wealth']?.value || jsonData['Family Wealth'],
    jsonData['Business Interests']?.value || jsonData['Business Interests'],
    jsonData.profession?.value || jsonData.profession,
    jsonData.business?.value || jsonData.business,
    jsonData.occupation?.value || jsonData.occupation,
    jsonData['Family Business']?.value || jsonData['Family Business'],
    jsonData.family_wealth
  ].filter(Boolean);
  
  const familyWealthRaw = businessSources.length > 0 ? businessSources[0] : '';
  const familyWealthData = extractValueFromEmbeddedSource(familyWealthRaw);
  if (!familyWealthData.source) {
    familyWealthData.source = jsonData._source_url || '';
  }
  
  console.log('🔍 Political Relatives Debug:');
  console.log('relativesData:', relativesData);
  console.log('dynastyData:', dynastyData);

  const mapped = {
    // Basic profile data
    name: convertToProperDataType(name, 'name'),
    constituency: convertToProperDataType(constituency || jsonData.constituency || jsonData.constituency_name || '', 'constituency'),
    party: convertToProperDataType(party || jsonData.party || jsonData.party_name || '', 'party'),
    position: convertToProperDataType(jsonData.position || jsonData.office || 'MLA', 'position'),
    state: convertToProperDataType(state || jsonData.state || '', 'state'),
    tenure: convertToProperDataType(tenureData.value, 'tenure'),
    dynasty_status: convertToProperDataType(dynastyData.value || 'Unknown', 'dynasty_status'),
    
    // Field values (clean, without embedded sources) - with proper data types
    education: convertToProperDataType(educationData.value, 'education'),
    age: convertToProperDataType(ageData.value, 'age'),
    assets: convertToProperDataType(assetsData.value, 'assets'),
    liabilities: convertToProperDataType(liabilitiesData.value, 'liabilities'),
    criminal_cases: convertToProperDataType(extractCriminalCases(jsonData), 'criminal_cases'),
    convicted_cases: convertToProperDataType(convictedCases, 'convicted_cases'),
    political_relatives: convertToProperDataType(relativesData.value, 'political_relatives'),
    family_wealth: convertToProperDataType(familyWealthData.value || professionData.value, 'family_wealth'),
    image_url: convertToProperDataType(imageData.value, 'image_url'),
    contact_email: convertToProperDataType(emailData.value, 'contact_email'),
    knowledgeful: convertToProperDataType(0, 'knowledgeful'),
    consistent_winner: convertToProperDataType(false, 'consistent_winner'),
    serial_number: null,
    approvals: convertToProperDataType(0, 'approvals'),
    disapprovals: convertToProperDataType(0, 'disapprovals'),
    
    // Source URL columns
    name_source: jsonData._source_url || '',
    constituency_source: jsonData._source_url || '',
    party_source: jsonData._source_url || '',
    position_source: jsonData._source_url || '',
    state_source: jsonData._source_url || '',
    tenure_source: tenureData.source || jsonData._source_url || '',
    dynasty_status_source: dynastyData.source || jsonData._source_url || '',
    education_source: educationData.source,
    age_source: ageData.source,
    assets_source: assetsData.source,
    liabilities_source: liabilitiesData.source,
    criminal_cases_source: jsonData._source_url || '',
    convicted_cases_source: jsonData._source_url || '',
    political_relatives_source: relativesData.source,
    family_wealth_source: familyWealthData.source || professionData.source,
    image_url_source: imageData.source || jsonData._source_url || '',
    contact_email_source: emailData.source,
    knowledgeful_source: '',
    consistent_winner_source: ''
  };

  return mapped;
}

/**
 * Insert or update official in database
 */
async function upsertOfficial(mappedData) {
  try {
    // Check if official exists (exact match by name first, then fuzzy)
    let existingResult = await pool.query(`
      SELECT id FROM officials
      WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
      LIMIT 1
    `, [mappedData.name]);

    // If no exact match, try fuzzy match
    if (existingResult.rows.length === 0 && mappedData.name) {
      existingResult = await pool.query(`
        SELECT id FROM officials
        WHERE LOWER(REPLACE(name, ' ', '')) LIKE LOWER(REPLACE($1, ' ', '')) || '%'
        LIMIT 1
      `, [mappedData.name]);
    }

    if (existingResult.rows.length > 0) {
      // Update existing
      const officialId = existingResult.rows[0].id;
      await pool.query(`
        UPDATE officials SET
          constituency = $2, party = $3, position = $4, state = $5, tenure = $6,
          dynasty_status = $7, education = $8, age = $9, assets = $10, 
          liabilities = $11, criminal_cases = $12, convicted_cases = $13, political_relatives = $14,
          family_wealth = $15, image_url = $16, contact_email = $17, knowledgeful = $18,
          consistent_winner = $19, approvals = $20, disapprovals = $21,
          -- Source URL fields
          constituency_source = $22, party_source = $23, position_source = $24, state_source = $25, 
          tenure_source = $26, dynasty_status_source = $27, education_source = $28, age_source = $29, 
          assets_source = $30, liabilities_source = $31, criminal_cases_source = $32, 
          convicted_cases_source = $33, political_relatives_source = $34, family_wealth_source = $35, 
          image_url_source = $36, contact_email_source = $37, updated_at = NOW()
        WHERE id = $1
      `, [
        officialId, mappedData.constituency, mappedData.party, mappedData.position,
        mappedData.state, mappedData.tenure, mappedData.dynasty_status, mappedData.education,
        mappedData.age, mappedData.assets, mappedData.liabilities, mappedData.criminal_cases,
        mappedData.convicted_cases, mappedData.political_relatives, mappedData.family_wealth,
        mappedData.image_url, mappedData.contact_email, mappedData.knowledgeful, mappedData.consistent_winner,
        mappedData.approvals, mappedData.disapprovals,
        // Source URLs
        mappedData.constituency_source, mappedData.party_source, mappedData.position_source, mappedData.state_source,
        mappedData.tenure_source, mappedData.dynasty_status_source, mappedData.education_source, mappedData.age_source,
        mappedData.assets_source, mappedData.liabilities_source, mappedData.criminal_cases_source,
        mappedData.convicted_cases_source, mappedData.political_relatives_source, mappedData.family_wealth_source,
        mappedData.image_url_source, mappedData.contact_email_source
      ]);

      console.log(`✅ Updated existing official: ${mappedData.name} (ID: ${officialId})`);
      return officialId;
    } else {
      // Insert new
      const insertResult = await pool.query(`
        INSERT INTO officials (
          name, constituency, party, position, state, tenure, dynasty_status,
          education, age, assets, liabilities, criminal_cases, convicted_cases, political_relatives,
          family_wealth, image_url, contact_email, knowledgeful, consistent_winner, approvals, disapprovals,
          -- Source URL fields
          name_source, constituency_source, party_source, position_source, state_source, tenure_source, 
          dynasty_status_source, education_source, age_source, assets_source, liabilities_source, 
          criminal_cases_source, convicted_cases_source, political_relatives_source, family_wealth_source, 
          image_url_source, contact_email_source, knowledgeful_source, consistent_winner_source,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, NOW())
        RETURNING id
      `, [
        mappedData.name, mappedData.constituency, mappedData.party, mappedData.position,
        mappedData.state, mappedData.tenure, mappedData.dynasty_status, mappedData.education,
        mappedData.age, mappedData.assets, mappedData.liabilities, mappedData.criminal_cases,
        mappedData.convicted_cases, mappedData.political_relatives, mappedData.family_wealth,
        mappedData.image_url, mappedData.contact_email, mappedData.knowledgeful, mappedData.consistent_winner,
        mappedData.approvals, mappedData.disapprovals,
        // Source URLs
        mappedData.name_source, mappedData.constituency_source, mappedData.party_source, mappedData.position_source, 
        mappedData.state_source, mappedData.tenure_source, mappedData.dynasty_status_source, mappedData.education_source, 
        mappedData.age_source, mappedData.assets_source, mappedData.liabilities_source, mappedData.criminal_cases_source,
        mappedData.convicted_cases_source, mappedData.political_relatives_source, mappedData.family_wealth_source, 
        mappedData.image_url_source, mappedData.contact_email_source, mappedData.knowledgeful_source, mappedData.consistent_winner_source
      ]);

      const newId = insertResult.rows[0].id;
      console.log(`✅ Inserted new official: ${mappedData.name} (ID: ${newId})`);
      return newId;
    }
  } catch (error) {
    console.error(` Error upserting ${mappedData.name}:`, error.message);
    throw error;
  }
}

/**
 * Process a single JSON file with structured data processing
 */
async function processJsonFile(filePath) {
  try {
    console.log(`\n📄 Processing: ${path.basename(filePath)}`);

    const rawData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Handle both single object and array formats
    const politicians = Array.isArray(jsonData) ? jsonData : [jsonData];

    for (const politician of politicians) {
      // Extract politician name for structured processing
      let politicianName = '';
      if (politician._page_title) {
        const match = politician._page_title.match(/^([^(]+)/);
        politicianName = match ? match[1].trim() : '';
      } else if (politician._search_result_text) {
        politicianName = politician._search_result_text;
      } else {
        politicianName = politician.name || politician.candidate_name || 'Unknown';
      }

      console.log(`   👤 Processing: ${politicianName}`);
      
      const mappedData = mapJsonToDatabase(politician);
      
      // Log source diversity
      const sources = Object.keys(mappedData)
        .filter(key => key.endsWith('_source'))
        .map(key => mappedData[key])
        .filter(source => source);
      
      const sourceTypes = {
        myneta: sources.filter(s => s.includes('myneta.info')).length,
        wikidata: sources.filter(s => s.includes('wikidata.org')).length,
        wikipedia: sources.filter(s => s.includes('wikipedia.org')).length
      };
      
      if (sourceTypes.wikidata > 0 || sourceTypes.wikipedia > 0) {
        console.log(`      📊 Multi-source data: MyNeta(${sourceTypes.myneta}) + Wikidata(${sourceTypes.wikidata}) + Wikipedia(${sourceTypes.wikipedia})`);
      }
      
      // Apply structured data processing if OpenAI is available
      if (politicianName && politicianName !== 'Unknown' && process.env.OPENAI_API_KEY) {
        console.log(`   🤖 Applying structured data processing...`);
        try {
          const structuredEnhancements = await processStructuredData(mappedData, politicianName);
          
          // Merge structured enhancements
          Object.assign(mappedData, structuredEnhancements);
          console.log(`   ✅ Structured data applied for ${politicianName}`);
          
        } catch (error) {
          console.error(`   ⚠️ Structured processing failed for ${politicianName}:`, error.message);
          console.log(`   📝 Continuing with basic data processing...`);
        }
      } else {
        console.log(`   📝 Using basic data processing (OpenAI not configured)`);
      }
      
      await upsertOfficial(mappedData);
    }

    return politicians.length;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Process all JSON files in directory
 */
async function processAllJsonFiles() {
  console.log('\n🔄 JSON to Database Converter');
  console.log('='.repeat(50));

  try {
    // Get all JSON files
    const files = fs.readdirSync(JSON_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(JSON_DIR, f));

    if (files.length === 0) {
      console.log('❌ No JSON files found in', JSON_DIR);
      return;
    }

    console.log(`📋 Found ${files.length} JSON file(s) to process\n`);

    let totalProcessed = 0;
    let successCount = 0;

    for (const file of files) {
      try {
        const count = await processJsonFile(file);
        totalProcessed += count;
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to process ${path.basename(file)}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 CONVERSION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Files processed: ${successCount}/${files.length}`);
    console.log(`👥 Officials processed: ${totalProcessed}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

/**
 * Process specific JSON file
 */
async function processSpecificFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const count = await processJsonFile(filePath);
    console.log(`\n✅ Successfully processed ${count} official(s) from ${path.basename(filePath)}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Process all files
    processAllJsonFiles();
  } else if (args.length === 1) {
    // Process specific file
    const filePath = path.resolve(args[0]);
    processSpecificFile(filePath);
  } else {
    console.log('\n❌ Usage:');
    console.log('  node json-to-db-converter.js              # Process all JSON files');
    console.log('  node json-to-db-converter.js <file.json>   # Process specific file');
    process.exit(1);
  }
}

module.exports = {
  processJsonFile,
  processAllJsonFiles,
  mapJsonToDatabase,
  upsertOfficial
};
