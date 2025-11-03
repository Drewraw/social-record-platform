const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('Running Migration: Add serial_number');
    console.log('='.repeat(80) + '\n');

    const migrationPath = path.join(__dirname, 'migrations', 'add-serial-number.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(' Reading migration file...');
    console.log('File loaded successfully\n');

    console.log('Executing migration...\n');
    await pool.query(sql);
    console.log(' Migration completed successfully!\n');

    // Update existing records with serial numbers
    console.log(' Updating existing records with serial numbers...\n');
    await pool.query(`
      UPDATE officials
      SET serial_number = id
      WHERE serial_number IS NULL
    `);
    console.log(' Serial numbers assigned to existing records\n');

    // Verify columns were added
    const verifyQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'officials'
        AND column_name = 'serial_number'
    `;

    const result = await pool.query(verifyQuery);

    console.log('📋 Verification - New Column:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✨ Migration completed successfully!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Migration Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
