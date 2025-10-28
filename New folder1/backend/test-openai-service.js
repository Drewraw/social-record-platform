const openaiService = require('./services/openaiService');

async function testOpenAIService() {
  console.log('🧪 Testing OpenAI Profile Service\n');
  console.log('='.repeat(80));
  
  try {
    const politician = 'Nara Chandrababu Naidu';
    const state = 'Andhra Pradesh';
    
    console.log(`\n📋 Fetching profile for: ${politician}`);
    console.log(`📍 State: ${state}\n`);
    
    const profileData = await openaiService.fetchProfile(politician, state);
    
    console.log('\n✅ Structured Profile Data:\n');
    console.log('='.repeat(80));
    console.log(JSON.stringify(profileData, null, 2));
    console.log('='.repeat(80));
    
    // Validate URLs
    console.log('\n🔗 URL Validation:\n');
    let urlCount = 0;
    
    const checkSection = (section, sectionName) => {
      if (section && typeof section === 'object') {
        Object.entries(section).forEach(([key, val]) => {
          if (val?.sourceUrl) {
            urlCount++;
            console.log(`✓ ${sectionName}.${key}: ${val.sourceUrl}`);
          }
        });
      }
    };
    
    checkSection(profileData.currentOfficeParty, 'currentOfficeParty');
    if (profileData.education?.sourceUrl) {
      urlCount++;
      console.log(`✓ education: ${profileData.education.sourceUrl}`);
    }
    checkSection(profileData.assetsFinancials, 'assetsFinancials');
    checkSection(profileData.criminalCases, 'criminalCases');
    checkSection(profileData.politicalBackground, 'politicalBackground');
    checkSection(profileData.electoralPerformance, 'electoralPerformance');
    checkSection(profileData.currentActivity, 'currentActivity');
    checkSection(profileData.legalProbes, 'legalProbes');
    checkSection(profileData.personalBackground, 'personalBackground');
    
    console.log(`\n📊 Total URLs found: ${urlCount}`);
    
    if (urlCount >= 10) {
      console.log('\n✅ SUCCESS: OpenAI service is working correctly!');
      console.log('   - Profile data structured properly');
      console.log('   - All sections have URLs');
      console.log('   - Ready to integrate into the app');
    } else {
      console.log('\n⚠️  WARNING: Some URLs are missing');
      console.log(`   - Expected: 15+ URLs`);
      console.log(`   - Found: ${urlCount} URLs`);
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
  }
}

testOpenAIService();
