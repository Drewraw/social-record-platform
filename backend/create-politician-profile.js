/**
 * Universal Politician Profile Creator using OpenAI
 * Usage: node create-politician-profile.js "Politician Name" "State" "Position" "Party" "Constituency"
 * Example: node create-politician-profile.js "D. K. Shivakumar" "Karnataka" "Deputy Chief Minister" "Indian National Congress" "Kanakapura"
 */

require('dotenv').config();
const pool = require('./config/database');
const openaiService = require('./services/openaiService');

async function createPoliticianProfile(name, state, position, party, constituency) {
  try {
    console.log('\n🔍 Creating Politician Profile with OpenAI\n');
    console.log('='.repeat(80));
    console.log(`\n   Name: ${name}`);
    console.log(`   State: ${state}`);
    console.log(`   Position: ${position}`);
    console.log(`   Party: ${party}`);
    console.log(`   Constituency: ${constituency}\n`);
    console.log('='.repeat(80));
    
    // Step 1: Check if politician already exists
    console.log('\n🔍 Step 1: Checking if politician exists...\n');
    
    const existingCheck = await pool.query(
      'SELECT id, name, profile_data FROM officials WHERE name = $1',
      [name]
    );
    
    let officialId;
    let isUpdate = false;
    
    if (existingCheck.rows.length > 0) {
      officialId = existingCheck.rows[0].id;
      isUpdate = true;
      console.log(`⚠️  Politician already exists with ID: ${officialId}`);
      console.log(`   Will update the profile...\n`);
    } else {
      console.log(`✅ Politician does not exist. Creating new record...\n`);
    }
    
    // Step 2: Fetch profile data from OpenAI
    console.log('🤖 Step 2: Fetching comprehensive profile from OpenAI...\n');
    console.log('   Using scorecard template with URLs...');
    console.log('   This may take 10-15 seconds...\n');
    
    const profileData = await openaiService.fetchProfile(name, state);
    
    if (!profileData) {
      console.log('❌ Failed to fetch profile data from OpenAI');
      console.log('   Please check your API key and try again.');
      return;
    }
    
    console.log('✅ Profile data fetched successfully!\n');
    
    // Step 3: Insert or Update the record
    if (isUpdate) {
      console.log('💾 Step 3: Updating existing profile...\n');
      
      await pool.query(
        `UPDATE officials SET 
          position = $1,
          party = $2,
          constituency = $3,
          state = $4,
          profile_data = $5,
          profile_updated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6`,
        [position, party, constituency, state, JSON.stringify(profileData), officialId]
      );
      
      console.log('✅ Profile updated in database!\n');
      
    } else {
      console.log('💾 Step 3: Creating new profile...\n');
      
      const insertResult = await pool.query(
        `INSERT INTO officials (
          name, 
          position, 
          party, 
          constituency, 
          state,
          tenure, 
          dynasty_status,
          education,
          assets,
          liabilities,
          criminal_cases,
          image_url,
          profile_data,
          profile_updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, name`,
        [
          name,
          position,
          party,
          constituency,
          state,
          profileData.currentOfficeParty?.tenure?.value || 'To be updated',
          profileData.politicalBackground?.dynastyStatus?.value || 'Unknown',
          profileData.education?.value || 'To be updated',
          profileData.assetsFinancials?.totalAssets?.value || 'To be updated',
          profileData.assetsFinancials?.liabilities?.value || 'To be updated',
          profileData.criminalCases?.totalCases?.value || 'To be updated',
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`,
          75, // Default score
          0,  // Default approvals
          0,  // Default disapprovals
          JSON.stringify(profileData),
          new Date()
        ]
      );
      
      officialId = insertResult.rows[0].id;
      console.log(`✅ Profile created with ID: ${officialId}\n`);
    }
    
    // Step 4: Verify and display the data
    console.log('🔍 Step 4: Verifying stored data...\n');
    
    const verifyResult = await pool.query(
      'SELECT id, name, position, party, state, constituency, profile_data FROM officials WHERE id = $1',
      [officialId]
    );
    
    const official = verifyResult.rows[0];
    
    console.log('='.repeat(80));
    console.log(`\n✅ SUCCESS! ${name} Profile ${isUpdate ? 'Updated' : 'Created'} with OpenAI\n`);
    console.log('='.repeat(80));
    console.log(`\n   ID: ${official.id}`);
    console.log(`   Name: ${official.name}`);
    console.log(`   Position: ${official.position}`);
    console.log(`   Party: ${official.party}`);
    console.log(`   State: ${official.state}`);
    console.log(`   Constituency: ${official.constituency}`);
    console.log(`   Profile Data: ${official.profile_data ? 'STORED ✓' : 'MISSING ✗'}`);
    
    // Show profile data structure
    if (official.profile_data) {
      const profile = official.profile_data;
      console.log('\n📊 Scorecard Template Data Summary:\n');
      
      console.log('   1. Current Office & Party:');
      console.log(`      • Position: ${profile.currentOfficeParty?.position?.value || 'N/A'}`);
      console.log(`      • Party: ${profile.currentOfficeParty?.party?.value || 'N/A'}`);
      console.log(`      • Constituency: ${profile.currentOfficeParty?.constituency?.value || 'N/A'}`);
      console.log(`      • Tenure: ${profile.currentOfficeParty?.tenure?.value || 'N/A'}`);
      
      console.log('\n   2. Education:');
      console.log(`      • ${profile.education?.value || 'N/A'}`);
      
      console.log('\n   3. Ministerial Portfolios:');
      console.log(`      • ${profile.ministerialPortfolios?.value || 'N/A'}`);
      
      console.log('\n   4. Assets & Financials:');
      console.log(`      • Total Assets: ${profile.assetsFinancials?.totalAssets?.value || 'N/A'}`);
      console.log(`      • Source of Wealth: ${profile.assetsFinancials?.sourceOfWealth?.value || 'N/A'}`);
      console.log(`      • Liabilities: ${profile.assetsFinancials?.liabilities?.value || 'N/A'}`);
      
      console.log('\n   5. Criminal Cases:');
      console.log(`      • Total Cases: ${profile.criminalCases?.totalCases?.value || 'N/A'}`);
      console.log(`      • Serious Charges: ${profile.criminalCases?.seriousCharges?.value || 'N/A'}`);
      
      console.log('\n   6. Political Background:');
      console.log(`      • Dynasty Status: ${profile.politicalBackground?.dynastyStatus?.value || 'N/A'}`);
      console.log(`      • Career Highlight: ${profile.politicalBackground?.careerHighlight?.value || 'N/A'}`);
      
      console.log('\n   7. Electoral Performance:');
      console.log(`      • Wins/Losses: ${profile.electoralPerformance?.winsLosses?.value || 'N/A'}`);
      console.log(`      • Vote Share: ${profile.electoralPerformance?.voteShare?.value || 'N/A'}`);
      
      console.log('\n   8. Current Activity & Initiatives:');
      console.log(`      • Recent Work: ${profile.currentActivity?.recentWork?.value || 'N/A'}`);
      console.log(`      • Key Promises: ${profile.currentActivity?.keyPromises?.value || 'N/A'}`);
      
      // Count URLs
      const jsonString = JSON.stringify(profile);
      const urlMatches = jsonString.match(/https?:\/\/[^\s"]+/g);
      const urlCount = urlMatches ? urlMatches.length : 0;
      console.log(`\n   🔗 Source URLs: ${urlCount} URLs included`);
      
      // List some URLs
      if (urlMatches && urlMatches.length > 0) {
        console.log('\n   Sample URLs:');
        urlMatches.slice(0, 5).forEach((url, i) => {
          console.log(`      ${i+1}. ${url.substring(0, 70)}${url.length > 70 ? '...' : ''}`);
        });
        if (urlMatches.length > 5) {
          console.log(`      ... and ${urlMatches.length - 5} more URLs`);
        }
      }
    }
    
    console.log('\n='.repeat(80));
    console.log('\n📍 Database Location:');
    console.log('   Database: social_record_platform_postgress_db');
    console.log('   Table: officials');
    console.log('   Column: profile_data (JSONB)');
    console.log(`   Record ID: ${officialId}`);
    
    console.log('\n🌐 View Profile:');
    console.log(`   API: http://localhost:5001/api/officials/${officialId}`);
    console.log(`   Frontend: http://localhost:3000/profile/${officialId}`);
    
    console.log('\n✨ Profile created successfully with OpenAI aggregation!');
    console.log('   Data stored in scorecard template format with URLs\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 5) {
  console.log('\n❌ Error: Missing required arguments\n');
  console.log('Usage: node create-politician-profile.js "Name" "State" "Position" "Party" "Constituency"\n');
  console.log('Examples:');
  console.log('  node create-politician-profile.js "D. K. Shivakumar" "Karnataka" "Deputy Chief Minister" "Indian National Congress" "Kanakapura"');
  console.log('  node create-politician-profile.js "Yogi Adityanath" "Uttar Pradesh" "Chief Minister" "Bharatiya Janata Party" "Gorakhpur Urban"');
  console.log('  node create-politician-profile.js "Mamata Banerjee" "West Bengal" "Chief Minister" "All India Trinamool Congress" "Bhabanipur"\n');
  process.exit(1);
}

const [name, state, position, party, constituency] = args;

createPoliticianProfile(name, state, position, party, constituency);
