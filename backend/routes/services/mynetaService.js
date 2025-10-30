const axios = require('axios');
const cheerio = require('cheerio');

/**
 * MyNeta.info Data Aggregation Service
 * Scrapes official data from MyNeta.info (Association for Democratic Reforms)
 */

class MyNetaService {
  constructor() {
    this.baseUrl = 'https://myneta.info';
    this.bangaloreStateCode = 'karnataka2023';
  }

  /**
   * Search for an official on MyNeta
   * @param {string} name - Official's name
   * @param {string} constituency - Constituency name
   */
  async searchOfficial(name, constituency) {
    try {
      console.log(`🔍 Searching MyNeta for: ${name} (${constituency})`);
      
      // MyNeta URLs follow pattern: /karnataka2023/candidate.php?candidate_id=xxx
      // We'll search and scrape the list page
      const searchUrl = `${this.baseUrl}/${this.bangaloreStateCode}/index.php`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Find candidate link matching name (case-insensitive)
      let candidateUrl = null;
      $('a').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.toLowerCase().includes(name.toLowerCase())) {
          const href = $(elem).attr('href');
          if (href && href.includes('candidate.php')) {
            candidateUrl = href.startsWith('http') ? href : `${this.baseUrl}/${this.bangaloreStateCode}/${href}`;
            return false; // break loop
          }
        }
      });

      if (!candidateUrl) {
        console.log(`⚠️  No MyNeta profile found for ${name}`);
        return null;
      }

      return await this.scrapeOfficialProfile(candidateUrl, name);
    } catch (error) {
      console.error(`❌ Error searching MyNeta for ${name}:`, error.message);
      return null;
    }
  }

  /**
   * Scrape detailed profile from MyNeta candidate page
   */
  async scrapeOfficialProfile(url, name) {
    try {
      console.log(`📄 Scraping profile: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract data from MyNeta page structure
      const profile = {
        name: name,
        sourceUrl: url,
        education: this.extractField($, 'education', ['education', 'qualification']),
        age: this.extractField($, 'age', ['age', 'dob', 'date of birth']),
        assets: this.extractField($, 'assets', ['assets', 'total assets']),
        liabilities: this.extractField($, 'liabilities', ['liabilities', 'total liabilities']),
        criminalCases: this.extractField($, 'criminal', ['criminal cases', 'criminal', 'cases']),
        party: this.extractField($, 'party', ['party', 'political party']),
        constituency: this.extractField($, 'constituency', ['constituency', 'assembly']),
        verifiedAt: new Date().toISOString()
      };

      console.log(`✅ MyNeta data extracted for ${name}`);
      return profile;
    } catch (error) {
      console.error(`❌ Error scraping profile:`, error.message);
      return null;
    }
  }

  /**
   * Extract field from HTML using multiple possible labels
   */
  extractField($, fieldType, possibleLabels) {
    let value = 'N/A';

    // Try to find field in tables
    $('table tr, .table tr').each((i, row) => {
      const $row = $(row);
      const header = $row.find('td:first-child, th:first-child').text().toLowerCase().trim();
      
      for (const label of possibleLabels) {
        if (header.includes(label)) {
          const valueCell = $row.find('td:last-child').text().trim();
          if (valueCell && valueCell !== header) {
            value = valueCell;
            return false; // break
          }
        }
      }
    });

    // Try finding in divs with labels
    if (value === 'N/A') {
      $('div, p, span').each((i, elem) => {
        const text = $(elem).text().toLowerCase();
        for (const label of possibleLabels) {
          if (text.includes(label + ':') || text.includes(label + ' -')) {
            const match = text.match(new RegExp(label + '[:\\s-]+([^\\n]+)', 'i'));
            if (match && match[1]) {
              value = match[1].trim();
              return false;
            }
          }
        }
      });
    }

    return this.cleanValue(value, fieldType);
  }

  /**
   * Clean and format extracted values
   */
  cleanValue(value, fieldType) {
    if (!value || value === 'N/A') return 'N/A';

    value = value.replace(/\s+/g, ' ').trim();

    // Format specific fields
    if (fieldType === 'assets' || fieldType === 'liabilities') {
      // Convert to Indian Rupee format
      const match = value.match(/(\d+[\d,]*)/);
      if (match) {
        const amount = parseInt(match[1].replace(/,/g, ''));
        if (amount >= 10000000) {
          return `₹${(amount / 10000000).toFixed(1)} Crores`;
        } else if (amount >= 100000) {
          return `₹${(amount / 100000).toFixed(1)} Lakhs`;
        }
      }
    }

    if (fieldType === 'age') {
      const match = value.match(/(\d+)/);
      if (match) {
        return `${match[1]} years`;
      }
    }

    if (fieldType === 'criminal') {
      const match = value.match(/(\d+)/);
      if (match) {
        return match[1] === '0' ? '0 Cases' : `${match[1]} Cases`;
      }
    }

    return value;
  }

  /**
   * Get list of Karnataka MLAs from MyNeta
   */
  async getKarnatakaMlas() {
    try {
      console.log('📋 Fetching Karnataka MLAs list from MyNeta...');
      
      const url = `${this.baseUrl}/${this.bangaloreStateCode}/index.php`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const mlasList = [];

      // Extract MLA names and constituencies
      $('table tr').each((i, row) => {
        const $row = $(row);
        const name = $row.find('td:nth-child(2)').text().trim();
        const constituency = $row.find('td:nth-child(3)').text().trim();
        const party = $row.find('td:nth-child(4)').text().trim();
        
        if (name && constituency) {
          mlasList.push({ name, constituency, party });
        }
      });

      console.log(`✅ Found ${mlasList.length} Karnataka MLAs`);
      return mlasList;
    } catch (error) {
      console.error('❌ Error fetching MLAs list:', error.message);
      return [];
    }
  }
}

module.exports = new MyNetaService();
