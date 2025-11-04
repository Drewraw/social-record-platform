/**
 * Test Structured Data Processor
 * Tests the enhanced data formatting for frontend display
 */

require('dotenv').config();
const { 
  processStructuredPoliticalRelatives,
  processStructuredBusinessInterests,
  processPartyHistory,
  formatEducationData,
  formatFinancialData 
} = require('./services/structuredDataProcessor');

async function testStructuredDataProcessor() {
  console.log('\n🧪 Testing Structured Data Processor');
  console.log('=' * 60);
  
  // Test 1: Political Relatives Processing
  console.log('\n📋 Test 1: Political Relatives Processing');
  const rawRelatives = 'Y. S. Rajasekhara Reddy - Father, Former Chief Minister of Andhra Pradesh, YSR Congress Party';
  const processedRelatives = await processStructuredPoliticalRelatives(rawRelatives, 'Y.S. Jagan Mohan Reddy');
  console.log(`Input: ${rawRelatives}`);
  console.log(`Output: ${processedRelatives}`);
  console.log(`✅ Expected Format: "Name - Relation - Position - Party (Year)"`);
  
  // Test 2: Business Interests Processing  
  console.log('\n🏢 Test 2: Business Interests Processing');
  const rawBusiness = 'Real Estate and Media Business';
  const processedBusiness = await processStructuredBusinessInterests(rawBusiness, 'Y.S. Jagan Mohan Reddy', '₹510 Crore');
  console.log(`Input: ${rawBusiness}`);
  console.log(`Output: ${processedBusiness}`);
  
  // Test 3: Party History Processing
  console.log('\n🏛️ Test 3: Party History Processing');
  const processedParty = await processPartyHistory('Y.S. Jagan Mohan Reddy', 'YSR Congress Party', 'Pulivendula');
  console.log(`Output: ${processedParty}`);
  
  // Test 4: Education Formatting
  console.log('\n📚 Test 4: Education Formatting');
  const educationTests = ['Post Graduate', 'graduate professional', '12th pass', 'Others'];
  educationTests.forEach(edu => {
    const formatted = formatEducationData(edu);
    console.log(`"${edu}" → "${formatted}"`);
  });
  
  // Test 5: Financial Data Formatting
  console.log('\n💰 Test 5: Financial Data Formatting');
  const financialTests = [
    ['9,31,83,70,656~ 931 Crore+', '10,32,05,875~ 10 Crore+'],
    ['5,25,00,000', '50,00,000'],
    ['Not Available', '']
  ];
  
  financialTests.forEach(([assets, liabilities]) => {
    const formatted = formatFinancialData(assets, liabilities);
    console.log(`Assets: "${assets}" → "${formatted.assets}"`);
    console.log(`Liabilities: "${liabilities}" → "${formatted.liabilities}"`);
  });
  
  console.log('\n' + '=' * 60);
  console.log('✅ Structured Data Processor Tests Completed');
  console.log('\n💡 This will help ensure single, clear values for frontend display!');
}

// Run tests if OpenAI key is available
if (process.env.OPENAI_API_KEY) {
  testStructuredDataProcessor().catch(console.error);
} else {
  console.log('\n⚠️ OPENAI_API_KEY not found in environment variables');
  console.log('💡 Add OPENAI_API_KEY to .env file to test structured processing');
  
  // Test non-OpenAI functions
  console.log('\n🔧 Testing Non-OpenAI Functions:');
  
  const { formatEducationData, formatFinancialData } = require('./services/structuredDataProcessor');
  
  console.log('\n📚 Education Formatting:');
  ['Post Graduate', 'graduate', '12th pass'].forEach(edu => {
    console.log(`"${edu}" → "${formatEducationData(edu)}"`);
  });
  
  console.log('\n💰 Financial Formatting:');
  const formatted = formatFinancialData('9,31,83,70,656~ 931 Crore+', '10,32,05,875~ 10 Crore+');
  console.log(`Assets: "${formatted.assets}"`);
  console.log(`Liabilities: "${formatted.liabilities}"`);
}