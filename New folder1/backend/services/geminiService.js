const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Gemini AI Service for Data Aggregation and Analysis
 * Uses Google's Gemini API to enhance and verify official data
 */

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
      this.genAI = null;
      return;
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.0-flash-exp (WORKING model as of Oct 2025)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Check if Gemini is configured
   */
  isConfigured() {
    return this.genAI !== null;
  }

  /**
   * Enhance official profile data using Gemini with Google Search
   * @param {Object} officialData - Basic data from MyNeta
   */
  async enhanceOfficialProfile(officialData) {
    if (!this.isConfigured()) {
      console.log('⚠️  Gemini not configured, skipping enhancement');
      return officialData;
    }

    try {
      console.log(`🤖 Enhancing profile for ${officialData.name} with Gemini AI (with web search)...`);

      const prompt = `
Search the web for ${officialData.name} from ${officialData.constituency || 'Karnataka'} and verify their profile data.

Current data from MyNeta.info:
- Name: ${officialData.name}
- Constituency: ${officialData.constituency || 'Unknown'}
- Party: ${officialData.party || 'Unknown'}
- Education: ${officialData.education || 'Unknown'}
- Assets: ${officialData.assets || 'Unknown'}
- Liabilities: ${officialData.liabilities || 'Unknown'}
- Criminal Cases: ${officialData.criminalCases || 'Unknown'}

SEARCH MyNeta.info and other sources to:
1. Verify the criminal cases count (exact number from latest affidavit - don't say "none" if cases exist)
2. Verify assets and liabilities (exact amounts from latest 2023/2024 affidavit)
3. Get current political position (MLA/Minister/CM/Deputy CM with ministries)
4. Assess dynasty status: "Self-Made", "Second Generation", "Third Generation", or "Political Family"
5. Provide a brief background (50 words max)
6. Suggest 3-5 key focus areas

Respond ONLY in valid JSON format:
{
  "education": "verified education",
  "assets": "verified assets from affidavit",
  "liabilities": "verified liabilities", 
  "criminalCases": "exact number from affidavit",
  "currentPosition": "position with ministries if applicable",
  "dynastyStatus": "status",
  "background": "brief background",
  "focusAreas": ["area1", "area2", "area3"],
  "dataQuality": "high/medium/low",
  "sources": "mention MyNeta.info or other sources used"
}`;

      // Use Google Search grounding
      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
      };

      const result = await this.model.generateContent(request);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enhanced = JSON.parse(jsonMatch[0]);
        console.log(`✅ Gemini enhanced data for ${officialData.name}`);
        
        return {
          ...officialData,
          ...enhanced,
          geminiEnhanced: true,
          enhancedAt: new Date().toISOString()
        };
      }

      console.log('⚠️  Could not parse Gemini response');
      return officialData;
    } catch (error) {
      console.error(`❌ Gemini enhancement error:`, error.message);
      return officialData;
    }
  }

  /**
   * Generate promises/agenda based on official's profile with web search
   */
  async generateLikelyPromises(officialData) {
    if (!this.isConfigured()) {
      return this.getMockPromises(officialData.constituency);
    }

    try {
      console.log(`🎯 Generating likely promises for ${officialData.name}...`);

      const prompt = `
Search the web for ${officialData.name}'s election campaign promises and current initiatives.

Official Profile:
- Name: ${officialData.name}
- Constituency: ${officialData.constituency}
- Party: ${officialData.party}
- Position: ${officialData.currentPosition || 'MLA'}

SEARCH for:
1. Their actual election manifesto and campaign promises
2. Current government schemes they're implementing
3. Constituency-specific development projects
4. News about promise fulfillment

Generate 15 realistic promises based on what you find. Include:
- Mix of infrastructure, education, healthcare, employment, public safety, environment
- Real promises they made (if found) + likely promises based on their constituency
- Realistic status: completed, in-progress, or broken

Respond in JSON:
{
  "promises": [
    {
      "title": "promise text (10-15 words)",
      "category": "category",
      "status": "completed/in-progress/broken",
      "progress": 0-100,
      "priority": "high/medium/low"
    }
  ]
}`;

      // Use Google Search grounding
      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
      };

      const result = await this.model.generateContent(request);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        console.log(`✅ Generated ${data.promises.length} promises`);
        return data.promises;
      }

      return this.getMockPromises(officialData.constituency);
    } catch (error) {
      console.error('❌ Gemini promise generation error:', error.message);
      return this.getMockPromises(officialData.constituency);
    }
  }

  /**
   * Aggregate data from multiple sources with web verification
   */
  async aggregateMultipleSources(sources) {
    if (!this.isConfigured()) {
      return sources[0]; // Return first source as-is
    }

    try {
      console.log(`🔄 Aggregating data from ${sources.length} sources with web verification...`);

      const officialName = sources[0]?.data?.name || 'Unknown';

      const prompt = `
Search MyNeta.info to verify the correct data for ${officialName}.

Multiple sources provide conflicting data:
${sources.map((s, i) => `Source ${i + 1} (${s.source}): ${JSON.stringify(s.data)}`).join('\n')}

Tasks:
1. SEARCH MyNeta.info for the official's latest election affidavit
2. Identify conflicts in: education, assets, liabilities, criminal cases, age
3. Choose most reliable value (prioritize: MyNeta verified data > Official Govt > News > Other)
4. For criminal cases, use EXACT number from affidavit (don't say "none" if cases exist)
5. Flag confidence level for each field

Respond in JSON:
{
  "consolidated": {
    "education": "value",
    "assets": "value",
    "liabilities": "value",
    "criminalCases": "value",
    "age": "value"
  },
  "confidence": {
    "education": "high/medium/low",
    "assets": "high/medium/low",
    "liabilities": "high/medium/low",
    "criminalCases": "high/medium/low",
    "age": "high/medium/low"
  },
  "conflicts": ["field names with conflicts"],
  "verifiedBy": "MyNeta.info or source used"
}`;

      // Use Google Search grounding
      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
      };

      const result = await this.model.generateContent(request);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aggregated = JSON.parse(jsonMatch[0]);
        console.log(`✅ Data aggregated with conflicts: ${aggregated.conflicts.join(', ')}`);
        return aggregated;
      }

      return sources[0].data;
    } catch (error) {
      console.error('❌ Gemini aggregation error:', error.message);
      return sources[0].data;
    }
  }

  /**
   * Fallback mock promises if Gemini fails
   */
  getMockPromises(constituency) {
    const templates = [
      { title: `Improve road infrastructure in ${constituency}`, category: 'Infrastructure', status: 'in-progress', progress: 60 },
      { title: `Build 5 new government schools`, category: 'Education', status: 'completed', progress: 100 },
      { title: `Install CCTV cameras for public safety`, category: 'Public Safety', status: 'in-progress', progress: 40 },
      { title: `24/7 water supply to all households`, category: 'Infrastructure', status: 'broken', progress: 20 },
      { title: `Create 1000 job opportunities`, category: 'Employment', status: 'in-progress', progress: 35 },
      { title: `Upgrade primary health centers`, category: 'Healthcare', status: 'completed', progress: 100 },
      { title: `Fix drainage and sewage issues`, category: 'Infrastructure', status: 'in-progress', progress: 55 },
      { title: `Set up waste management system`, category: 'Environment', status: 'in-progress', progress: 30 },
      { title: `Build community parks and playgrounds`, category: 'Infrastructure', status: 'completed', progress: 100 },
      { title: `Improve street lighting`, category: 'Public Safety', status: 'completed', progress: 100 },
      { title: `Establish skill development centers`, category: 'Employment', status: 'in-progress', progress: 45 },
      { title: `Reduce power cuts by 50%`, category: 'Infrastructure', status: 'broken', progress: 15 },
      { title: `Free bus passes for students`, category: 'Education', status: 'in-progress', progress: 70 },
      { title: `Organize health camps monthly`, category: 'Healthcare', status: 'completed', progress: 100 },
      { title: `Plant 10,000 trees`, category: 'Environment', status: 'in-progress', progress: 50 }
    ];

    return templates;
  }
}

module.exports = new GeminiService();
