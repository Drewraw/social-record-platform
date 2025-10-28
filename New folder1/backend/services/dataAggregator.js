const mynetaService = require('./mynetaService');
const geminiService = require('./geminiService');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Main Data Aggregator
 * Orchestrates data collection from MyNeta, Gemini AI, and web scraping
 */

class DataAggregator {
  
  /**
   * Aggregate complete profile for an official
   * Priority: MyNeta.info > Gemini AI > Google News Scraping
   */
  async aggregateOfficialProfile(name, constituency, party) {
    console.log(`\n🔄 Aggregating profile for: ${name} (${constituency})`);
    console.log('=' .repeat(60));

    const sources = [];

    // Step 1: Get data from MyNeta
    console.log('\n1️⃣  Fetching from MyNeta.info...');
    const mynetaData = await mynetaService.searchOfficial(name, constituency);
    if (mynetaData) {
      sources.push({
        source: 'MyNeta',
        priority: 1,
        data: mynetaData
      });
    }

    // Step 2: Enhance with Gemini AI
    console.log('\n2️⃣  Enhancing with Gemini AI...');
    const baseData = mynetaData || { name, constituency, party };
    const geminiData = await geminiService.enhanceOfficialProfile(baseData);
    if (geminiData.geminiEnhanced) {
      sources.push({
        source: 'Gemini AI',
        priority: 2,
        data: geminiData
      });
    }

    // Step 3: Scrape Google News for recent activities
    console.log('\n3️⃣  Scraping Google News...');
    const newsData = await this.scrapeGoogleNews(name, constituency);
    if (newsData) {
      sources.push({
        source: 'Google News',
        priority: 3,
        data: newsData
      });
    }

    // Step 4: Aggregate all sources
    console.log('\n4️⃣  Aggregating data from all sources...');
    const aggregated = await this.consolidateSources(sources);

    // Step 5: Generate promises using Gemini
    console.log('\n5️⃣  Generating promises...');
    const promises = await geminiService.generateLikelyPromises(aggregated);

    console.log('\n✅ Profile aggregation complete!');
    console.log('=' .repeat(60));

    return {
      ...aggregated,
      promises,
      sources: sources.map(s => ({
        name: s.source,
        priority: s.priority,
        lastUpdated: new Date().toISOString()
      }))
    };
  }

  /**
   * Scrape Google News for recent articles about the official
   */
  async scrapeGoogleNews(name, constituency) {
    try {
      const searchQuery = encodeURIComponent(`${name} ${constituency} MLA Karnataka`);
      const url = `https://www.google.com/search?q=${searchQuery}&tbm=nws`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const articles = [];

      // Extract news headlines
      $('.SoaBEf, .n0jPhd').each((i, elem) => {
        if (i < 5) { // Get top 5 articles
          const title = $(elem).text().trim();
          if (title) {
            articles.push({
              title,
              source: 'Google News',
              date: new Date().toISOString().split('T')[0]
            });
          }
        }
      });

      if (articles.length > 0) {
        console.log(`✅ Found ${articles.length} news articles`);
        return {
          recentNews: articles,
          newsCount: articles.length
        };
      }

      console.log('⚠️  No news articles found');
      return null;
    } catch (error) {
      console.error('❌ Google News scraping error:', error.message);
      return null;
    }
  }

  /**
   * Consolidate data from multiple sources
   * Priority: MyNeta > Gemini > News
   */
  async consolidateSources(sources) {
    if (sources.length === 0) {
      return null;
    }

    if (sources.length === 1) {
      return sources[0].data;
    }

    // Use Gemini to intelligently merge if available
    if (geminiService.isConfigured()) {
      const aggregated = await geminiService.aggregateMultipleSources(sources);
      return aggregated.consolidated || aggregated;
    }

    // Manual merge: prioritize by source priority
    const sorted = sources.sort((a, b) => a.priority - b.priority);
    const consolidated = {};

    for (const source of sorted) {
      Object.keys(source.data).forEach(key => {
        if (!consolidated[key] || consolidated[key] === 'N/A' || consolidated[key] === 'Unknown') {
          consolidated[key] = source.data[key];
        }
      });
    }

    return consolidated;
  }

  /**
   * Aggregate data for multiple officials in batch
   */
  async aggregateBatch(officials) {
    console.log(`\n📦 Batch aggregating ${officials.length} officials...`);
    const results = [];

    for (const official of officials) {
      try {
        const data = await this.aggregateOfficialProfile(
          official.name,
          official.constituency,
          official.party
        );
        results.push({
          success: true,
          data
        });
        
        // Rate limiting: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Failed to aggregate ${official.name}:`, error.message);
        results.push({
          success: false,
          name: official.name,
          error: error.message
        });
      }
    }

    console.log(`\n✅ Batch complete: ${results.filter(r => r.success).length}/${officials.length} successful`);
    return results;
  }

  /**
   * Get Bangalore-specific MLAs
   */
  async getBangaloreMLAs() {
    console.log('\n🏙️  Fetching Bangalore MLAs...');
    
    // Bangalore constituencies
    const bangaloreConstituencies = [
      'BTM Layout', 'Jayanagar', 'Shantinagar', 'Shivajinagar', 'Gandhinagar',
      'Rajajinagar', 'Mahalakshmi Layout', 'Malleshwaram', 'Hebbal', 
      'Yeshwanthpur', 'Dasarahalli', 'Mahadevapura', 'Byatarayanapura',
      'KR Puram', 'Bommanahalli', 'Anekal', 'Bengaluru South', 'Chamarajpet'
    ];

    const allMLAs = await mynetaService.getKarnatakaMlas();
    
    // Filter for Bangalore constituencies
    const bangaloreMLAs = allMLAs.filter(mla => 
      bangaloreConstituencies.some(constituency => 
        mla.constituency.toLowerCase().includes(constituency.toLowerCase())
      )
    );

    console.log(`✅ Found ${bangaloreMLAs.length} Bangalore MLAs`);
    return bangaloreMLAs;
  }
}

module.exports = new DataAggregator();
