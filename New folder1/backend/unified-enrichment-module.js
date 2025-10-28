require('dotenv').config();
const pool = require('./config/database');
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Import all functions from unified-enrichment.js
// Copy the core enrichment functions here as exports

async function scrapeMyNeta(url) {
  try {
    // Use Python scraper for better data extraction
    const pythonScript = path.join(__dirname, 'myneta-scraper', 'myneta_direct_url.py');
    const tempName = `temp_${Date.now()}`;
    const outputFile = path.join(__dirname, 'myneta-scraper', `myneta_${tempName}_0.json`);
    
    await new Promise((resolve, reject) => {
      exec(`python "${pythonScript}" "${url}" "${tempName}"`, 
        { cwd: path.join(__dirname, 'myneta-scraper'), timeout: 30000 },
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
    
    if (fs.existsSync(outputFile)) {
      const rawData = fs.readFileSync(outputFile, 'utf8');
      const data = JSON.parse(rawData);
      fs.unlinkSync(outputFile);
      return data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function searchMyNetaURL(name, position) {
  try {
    const searchTerm = `${name} ${position === 'MP' ? 'Lok Sabha 2024' : 'Karnataka 2023'}`;
    const searchUrl = `https://myneta.info/search_myneta.php?q=${encodeURIComponent(searchTerm)}`;
    
    const response = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    let candidateUrl = null;
    
    $('a[href*="candidate.php"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text();
      
      if (text.toLowerCase().includes(name.toLowerCase().split(' ')[0])) {
        candidateUrl = href.startsWith('http') ? href : `https://myneta.info/${href}`;
        return false;
      }
    });
    
    return candidateUrl;
  } catch (error) {
    return null;
  }
}

async function findMyNetaURL(name) {
  // Check existing JSON files
  const possibleFiles = [
    `myneta-scraper/myneta_${name.toLowerCase().replace(/\s+/g, '_')}_0.json`,
    `myneta_${name.toLowerCase().replace(/\s+/g, '_')}_0.json`,
    `myneta-scraper/myneta_${name.toLowerCase().replace(/[\s.]+/g, '_')}_karnataka_2023_0.json`,
    `myneta-scraper/myneta_${name.toLowerCase().replace(/[\s.]+/g, '_')}_lok_sabha_2024_0.json`
  ];
  
  for (const file of possibleFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data._source_url) {
          return data._source_url;
        }
      } catch (error) {
        // Continue to next file
      }
    }
  }
  
  return null;
}

// Export the main enrichment function that auto-scheduler can use
async function enrichOfficialFromScheduler(official) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 ENRICHING: ${official.name} (ID: ${official.id})`);
    console.log('='.repeat(80));
    
    // Step 1: Find MyNeta URL
    let mynetaUrl = await findMyNetaURL(official.name);
    
    if (!mynetaUrl) {
      mynetaUrl = await searchMyNetaURL(official.name, official.position);
    }
    
    if (!mynetaUrl) {
      console.log(`   ⚠️  No MyNeta URL found for ${official.name}`);
      console.log(`   💡  Manual enrichment required`);
      return false;
    }
    
    console.log(`   ✅ Found MyNeta URL: ${mynetaUrl}`);
    
    // Step 2: Call the main unified-enrichment script
    return new Promise((resolve) => {
      exec(
        `node unified-enrichment.js "${official.name}" "${mynetaUrl}"`,
        { cwd: __dirname, timeout: 120000 },
        (error, stdout, stderr) => {
          if (error) {
            console.error(`   ❌ Enrichment failed: ${error.message}`);
            resolve(false);
          } else {
            console.log(`   ✅ Enrichment completed successfully`);
            resolve(true);
          }
        }
      );
    });
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

module.exports = {
  enrichOfficialFromScheduler,
  scrapeMyNeta,
  searchMyNetaURL,
  findMyNetaURL
};
