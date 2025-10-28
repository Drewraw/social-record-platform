/**
 * Batch Ingest MyNeta JSON Files into RAG
 * Scans myneta-scraper/*.json, parses each politician, and ingests into RAG vector DB
 */

const fs = require('fs');
const path = require('path');
const ragService = require('./services/ragService');

const DATA_DIR = path.join(__dirname, 'myneta-scraper');

async function ingestAllJsonFiles() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  let total = 0;

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      // If file is an array, loop; if object, wrap in array
      const politicians = Array.isArray(data) ? data : [data];
      for (const official of politicians) {
        // Minimal mapping: name, assets, liabilities, criminal_cases, education
        const mapped = {
          id: official.id || null,
          name: official.name || official.candidate_name || '',
          assets: official.assets || official["Assets:"] || official.total_assets || '',
          liabilities: official.liabilities || official["Grand Total of Liabilities (as per affidavit)"] || official.total_liabilities || '',
          criminal_cases: official.criminal_cases || official["Criminal Cases"] || official.criminal_cases_pending || '',
          education: official.education || official["Education"] || official.educational_qualification || '',
          party: official.party || official.party_name || '',
          constituency: official.constituency || official.constituency_name || '',
          position: official.position || official.office || '',
          image: official.image || official.profile_image || '',
        };
        console.log(`\n🧩 Ingesting: ${mapped.name}`);
        await ragService.ingestOfficialData(mapped);
        total++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  }
  console.log(`\n✅ Batch ingest complete: ${total} politicians ingested into RAG.`);
}

ingestAllJsonFiles();
