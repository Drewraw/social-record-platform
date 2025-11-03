/**
 * RUN PROFILE IMAGE MIGRATION
 * Adds profile_image_url column to officials table
 */

const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Adding profile_image_url column to officials table...\n');
  
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-profile-image.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    console.log('✅ Migration completed successfully!\n');
    
    // Verify column was added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'officials' 
      AND column_name = 'profile_image_url'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column verified:');
      console.log(`   • ${result.rows[0].column_name} (${result.rows[0].data_type})\n`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
