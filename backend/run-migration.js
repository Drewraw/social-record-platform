/**/**const pool = require('./config/database');

 * Run migration to add consistent_winner and family_wealth columns

 */ * Run migration to add consistent_winner and family_wealth columns



const { Pool } = require('pg'); */async function runMigration() {

const fs = require('fs');

const path = require('path');  try {

require('dotenv').config();

const { Pool } = require('pg');    console.log('🔄 Running profile caching migration...\n');

const pool = new Pool({

  connectionString: process.env.DATABASE_URL,const fs = require('fs');

  ssl: { rejectUnauthorized: false }

});const path = require('path');    // Add profile_data column



async function runMigration() {require('dotenv').config();    await pool.query(`

  try {

    console.log('\n' + '='.repeat(80));      ALTER TABLE officials 

    console.log('Running Migration: Add consistent_winner and family_wealth');

    console.log('='.repeat(80) + '\n');const pool = new Pool({      ADD COLUMN IF NOT EXISTS profile_data JSONB

    

    const migrationPath = path.join(__dirname, 'migrations', 'add-consistent-winner-and-wealth.sql');  connectionString: process.env.DATABASE_URL,    `);

    const sql = fs.readFileSync(migrationPath, 'utf8');

      ssl: { rejectUnauthorized: false }    console.log('✅ Added profile_data column');

    console.log('📂 Reading migration file...');

    console.log('✅ File loaded successfully\n');});

    

    console.log('🔄 Executing migration...\n');    // Add profile_updated_at column

    await pool.query(sql);

    async function runMigration() {    await pool.query(`

    console.log('✅ Migration completed successfully!\n');

      try {      ALTER TABLE officials 

    // Verify columns were added

    const verifyQuery = `    console.log('\n' + '='.repeat(80));      ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP

      SELECT column_name, data_type 

      FROM information_schema.columns     console.log('Running Migration: Add consistent_winner and family_wealth');    `);

      WHERE table_name = 'officials' 

        AND column_name IN ('consistent_winner', 'family_wealth')    console.log('='.repeat(80) + '\n');    console.log('✅ Added profile_updated_at column');

      ORDER BY column_name

    `;    

    

    const result = await pool.query(verifyQuery);    const migrationPath = path.join(__dirname, 'migrations', 'add-consistent-winner-and-wealth.sql');    // Add state column

    

    console.log('📋 Verification - New Columns:');    const sql = fs.readFileSync(migrationPath, 'utf8');    await pool.query(`

    result.rows.forEach(row => {

      console.log(`   ✓ ${row.column_name} (${row.data_type})`);          ALTER TABLE officials 

    });

        console.log('📂 Reading migration file...');      ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Karnataka'

    console.log('\n' + '='.repeat(80));

    console.log('✨ Migration completed successfully!');    console.log('✅ File loaded successfully\n');    `);

    console.log('='.repeat(80) + '\n');

            console.log('✅ Added state column');

  } catch (error) {

    console.error('\n❌ Migration Error:', error.message);    console.log('🔄 Executing migration...\n');

    console.error(error.stack);

    throw error;    await pool.query(sql);    // Create index

  } finally {

    await pool.end();        await pool.query(`

  }

}    console.log('✅ Migration completed successfully!\n');      CREATE INDEX IF NOT EXISTS idx_officials_profile_updated 



if (require.main === module) {          ON officials(profile_updated_at)

  runMigration();

}    // Verify columns were added    `);



module.exports = { runMigration };    const verifyQuery = `    console.log('✅ Created index on profile_updated_at');


      SELECT column_name, data_type 

      FROM information_schema.columns     // Update existing officials with state

      WHERE table_name = 'officials'     await pool.query(`

        AND column_name IN ('consistent_winner', 'family_wealth')      UPDATE officials 

      ORDER BY column_name;      SET state = 'Karnataka' 

    `;      WHERE state IS NULL

        `);

    const result = await pool.query(verifyQuery);    console.log('✅ Updated default state for existing officials');

    

    console.log('📋 Verification - New Columns:');    console.log('\n✅ Migration completed successfully!\n');

    result.rows.forEach(row => {    process.exit(0);

      console.log(`   ✓ ${row.column_name} (${row.data_type})`);  } catch (error) {

    });    console.error('❌ Migration failed:', error);

        process.exit(1);

    console.log('\n' + '='.repeat(80));  }

    console.log('✨ Migration completed successfully!');}

    console.log('='.repeat(80) + '\n');

    runMigration();

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
