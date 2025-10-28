// Unified DB check script: runs all checks from previous check-*.js files
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOfficials() {
  // ...existing code from check-officials.js...
}

async function checkProfileData() {
  // ...existing code from check-profile-data.js...
}

async function checkPersonBeforeUpdate(name) {
  // ...existing code from check-person.js...
}

async function checkNewFields() {
  // ...existing code from check-new-fields.js...
}

async function checkImages() {
  // ...existing code from check-images.js...
}

async function checkIds() {
  // ...existing code from check-ids.js...
}

async function checkAllDynastyStatus() {
  // ...existing code from check-dynasty-status.js...
}

async function checkColumns() {
  // ...existing code from check-columns.js...
}

async function runAllChecks() {
  console.log('\n=== Unified DB Checks ===\n');
  await checkOfficials();
  await checkProfileData();
  await checkPersonBeforeUpdate(''); // You can pass a name if needed
  await checkNewFields();
  await checkImages();
  await checkIds();
  await checkAllDynastyStatus();
  await checkColumns();
  await pool.end();
  console.log('\n=== All checks complete! ===\n');
}

runAllChecks().catch(console.error);
