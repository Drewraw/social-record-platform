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
Format as JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a political data researcher.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI fetchProfile error:', error.message);
    return null;
  }
}

module.exports = { fetchProfile };
