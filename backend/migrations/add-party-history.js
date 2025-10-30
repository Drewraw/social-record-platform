require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addPartyHistoryColumn() {
  console.log('\n🔄 Adding party_history column to officials table...\n');

  try {
    // Add party_history column
    await pool.query(`
      ALTER TABLE officials 
      ADD COLUMN IF NOT EXISTS party_history TEXT DEFAULT 'No party switches in last 10 years'
    `);

    console.log('✅ Successfully added party_history column');
    
    // Verify column was added
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'officials' AND column_name = 'party_history'
    `);

    if (result.rows.length > 0) {
      console.log('\n📋 Column details:');
      console.log(`   Name: ${result.rows[0].column_name}`);
      console.log(`   Type: ${result.rows[0].data_type}`);
      console.log(`   Default: ${result.rows[0].column_default}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addPartyHistoryColumn();
