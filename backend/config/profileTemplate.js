/**
 * PROFILE HEADER - OVERVIEW TAB
 * Standard Template Configuration
 * 
 * This file defines the DEFAULT STRUCTURE for ALL politician profiles.
 * These 8 sections and their fields are MANDATORY for every profile.
 */

module.exports = {
  /**
   * PROFILE OVERVIEW TAB - STANDARD SECTIONS
   * These sections appear in every politician's Profile Header > Overview Tab
   */
  STANDARD_SECTIONS: [
    {
      id: 1,
      name: 'Current Office & Party',
      description: 'Current political position, party affiliation, and constituency',
      fields: [
        { name: 'Position', type: 'text', required: true, source: 'Official Records' },
        { name: 'Party & Role', type: 'text', required: true, source: 'Party Website' },
        { name: 'Constituency', type: 'text', required: true, source: 'Election Commission' }
      ]
    },
    {
      id: 2,
      name: 'Educational Status',
      description: 'Complete educational background from primary to highest degree',
      fields: [
        { name: 'Education', type: 'text', required: true, source: 'MyNeta Affidavit' }
      ]
    },
    {
      id: 3,
      name: 'Assets & Financials',
      description: 'Financial details from latest election affidavit',
      fields: [
        { name: 'Total Assets (Self, Spouse, Dependents)', type: 'currency', required: true, source: 'MyNeta Affidavit' },
        { name: 'Source of Wealth', type: 'text', required: true, source: 'Corporate Filings' },
        { name: 'Liabilities', type: 'currency', required: true, source: 'MyNeta Affidavit' }
      ]
    },
    {
      id: 4,
      name: 'Criminal Cases',
      description: 'Details of pending criminal cases and charges',
      fields: [
        { name: 'Criminal Cases Declared', type: 'number', required: true, source: 'MyNeta Affidavit' },
        { name: 'Serious IPC Cases', type: 'text', required: true, source: 'MyNeta Affidavit' }
      ]
    },
    {
      id: 5,
      name: 'Political Background',
      description: 'Dynasty status and career highlights',
      fields: [
        { name: 'Dynasty Status', type: 'text', required: true, source: 'Wikipedia' },
        { name: 'Career Highlight', type: 'text', required: true, source: 'News Archives' }
      ]
    },
    {
      id: 6,
      name: 'Promises & Credibility',
      description: 'Election promises and current focus areas',
      fields: [
        { name: 'Key Promises', type: 'text', required: true, source: 'Election Manifesto' },
        { name: 'Current Activity', type: 'text', required: true, source: 'News Reports' }
      ]
    },
    {
      id: 7,
      name: 'Affiliated Companies',
      description: 'Business entities linked to politician or family',
      fields: [
        { name: 'Primary Company', type: 'text', required: true, source: 'Corporate Filings' },
        { name: 'Market Capitalization', type: 'currency', required: false, source: 'Stock Exchange' },
        { name: 'Family Shareholding %', type: 'percentage', required: false, source: 'Annual Reports' },
        { name: 'Other Ventures', type: 'text', required: false, source: 'ROC Filings' }
      ]
    },
    {
      id: 8,
      name: 'Relatives Linked to Affiliated Companies',
      description: 'Family members holding positions in affiliated companies',
      fields: [
        { name: 'Spouse Role & Shareholding', type: 'text', required: false, source: 'Board Records' },
        { name: 'Children Roles & Stakes', type: 'text', required: false, source: 'Board Records' },
        { name: 'Other Relatives', type: 'text', required: false, source: 'Corporate Filings' },
        { name: 'Total Family Control', type: 'percentage', required: false, source: 'Shareholding Pattern' }
      ]
    }
  ],

  /**
   * Database schema mapping
   * Maps profile sections to database tables/columns
   */
  DATABASE_MAPPING: {
    currentOfficeParty: {
      table: 'officials',
      columns: ['position', 'party', 'constituency']
    },
    education: {
      table: 'officials',
      columns: ['education']
    },
    assetsFinancials: {
      table: 'official_assets',
      columns: ['total_assets', 'source_of_wealth', 'liabilities']
    },
    criminalCases: {
      table: 'official_cases',
      columns: ['total_cases', 'serious_charges']
    },
    politicalBackground: {
      table: 'officials',
      columns: ['dynasty_status', 'career_highlight']
    },
    promises: {
      table: 'promises',
      columns: ['key_promises', 'current_focus']
    },
    affiliatedCompanies: {
      table: 'affiliated_companies',
      columns: ['primary_company', 'market_cap', 'family_shareholding', 'other_companies']
    },
    relativesInCompanies: {
      table: 'relatives_in_companies',
      columns: ['spouse', 'children', 'other_relatives', 'family_control']
    }
  },

  /**
   * Frontend UI configuration
   * Defines how sections should be displayed in the Profile Header
   */
  UI_CONFIG: {
    profileHeader: {
      tabs: [
        {
          id: 'overview',
          name: 'Overview',
          icon: '📋',
          sections: [1, 2, 3, 4, 5, 6, 7, 8], // All 8 standard sections
          isDefault: true
        },
        {
          id: 'promises',
          name: 'Promises',
          icon: '🎯',
          sections: [6], // Only Promises & Credibility section
          isDefault: false
        },
        {
          id: 'assets',
          name: 'Assets',
          icon: '💰',
          sections: [3, 7, 8], // Assets, Companies, and Relatives
          isDefault: false
        },
        {
          id: 'cases',
          name: 'Cases',
          icon: '⚖️',
          sections: [4], // Only Criminal Cases section
          isDefault: false
        }
      ]
    }
  },

  /**
   * Validation rules
   * Ensures data consistency across all profiles
   */
  VALIDATION_RULES: {
    totalAssets: {
      pattern: /^₹[\d,]+\.?\d*\s*(Crore|Lakh|crore|lakh)$/,
      errorMessage: 'Total Assets must be in format: ₹XX.XX Crore'
    },
    criminalCases: {
      pattern: /^\d+$/,
      errorMessage: 'Criminal Cases must be a number'
    },
    shareholding: {
      pattern: /^\d+\.?\d*%$/,
      errorMessage: 'Shareholding must be in percentage format: XX.XX%'
    }
  },

  /**
   * CSV Export configuration
   * Standard CSV format for all profiles
   */
  CSV_EXPORT: {
    headers: ['Category', 'Field', 'Value', 'Source'],
    sections: [
      { name: 'Current Office & Party', order: 1 },
      { name: 'Educational Status', order: 2 },
      { name: 'Assets & Financials', order: 3 },
      { name: 'Criminal Cases', order: 4 },
      { name: 'Political Background', order: 5 },
      { name: 'Promises & Credibility', order: 6 },
      { name: 'Affiliated Companies', order: 7 },
      { name: 'Relatives Linked to Affiliated Companies', order: 8 }
    ],
    filename_pattern: '{politician-name}-profile.csv'
  },

  /**
   * API Response structure
   * Standard JSON structure for API responses
   */
  API_RESPONSE_STRUCTURE: {
    success: true,
    data: {
      politician: {
        name: 'string',
        position: 'string',
        state: 'string'
      },
      profile: {
        currentOfficeParty: {},
        education: {},
        assetsFinancials: {},
        criminalCases: {},
        politicalBackground: {},
        promises: {},
        affiliatedCompanies: {},
        relativesInCompanies: {}
      },
      metadata: {
        fetchedAt: 'timestamp',
        sources: [],
        dataQuality: 'string'
      }
    }
  }
};
