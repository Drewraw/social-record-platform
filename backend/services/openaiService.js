const { OpenAI } = require('openai');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function fetchProfile(name, state) {
  const prompt = `Generate a detailed scorecard profile for ${name}, a politician from ${state}, India. Include:
- Current Office & Party
- Constituency
- Tenure
- Education
- Assets
- Liabilities
- Criminal Cases
- Political Background
- Career Highlights
- Source URLs (Wikipedia, MyNeta, news)
IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or backticks.`;

  try {
    console.log(`🔍 Fetching profile for ${name} using OpenAI...`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are a political data researcher. Always return valid JSON without markdown formatting or code blocks.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });
    
    let content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing backticks
    content = content.replace(/^`+|`+$/g, '');
    
    console.log('✅ OpenAI response received, parsing JSON...');
    
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI fetchProfile error:', error.message);
    if (error.message.includes('JSON')) {
      console.error('💡 Tip: OpenAI returned malformed JSON. Try running again.');
    }
    return null;
  }
}

module.exports = { fetchProfile };
