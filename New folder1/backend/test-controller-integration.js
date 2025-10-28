const pool = require('./config/database');
const openaiService = require('./services/openaiService');

async function directTest() {
  try {
    console.log('🧪 Direct OpenAI Controller Integration Test\n');
    console.log('='.repeat(80));
    
    // Get Pawan Kalyan from database
    const result = await pool.query('SELECT * FROM officials WHERE id = 7');
    
    if (result.rows.length === 0) {
      console.log('❌ Official ID 7 not found');
      return;
    }
    
    const official = result.rows[0];
    console.log(`\n📋 Official: ${official.name}`);
    console.log(`   Position: ${official.position}`);
    console.log(`   State: ${official.state}`);
    console.log(`   Current profile_data: ${official.profile_data ? 'EXISTS' : 'NULL'}\n`);
    
    if (!official.profile_data) {
      console.log('🔍 No profile data found. Fetching from OpenAI...\n');
      
      const profileData = await openaiService.fetchProfile(
        official.name,
        official.state || 'Andhra Pradesh'
      );
      
      if (profileData) {
        console.log('\n✅ Profile fetched successfully!');
        console.log('\n📊 Profile Structure:');
        console.log(JSON.stringify(profileData, null, 2));
        
        // Store in database
        await pool.query(
          `UPDATE officials SET 
            profile_data = $1,
            profile_updated_at = CURRENT_TIMESTAMP
          WHERE id = $2`,
          [JSON.stringify(profileData), official.id]
        );
        
        console.log('\n💾 Profile saved to database!');
        
        // Verify URLs
        console.log('\n🔗 URL Validation:');
        if (profileData.currentOfficeParty?.position?.sourceUrl) {
          console.log(`   ✓ Position URL: ${profileData.currentOfficeParty.position.sourceUrl}`);
        }
        if (profileData.assetsFinancials?.totalAssets?.sourceUrl) {
          console.log(`   ✓ Assets URL: ${profileData.assetsFinancials.totalAssets.sourceUrl}`);
        }
        if (profileData.criminalCases?.totalCases?.sourceUrl) {
          console.log(`   ✓ Criminal Cases URL: ${profileData.criminalCases.totalCases.sourceUrl}`);
        }
        
        console.log('\n✨ Integration test successful!');
        console.log('   - OpenAI fetched profile data');
        console.log('   - Data stored in database');
        console.log('   - URLs included in response');
      }
    } else {
      console.log('✅ Profile data already exists in database');
      const existingData = typeof official.profile_data === 'string' 
        ? JSON.parse(official.profile_data) 
        : official.profile_data;
      console.log('\n📊 Existing Profile Structure:');
      console.log(JSON.stringify(existingData, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

directTest();
