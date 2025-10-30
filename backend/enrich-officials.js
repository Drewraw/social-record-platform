/**
 * Enrichment script for politicians in the database
 * Fills missing fields (dynasty, relatives, wealth, biography, etc.) using external sources
 * Usage: node enrich-officials.js
 */

const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function enrichOfficial(official) {
  // Fetch Wikipedia summary and family info
  let wikiSummary = '';
  let familyRelations = '';
  try {
    const wikiApiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(official.name)}`;
    const wikiRes = await axios.get(wikiApiUrl);
    wikiSummary = wikiRes.data.extract || '';
    // Try to get family info from infobox (not available in summary API, so fallback to hardcoded or other sources)
    // For deep family trenches, you can extend this with Wikidata or other APIs
    if (official.name === 'Y. S. Jagan Mohan Reddy' || official.name === 'YS Jagan Mohan Reddy') {
      familyRelations = 'Y. S. Rajasekhara Reddy (father, former CM), Y. S. Vijayamma (mother), Y. S. Bharathi Reddy (spouse), Y. S. Sharmila (sister), extended YSR family';
    } else if (official.name === 'Nara Chandrababu Naidu') {
      familyRelations = 'N. T. Rama Rao (father-in-law, former CM, TDP founder), Nara Lokesh (son, politician), Nara Bhuvaneswari (spouse), Nara Brahmani (daughter-in-law), Nandamuri extended family';
    } else {
      familyRelations = official.political_relatives || '';
    }
  } catch (err) {
    console.warn(`Wikipedia fetch failed for ${official.name}:`, err.message);
    wikiSummary = official.biography || '';
    familyRelations = official.political_relatives || '';
  }

  // Example: fetch current wealth from ADR or other sources (stubbed here)
  let currentWealth = official.current_wealth || '';
  if (!currentWealth) {
    if (official.name === 'Y. S. Jagan Mohan Reddy' || official.name === 'YS Jagan Mohan Reddy') {
      currentWealth = '510 Crore INR (ADR, 2024)';
    } else if (official.name === 'Nara Chandrababu Naidu') {
      currentWealth = '932 Crore INR (ADR, Dec 2024)';
    }
  }

  // Example: dynasty status
  let dynastyStatus = official.dynasty_status || '';
  if (!dynastyStatus) {
    if (official.name === 'Y. S. Jagan Mohan Reddy' || official.name === 'YS Jagan Mohan Reddy') {
      dynastyStatus = 'YSR family';
    } else if (official.name === 'Nara Chandrababu Naidu') {
      dynastyStatus = 'Nandamuri–Nara family';
    }
  }

  // Example: current status/tenure (stubbed, can be extended)
  let currentStatus = '';
  let tenure = '';
  if (official.name === 'Y. S. Jagan Mohan Reddy' || official.name === 'YS Jagan Mohan Reddy') {
    currentStatus = 'Former Chief Minister of Andhra Pradesh (2019–2024)';
    tenure = '30 May 2019 – 8 June 2024';
  } else if (official.name === 'Nara Chandrababu Naidu') {
    currentStatus = 'Current Chief Minister of Andhra Pradesh (2024–present)';
    tenure = '9 June 2024 – present';
  }

  const enriched = {
    dynasty_status: dynastyStatus,
    political_relatives: familyRelations,
    current_wealth: currentWealth,
    biography: wikiSummary,
    tenure: tenure
  };

  // Always preview changes, including current_status and tenure
  console.log('\n--- PREVIEW: Proposed DB Update for', official.name, '---');
  Object.entries({...enriched, current_status: currentStatus}).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('---------------------------------------------\n');

  // Update DB (do not update current_status column, but update tenure if column exists)
  try {
    // Check if tenure column exists
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='officials' AND column_name='tenure'");
    const hasTenure = colRes.rows.length > 0;
    let query, params;
    if (hasTenure) {
      query = `UPDATE officials SET dynasty_status = $1, political_relatives = $2, current_wealth = $3, knowledgeful = $4, tenure = $5 WHERE id = $6`;
      params = [enriched.dynasty_status, enriched.political_relatives, enriched.current_wealth, enriched.biography, enriched.tenure, official.id];
    } else {
      query = `UPDATE officials SET dynasty_status = $1, political_relatives = $2, current_wealth = $3, knowledgeful = $4 WHERE id = $5`;
      params = [enriched.dynasty_status, enriched.political_relatives, enriched.current_wealth, enriched.biography, official.id];
    }
    await pool.query(query, params);
    console.log(`✅ Enriched: ${official.name}`);
  } catch (err) {
    console.warn(`DB update failed for ${official.name}:`, err.message);
  }
}

async function enrichAllOfficials() {
  const result = await pool.query('SELECT id, name FROM officials');
  for (const official of result.rows) {
    await enrichOfficial(official);
  }
  await pool.end();
  console.log('🎉 Enrichment complete!');
}

enrichAllOfficials().catch(console.error);
