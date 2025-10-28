require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * OpenAI Profile Service - Fetches politician data in scorecard format with URLs
 */
class OpenAIProfileService {
  
  /**
   * Generate standard prompt for politician data using the CSV template
   */
  generateStandardPrompt(politicianName, state = '') {
    // Read the CSV template directly
    const templatePath = path.join(__dirname, '../config/politician-scorecard-template.csv');
    const csvTemplate = fs.readFileSync(templatePath, 'utf8');
    
    return `
Create a comprehensive politician scorecard for ${politicianName}${state ? ` from ${state}` : ''}.

CRITICAL: Use 2024 or 2025 data ONLY. This is October 2025, so data should be current.

Return data in this EXACT CSV structure with EXACT field names:

${csvTemplate}

EXACT REQUIREMENTS:
1. Use EXACT field names as shown in the template
2. Section headers have empty Detail/Score (marked with ,,)
3. Use 2024/2025 data - mention "2024 affidavit" or "2024 elections" explicitly
4. Assets in ₹ Crore format with tilde: ~₹XXX crore
5. Provide COMPLETE, working URLs (MUST start with https:// or http://):
   - Wikipedia: https://en.wikipedia.org/wiki/[Name] (preferred for basic info)
   - MyNeta: ONLY if you know the REAL candidate_id from myneta.info
     * Format: https://myneta.info/[state]2024/candidate.php?candidate_id=[REAL_ID]
     * DO NOT use fake IDs like "1234" or "xxxxx"
     * If unknown, use news article or Wikipedia instead
   - News: FULL article URLs from credible sources (MUST include https://)
   - NEVER use partial URLs like "//www.example.com" - ALWAYS include protocol
   - NEVER use placeholder IDs - use real data or different source
6. Return ONLY the CSV table. NO explanations. NO markdown code blocks.

For ${politicianName}, provide data as recent as your training allows (preferably 2024-2025).
`;
  }

  /**
   * Fetch politician profile using OpenAI
   */
  async fetchProfile(politicianName, state = '') {
    try {
      const prompt = this.generateStandardPrompt(politicianName, state);
      
      console.log(`🔍 Fetching profile for ${politicianName} using OpenAI...`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Using GPT-4o for better structured output
        messages: [
          {
            role: "system",
            content: "You are a political data researcher who provides accurate, structured information about politicians with proper source citations. Always provide data in the exact format requested with actual URLs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      });

      const csvData = response.choices[0].message.content;
      
      // Remove markdown code blocks if present
      const cleanedCSV = csvData
        .replace(/```csv\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log(`✅ Profile fetched successfully`);
      console.log(`📊 Tokens used: ${response.usage.total_tokens}`);
      
      // Parse CSV to structured JSON
      const structuredData = this.parseCSVToStructuredData(cleanedCSV);
      
      return structuredData;

    } catch (error) {
      console.error('❌ Error fetching profile from OpenAI:', error.message);
      throw error;
    }
  }

  /**
   * Fix incomplete or malformed URLs
   */
  fixUrl(url) {
    if (!url || url === '#' || url === '') return '#';
    
    // If URL starts with //, add https:
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    
    // If URL doesn't start with http:// or https://, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    
    return url;
  }

  /**
   * Parse CSV data to structured JSON object matching exact scorecard format
   */
  parseCSVToStructuredData(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim());
    const profileData = {
      currentOfficeParty: {},
      education: {},
      ministerialPortfolios: {},
      assetsFinancials: {},
      criminalCases: {},
      politicalBackground: {},
      electoralPerformance: {},
      currentActivity: {},
      legalProbes: {},
      personalBackground: {}
    };

    lines.forEach((line, index) => {
      if (index === 0) return; // Skip header row
      
      // Handle CSV with quoted values
      const parts = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      
      if (parts.length < 2) return;
      
      const category = parts[0].replace(/^"/, '').replace(/"$/, '').trim();
      const detail = parts[1]?.replace(/^"/, '').replace(/"$/, '').trim() || '';
      const sourceUrl = this.fixUrl(parts[2]?.replace(/^"/, '').replace(/"$/, '').trim() || '');

      // Skip section headers (empty detail)
      if (!detail || detail === '') return;

      // Map exact field names to structure
      switch(category) {
        case 'Position':
          profileData.currentOfficeParty.position = { value: detail, sourceUrl };
          break;
        case 'Party & Role':
          profileData.currentOfficeParty.party = { value: detail, sourceUrl };
          break;
        case 'Constituency':
          profileData.currentOfficeParty.constituency = { value: detail, sourceUrl };
          break;
        case 'Educational Status':
          profileData.education = { value: detail, sourceUrl };
          break;
        case 'Ministerial / Portfolios':
          profileData.ministerialPortfolios = { value: detail, sourceUrl };
          break;
        case 'Total Assets':
          profileData.assetsFinancials.totalAssets = { value: detail, sourceUrl };
          break;
        case 'Source of Wealth':
          profileData.assetsFinancials.sourceOfWealth = { value: detail, sourceUrl };
          break;
        case 'Liabilities':
          profileData.assetsFinancials.liabilities = { value: detail, sourceUrl };
          break;
        case 'Criminal Cases Declared':
          profileData.criminalCases.totalCases = { value: detail, sourceUrl };
          break;
        case 'Serious IPC Cases':
          profileData.criminalCases.seriousCharges = { value: detail, sourceUrl };
          break;
        case 'Dynasty / Family Links':
          profileData.politicalBackground.dynastyStatus = { value: detail, sourceUrl };
          break;
        case 'Career Highlight':
          profileData.politicalBackground.careerHighlight = { value: detail, sourceUrl };
          break;
        case 'Recent Elections (2024)':
        case 'Recent Elections (2025)':
          profileData.electoralPerformance.recentElections = { value: detail, sourceUrl };
          break;
        case 'Key Achievements & Initiatives':
          profileData.currentActivity.keyAchievements = { value: detail, sourceUrl };
          break;
        case 'Policy Focus':
          profileData.currentActivity.policyFocus = { value: detail, sourceUrl };
          break;
        case 'Recent Legal Developments':
          profileData.legalProbes.recentDevelopments = { value: detail, sourceUrl };
          break;
        case 'Real Name':
          profileData.personalBackground.realName = { value: detail, sourceUrl };
          break;
        case 'Family & Personal Notes':
          profileData.personalBackground.familyNotes = { value: detail, sourceUrl };
          break;
        case 'Philanthropy / NGOs':
          profileData.personalBackground.philanthropy = { value: detail, sourceUrl };
          break;
      }
    });

    return profileData;
  }
}

module.exports = new OpenAIProfileService();
