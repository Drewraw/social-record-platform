const {Pool} = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}
});

(async () => {
  try {
    console.log('🔄 Running new migrations...\n');
    
    // Migration 1: Add political_relatives column
    console.log('1️⃣ Adding political_relatives column to officials...');
    const sql1 = fs.readFileSync('migrations/add-political-relatives.sql', 'utf8');
    await pool.query(sql1);
    console.log('   ✅ Done\n');
    
    // Migration 2: Update donations table for party donations
    console.log('2️⃣ Updating donations table for party tracking...');
    const sql2 = fs.readFileSync('migrations/update-donations-for-party.sql', 'utf8');
    await pool.query(sql2);
    console.log('   ✅ Done\n');
    
    // Verify columns
    console.log('📋 Verifying new columns:\n');
    
    const officials = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='officials' AND column_name='political_relatives'
    `);
    console.log('   Officials table:');
    officials.rows.forEach(col => {
      console.log(`   • ${col.column_name} (${col.data_type})`);
    });
    
    const donations = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='political_donations' 
      AND column_name IN ('donation_recipient_type', 'party_name')
      ORDER BY ordinal_position
    `);
    console.log('\n   Donations table:');
    donations.rows.forEach(col => {
      console.log(`   • ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n✅ All migrations completed successfully!\n');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
})();
