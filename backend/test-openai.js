const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAIProfileFetch() {
  console.log('🧪 Testing OpenAI API for politician profile data...\n');
  const politicianName = "Nara Chandrababu Naidu";
  const prompt = `
Create a politician information scorecard for ${politicianName} in CSV format with 3 columns: Category, Detail/Score, Source URL.
Include these categories with appropriate source URLs (Wikipedia, MyNeta, news sites):
- Current Office & Position
- Party & Constituency
- Education
- Assets (in ₹ Crore)
- Criminal Cases
- Political Background
- Career Highlights
Format each line as:
Category Name,Detailed Information,https://source-url.com
Provide realistic URLs for each data point (Wikipedia, MyNeta, major news outlets).
`;
  try {
    console.log('📡 Sending request to OpenAI...\n');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a political data researcher who provides accurate, verified information with source citations. Always include actual URLs to sources."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    const result = response.choices[0].message.content;
    console.log('✅ OpenAI Response:\n');
    console.log('='.repeat(80));
    console.log(result);
    console.log('='.repeat(80));
    // Parse and validate URLs
    console.log('\n📊 Validating URLs...\n');
    const lines = result.split('\n').filter(line => line.trim());
    let urlCount = 0;
    lines.forEach((line, index) => {
      if (line.includes('http://') || line.includes('https://')) {
        urlCount++;
        const parts = line.split(',');
        if (parts.length >= 3) {
          const url = parts[parts.length - 1].trim();
          console.log(`✓ Row ${index + 1}: ${parts[0]} -> ${url}`);
        }
      }
    });
    console.log(`\n✅ Found ${urlCount} URLs in response`);
    // Check token usage
    if (response.usage) {
      console.log('\n📈 API Usage:');
      console.log(`   Prompt tokens: ${response.usage.prompt_tokens}`);
      console.log(`   Completion tokens: ${response.usage.completion_tokens}`);
      console.log(`   Total tokens: ${response.usage.total_tokens}`);
      console.log(`   Model: ${response.model}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    throw error;
  }
}

testOpenAIProfileFetch()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });