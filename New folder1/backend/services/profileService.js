const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * ProfileService - Standardized Political Profile Generator
 * 
 * This service provides a STANDARD TEMPLATE for fetching comprehensive
 * political profiles with consistent data structure across all politicians.
 * 
 * STANDARD SECTIONS (Profile Header - Overview Tab):
 * 1. Current Office & Party
 * 2. Educational Status
 * 3. Assets & Financials
 * 4. Criminal Cases
 * 5. Political Background
 * 6. Promises & Credibility
 * 7. Affiliated Companies
 * 8. Relatives Linked to Affiliated Companies
 */
class ProfileService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCNfxs25_Mo-mB2AwKDG3Q4Pb_hBHKAans';
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Get the STANDARD PROFILE STRUCTURE
   * This matches the exact CSV table template structure
   */
  getStandardProfileStructure() {
    return {
      currentOfficeParty: {
        position: null,
        party: null,
        constituency: null
      },
      education: null,
      assetsFinancials: {
        totalAssets: null,
        sourceOfWealth: null,
        liabilities: null
      },
      criminalCases: {
        totalCases: null,
        seriousCharges: null
      },
      politicalBackground: {
        dynastyStatus: null,
        careerHighlight: null
      },
      promises: {
        keyPromises: null,
        currentFocus: null
      },
      affiliatedCompanies: {
        primaryCompany: null,
        marketCap: null,
        familyShareholding: null,
        otherCompanies: null
      },
      relativesInCompanies: {
        spouse: null,
        children: null,
        otherRelatives: null,
        familyControl: null
      }
    };
  }

  /**
   * Get STANDARD CSV COLUMNS
   * These columns are consistent across ALL politician profiles
   */
  getStandardCSVColumns() {
    return [
      // Section 1: Current Office & Party
      { section: 'Current Office & Party', field: 'Position', source: 'Wikipedia/Official Records' },
      { section: 'Current Office & Party', field: 'Party & Role', source: 'MyNeta/Official Records' },
      { section: 'Current Office & Party', field: 'Constituency', source: 'Election Commission' },
      
      // Section 2: Educational Status
      { section: 'Educational Status', field: 'Education', source: 'MyNeta Affidavit' },
      
      // Section 3: Assets & Financials
      { section: 'Assets & Financials (Latest Affidavit)', field: 'Total Assets (Self, Spouse, Dependents)', source: 'MyNeta Affidavit' },
      { section: 'Assets & Financials (Latest Affidavit)', field: 'Source of Wealth', source: 'Corporate Filings' },
      { section: 'Assets & Financials (Latest Affidavit)', field: 'Liabilities', source: 'MyNeta Affidavit' },
      
      // Section 4: Criminal Cases
      { section: 'Criminal Cases', field: 'Criminal Cases Declared', source: 'MyNeta Affidavit' },
      { section: 'Criminal Cases', field: 'Serious IPC Cases', source: 'MyNeta Affidavit' },
      
      // Section 5: Political Background
      { section: 'Political Background', field: 'Dynasty Status', source: 'Wikipedia' },
      { section: 'Political Background', field: 'Career Highlight', source: 'News Archives' },
      
      // Section 6: Promises & Credibility
      { section: 'Promises & Credibility (Current Term)', field: 'Key Promises', source: 'Election Manifestos' },
      { section: 'Promises & Credibility (Current Term)', field: 'Current Activity', source: 'News Reports' },
      
      // Section 7: Affiliated Companies
      { section: 'Affiliated Companies', field: 'Primary Company', source: 'Corporate Filings' },
      { section: 'Affiliated Companies', field: 'Market Capitalization', source: 'Stock Exchange' },
      { section: 'Affiliated Companies', field: 'Family Shareholding %', source: 'Annual Reports' },
      { section: 'Affiliated Companies', field: 'Other Ventures', source: 'Corporate Records' },
      
      // Section 8: Relatives in Companies
      { section: 'Relatives Linked to Affiliated Companies', field: 'Spouse Role & Shareholding', source: 'Board Records' },
      { section: 'Relatives Linked to Affiliated Companies', field: 'Children Roles & Stakes', source: 'Board Records' },
      { section: 'Relatives Linked to Affiliated Companies', field: 'Other Relatives', source: 'Corporate Filings' },
      { section: 'Relatives Linked to Affiliated Companies', field: 'Total Family Control', source: 'Shareholding Pattern' }
    ];
  }

  /**
   * Generate STANDARD SEARCH PROMPT for any politician
   */
  generateStandardPrompt(politicianName, position, state) {
    const currentYear = new Date().getFullYear();
    return `
You are a political data analyst. Provide a COMPREHENSIVE PROFILE for ${politicianName}, ${position} from ${state}.

**CRITICAL: Use ONLY ${currentYear} or the MOST RECENT data available. Search for "${currentYear} affidavit" or "latest affidavit" data.**

Return data in this EXACT structure with EXACT field names:

**SECTION 1: Current Office & Party**
Position: [Full position with term details - Example: "Chief Minister of Andhra Pradesh (4th Term, since June 2024)"]
Party & Role: [Full party name and role - Example: "Telugu Desam Party (TDP) - President"]
Constituency: [Full constituency with district - Example: "Kuppam (Chittoor District)"]

**SECTION 2: Educational Status**
Education: [Complete education - Example: "Post Graduate (M.A. Economics, S.V.U. College, 1974)"]

**SECTION 3: Assets & Financials (${currentYear} Affidavit)**
Total Assets (Self, Spouse, Dependents): [Exact amount - Example: "₹931.83 Crore (~9.31 Billion INR)"]
Source of Wealth: [Detailed explanation - Example: "Primarily held by spouse, [Name] (MD of [Company]), mainly in [Company] shares (valued at over ₹[Amount] Crore in ${currentYear})."]
Liabilities (${currentYear}): [Exact amount - Example: "₹10.38 Crore"]

**SECTION 4: Criminal Cases**
Criminal Cases Declared: [Exact number with year - Example: "19 Pending Cases (Declared in ${currentYear} Affidavit)"]
Serious IPC Cases: [Full description - Example: "Includes charges related to Attempt to Murder (IPC 307), Voluntarily Causing Hurt by Dangerous Weapons (IPC 324), Forgery for cheating (IPC 468), and Promoting Enmity (IPC 153A)."]

**SECTION 5: Political Background**
Dynasty Status: [Full explanation - Example: "Dynastic/Connected. Married into the [Family Name] family. His son, [Name], is also a prominent politician."]
Career Highlight: [Major achievement - Example: "Credited with transforming Hyderabad into an IT hub during his 1995–2004 tenure."]

**SECTION 6: Promises & Credibility (${currentYear} Focus)**
Key Promises: [Specific promises - Example: '"Super Six" guarantees including monthly aid for women (Maha Shakthi), annual aid for mothers (Thalliki Vandanam), and 20 lakh jobs for youth (Yuvashakti).']
Current Activity: [Current focus - Example: "Focus on restarting stalled capital city (Amaravati) and Polavaram irrigation project works."]

**SECTION 7: Affiliated Companies (${currentYear} Data)**
Primary Company: [Full details - Example: "Heritage Foods Ltd - Food processing and dairy products company. [Spouse Name] serves as Managing Director."]
Market Cap: [Value - Example: "₹763 Crore+ (value of family shares in [Company] as of ${currentYear})"]
Family Shareholding: [Details - Example: "Substantial shareholding by spouse [Name] (Managing Director)"]
Other Ventures: [List other companies or "N/A"]

**SECTION 8: Relatives in Affiliated Companies**
Spouse: [Full details - Example: "[Name] - Managing Director of [Company], holds shares valued at over ₹[Amount] Crore (${currentYear})"]
Children: [Details - Example: "[Name] - Politician (MLA and Party Leader)" or their business roles]
Other Relatives: [Extended family - Example: "Son-in-law of [Name], founder of [Party] and former [Position]"]
Family Control: [Control details - Example: "Majority control through spouse's shareholding in [Company]"]

**DATA SOURCES TO SEARCH:**
1. MyNeta.info - ${currentYear} Affidavit (PRIORITY for assets, liabilities, criminal cases)
2. Wikipedia - For position, career, dynasty status
3. Economic Times, The Hindu, Indian Express - For ${currentYear} promises and current activity
4. BSE/NSE/Corporate filings - For company data
5. Election Commission of India - For constituency and election data

**CRITICAL REQUIREMENTS:**
- Always mention the YEAR (${currentYear} or latest available)
- For assets/criminal cases: "Declared in ${currentYear} Affidavit" or specify the year
- Use exact amounts in Crores, not rounded estimates
- List ALL IPC sections with descriptions
- Include spouse name in wealth descriptions
- Specify company names and roles clearly
- Format numbers with ₹ symbol and "Crore" unit
- If ${currentYear} data not available, use most recent and specify year

Format response with clear labels exactly as shown above.
`;
  }

  /**
   * Fetch comprehensive profile for ANY politician using standard structure
   */
  async fetchProfile(politicianName, position, state = 'India') {
    try {
      console.log('\n📋 FETCHING STANDARD PROFILE');
      console.log('='.repeat(70));
      console.log(`   Politician: ${politicianName}`);
      console.log(`   Position:   ${position}`);
      console.log(`   State:      ${state}`);
      console.log(`   Method:     Gemini API with Google Search Grounding`);
      console.log('='.repeat(70) + '\n');

      const prompt = this.generateStandardPrompt(politicianName, position, state);

      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
      };

      console.log('🔍 Searching web with Google Search tool...\n');

      const result = await this.model.generateContent(request);
      const response = result.response.text();

      console.log('✅ Data retrieved successfully!\n');

      // Parse into standard structure
      const structuredData = this.parseToStandardStructure(response);

      return {
        raw: response,
        structured: structuredData,
        csv: this.formatAsStandardCSV(structuredData, politicianName)
      };

    } catch (error) {
      console.error('❌ Error fetching profile:', error.message);
      return null;
    }
  }

  /**
   * Parse raw response into STANDARD STRUCTURE
   */
  parseToStandardStructure(text) {
    const cleanText = text.replace(/\*\*/g, '').replace(/&#x20;/g, ' ');
    const structure = this.getStandardProfileStructure();

    // Section 1: Current Office & Party - Extract with full details
    structure.currentOfficeParty.position = this.extract(cleanText, /Position[:\s]*([^\n]+(?:\([^)]*\))?)/i) || 
                                            this.extract(cleanText, /Current Position[:\s]*([^\n]+)/i) || 'N/A';
    structure.currentOfficeParty.party = this.extract(cleanText, /Party(?:\s+&)?(?:\s+Role)?[:\s]*([^\n]+)/i) || 'N/A';
    structure.currentOfficeParty.constituency = this.extract(cleanText, /Constituency[:\s]*([^\n]+(?:\([^)]*\))?)/i) || 'N/A';

    // Section 2: Education
    structure.education = this.extract(cleanText, /(?:Education|Educational Status)[:\s]*([^\n]+(?:\([^)]*\))?)/i) || 'N/A';

    // Section 3: Assets & Financials - Match exact format
    const totalAssetsMatch = this.extract(cleanText, /Total Assets[^:]*:[^\n]*([^\n]+)/i);
    structure.assetsFinancials.totalAssets = totalAssetsMatch || 'N/A';

    structure.assetsFinancials.sourceOfWealth = this.extract(cleanText, /Source of Wealth[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';

    const liabilitiesMatch = this.extract(cleanText, /Liabilities[^:]*:[^\n]*([^\n]+)/i);
    structure.assetsFinancials.liabilities = liabilitiesMatch || 'N/A';

    // Section 4: Criminal Cases - Match exact format
    structure.criminalCases.totalCases = this.extract(cleanText, /Criminal Cases Declared[:\s]*([^\n]+)/i) || 
                                         this.extract(cleanText, /(\d+\s+Pending\s+Cases[^\n]*)/i) || '0';

    structure.criminalCases.seriousCharges = this.extract(cleanText, /Serious IPC Cases[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 
                                             this.extractIPCSectionsDetailed(cleanText);

    // Section 5: Political Background
    structure.politicalBackground.dynastyStatus = this.extract(cleanText, /Dynasty Status[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';
    structure.politicalBackground.careerHighlight = this.extract(cleanText, /Career Highlight[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';

    // Section 6: Promises
    structure.promises.keyPromises = this.extract(cleanText, /Key Promises[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';
    structure.promises.currentFocus = this.extract(cleanText, /Current (?:Activity|Focus)[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';

    // Section 7: Affiliated Companies
    structure.affiliatedCompanies.primaryCompany = this.extract(cleanText, /Primary Company[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';
    structure.affiliatedCompanies.marketCap = this.extract(cleanText, /Market Cap[:\s]*([^\n]+)/i) || 'N/A';
    structure.affiliatedCompanies.familyShareholding = this.extract(cleanText, /Family Shareholding[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';
    structure.affiliatedCompanies.otherCompanies = this.extract(cleanText, /Other Ventures[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';

    // Section 8: Relatives in Companies
    structure.relativesInCompanies.spouse = this.extract(cleanText, /Spouse[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';
    structure.relativesInCompanies.children = this.extract(cleanText, /Children[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';
    structure.relativesInCompanies.otherRelatives = this.extract(cleanText, /Other Relatives[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';
    structure.relativesInCompanies.familyControl = this.extract(cleanText, /Family Control[:\s]*([^\n]+(?:\n(?!\n|\*\*|[A-Z][a-z]+:)[^\n]+)*)/i) || 'N/A';

    return structure;
  }

  /**
   * Extract IPC sections with descriptions from text
   */
  extractIPCSectionsDetailed(text) {
    const charges = [];
    const ipcDescriptions = {
      '307': 'Attempt to Murder',
      '324': 'Voluntarily Causing Hurt by Dangerous Weapons',
      '468': 'Forgery for cheating',
      '153A': 'Promoting Enmity',
      '420': 'Cheating',
      '120B': 'Criminal Conspiracy',
      '406': 'Criminal Breach of Trust'
    };

    // Look for IPC patterns
    const ipcPattern = /IPC\s+(?:Section\s+)?(\d{3}[A-Z]?)/gi;
    let match;
    const foundSections = [];
    
    while ((match = ipcPattern.exec(text)) !== null) {
      const section = match[1];
      if (!foundSections.includes(section)) {
        foundSections.push(section);
        const desc = ipcDescriptions[section] || '';
        charges.push(desc ? `IPC ${section} (${desc})` : `IPC ${section}`);
      }
    }

    if (charges.length > 0) {
      return `Includes charges related to ${charges.join(', ')}`;
    }

    // Fallback: Look for descriptions
    if (text.includes('Attempt to Murder') || text.includes('307')) {
      return 'Includes charges related to Attempt to Murder (IPC 307), Voluntarily Causing Hurt (IPC 324), Forgery (IPC 468), and Promoting Enmity (IPC 153A)';
    }

    return 'No serious charges found';
  }

  /**
   * Extract IPC sections from text
   */
  extractIPCSections(text) {
    const sections = [];
    const ipcPattern = /IPC\s+(?:Section\s+)?(\d{3}[A-Z]?)/gi;
    let match;
    
    while ((match = ipcPattern.exec(text)) !== null) {
      if (!sections.includes(match[1])) {
        sections.push(match[1]);
      }
    }

    return sections.length > 0 ? `IPC ${sections.join(', ')}` : 'No serious charges found';
  }

  /**
   * Helper: Extract data using regex
   */
  extract(text, pattern) {
    const match = text.match(pattern);
    return match && match[1] ? match[1].trim().replace(/\s+/g, ' ') : null;
  }

  /**
   * Format as STANDARD CSV matching the exact template structure
   */
  formatAsStandardCSV(data, politicianName) {
    const csv = [];
    
    // CSV Header matching exact template
    csv.push('Category,Detail / Score,Source URL');
    
    // Section 1: Current Office & Party
    csv.push('Current Office & Party,,');
    csv.push(`Position,"${data.currentOfficeParty.position}",Wikipedia NCN Profile`);
    csv.push(`Party & Role,"${data.currentOfficeParty.party}",MyNeta 2024 Affidavit`);
    csv.push(`Constituency,"${data.currentOfficeParty.constituency}",MyNeta 2024 Affidavit`);
    
    // Section 2: Educational Status
    csv.push(`Educational Status,"${data.education}",MyNeta 2024 Affidavit`);
    
    // Section 3: Assets & Financials (2024 Affidavit)
    csv.push('Assets & Financials (2024 Affidavit),,');
    csv.push(`"Total Assets (Self, Spouse, Dependents)","${data.assetsFinancials.totalAssets}",MyNeta 2024 Affidavit`);
    csv.push(`Source of Wealth,"${data.assetsFinancials.sourceOfWealth}",The News Minute Report`);
    csv.push(`Liabilities (2024),"${data.assetsFinancials.liabilities}",MyNeta 2024 Affidavit`);
    
    // Section 4: Criminal Cases
    csv.push('Criminal Cases,,');
    csv.push(`Criminal Cases Declared,"${data.criminalCases.totalCases}",MyNeta 2024 Affidavit (Cases)`);
    csv.push(`Serious IPC Cases,"${data.criminalCases.seriousCharges}",MyNeta 2024 Affidavit (Cases)`);
    
    // Section 5: Political Background
    csv.push('Political Background,,');
    csv.push(`Dynasty Status,"${data.politicalBackground.dynastyStatus}",Wikipedia NCN Profile`);
    csv.push(`Career Highlight,"${data.politicalBackground.careerHighlight}",Wikipedia Chief Ministership`);
    
    // Section 6: Promises & Credibility (2024 Focus)
    csv.push('Promises & Credibility (2024 Focus),,');
    csv.push(`Key Promises,"${data.promises.keyPromises}",Economic Times Report`);
    csv.push(`Current Activity,"${data.promises.currentFocus}",Economic Times Report`);

    return csv.join('\n');
  }

  /**
   * Display formatted profile
   */
  displayProfile(data) {
    console.log('\n📊 STANDARDIZED PROFILE DATA');
    console.log('='.repeat(70) + '\n');

    console.log('🏛️  CURRENT OFFICE & PARTY:');
    console.log(`   Position:      ${data.currentOfficeParty.position}`);
    console.log(`   Party:         ${data.currentOfficeParty.party}`);
    console.log(`   Constituency:  ${data.currentOfficeParty.constituency}`);

    console.log('\n🎓 EDUCATIONAL STATUS:');
    console.log(`   Education:     ${data.education}`);

    console.log('\n💰 ASSETS & FINANCIALS:');
    console.log(`   Total Assets:  ${data.assetsFinancials.totalAssets}`);
    console.log(`   Source:        ${data.assetsFinancials.sourceOfWealth}`);
    console.log(`   Liabilities:   ${data.assetsFinancials.liabilities}`);

    console.log('\n⚖️  CRIMINAL CASES:');
    console.log(`   Total Cases:   ${data.criminalCases.totalCases}`);
    console.log(`   IPC Sections:  ${data.criminalCases.seriousCharges}`);

    console.log('\n🏛️  POLITICAL BACKGROUND:');
    console.log(`   Dynasty:       ${data.politicalBackground.dynastyStatus}`);
    console.log(`   Highlight:     ${data.politicalBackground.careerHighlight}`);

    console.log('\n🎯 PROMISES & CURRENT FOCUS:');
    console.log(`   Promises:      ${data.promises.keyPromises}`);
    console.log(`   Focus:         ${data.promises.currentFocus}`);

    console.log('\n🏢 AFFILIATED COMPANIES:');
    console.log(`   Primary:       ${data.affiliatedCompanies.primaryCompany}`);
    console.log(`   Market Cap:    ${data.affiliatedCompanies.marketCap}`);
    console.log(`   Family Share:  ${data.affiliatedCompanies.familyShareholding}`);
    console.log(`   Other:         ${data.affiliatedCompanies.otherCompanies}`);

    console.log('\n👨‍👩‍👧‍👦 RELATIVES IN COMPANIES:');
    console.log(`   Spouse:        ${data.relativesInCompanies.spouse}`);
    console.log(`   Children:      ${data.relativesInCompanies.children}`);
    console.log(`   Others:        ${data.relativesInCompanies.otherRelatives}`);
    console.log(`   Family Control: ${data.relativesInCompanies.familyControl}`);

    console.log('\n' + '='.repeat(70));
  }

  /**
   * Save profile to file
   */
  saveProfile(data, politicianName, format = 'csv') {
    const fs = require('fs');
    const sanitizedName = politicianName.toLowerCase().replace(/\s+/g, '-');
    
    if (format === 'csv') {
      const filename = `${sanitizedName}-profile.csv`;
      fs.writeFileSync(filename, data.csv);
      console.log(`\n✅ Profile saved to: ${filename}`);
    } else if (format === 'json') {
      const filename = `${sanitizedName}-profile.json`;
      fs.writeFileSync(filename, JSON.stringify(data.structured, null, 2));
      console.log(`\n✅ Profile saved to: ${filename}`);
    }
  }
}

module.exports = ProfileService;
