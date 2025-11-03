/**
 * JSON to Database Converter
 * Converts MyNeta JSON files to database records with proper field mapping
 */

const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

const JSON_DIR = path.join(__dirname, 'myneta-scraper');

/**
 * Map JSON fields to database schema
 */
function mapJsonToDatabase(jsonData) {
  const mapped = {
    name: jsonData.name || jsonData.candidate_name || '',
    constituency: jsonData.constituency || jsonData.constituency_name || '',
    party: jsonData.party || jsonData.party_name || '',
    position: jsonData.position || jsonData.office || 'MLA',
    education: jsonData.education || jsonData['Education']?.value || jsonData['Educational Qualification']?.value || '',
    age: jsonData.age || jsonData['Age']?.value || '',
    assets: jsonData.assets || jsonData['Total Assets']?.value || jsonData['Assets:']?.value || jsonData['Assets']?.value || '',
    liabilities: jsonData.liabilities || jsonData['Total Liabilities']?.value || jsonData['Liabilities:']?.value || jsonData['Liabilities']?.value || '',
    criminal_cases: jsonData.criminal_cases || jsonData['Criminal Cases']?.value || jsonData['Total Cases']?.value || '0',
    profession: jsonData.profession || jsonData['Profession']?.value || 'Politician',
    email: jsonData.email || jsonData['Email']?.value || jsonData['Email ID']?.value || '',
    phone: jsonData.phone || jsonData['Phone']?.value || jsonData['Mobile']?.value || '',
    dynasty_status: jsonData.dynasty_status || 'Unknown',
    political_relatives: jsonData.political_relatives || '',
    image_url: jsonData.image_url || jsonData.image || '',
    profile_data: JSON.stringify(jsonData),
    source_url: jsonData._source_url || jsonData.source_url || '',
    scraped_at: jsonData._scraped_at || new Date().toISOString()
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
          constituency = $2, party = $3, position = $4, education = $5,
          age = $6, assets = $7, liabilities = $8, criminal_cases = $9,
          profession = $10, email = $11, phone = $12, dynasty_status = $13,
          political_relatives = $14, image_url = $15, profile_data = $16,
          source_url = $17, scraped_at = $18, updated_at = NOW()
        WHERE id = $1
      `, [
        officialId, mappedData.constituency, mappedData.party, mappedData.position,
        mappedData.education, mappedData.age, mappedData.assets, mappedData.liabilities,
        mappedData.criminal_cases, mappedData.profession, mappedData.email,
        mappedData.phone, mappedData.dynasty_status, mappedData.political_relatives,
        mappedData.image_url, mappedData.profile_data, mappedData.source_url,
        mappedData.scraped_at
      ]);

      console.log(`✅ Updated existing official: ${mappedData.name} (ID: ${officialId})`);
      return officialId;
    } else {
      // Insert new
      const insertResult = await pool.query(`
        INSERT INTO officials (
          name, constituency, party, position, education, age, assets,
          liabilities, criminal_cases, profession, email, phone,
          dynasty_status, political_relatives, image_url, profile_data,
          source_url, scraped_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        RETURNING id
      `, [
        mappedData.name, mappedData.constituency, mappedData.party, mappedData.position,
        mappedData.education, mappedData.age, mappedData.assets, mappedData.liabilities,
        mappedData.criminal_cases, mappedData.profession, mappedData.email,
        mappedData.phone, mappedData.dynasty_status, mappedData.political_relatives,
        mappedData.image_url, mappedData.profile_data, mappedData.source_url,
        mappedData.scraped_at
      ]);

      const newId = insertResult.rows[0].id;
      console.log(` Inserted new official: ${mappedData.name} (ID: ${newId})`);
      return newId;
    }
  } catch (error) {
    console.error(` Error upserting ${mappedData.name}:`, error.message);
    throw error;
  }
}

/**
 * Process a single JSON file
 */
async function processJsonFile(filePath) {
  try {
    console.log(`\n📄 Processing: ${path.basename(filePath)}`);

    const rawData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Handle both single object and array formats
    const politicians = Array.isArray(jsonData) ? jsonData : [jsonData];

    for (const politician of politicians) {
      const mappedData = mapJsonToDatabase(politician);
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
