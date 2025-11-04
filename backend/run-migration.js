const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🔄 Running migration to add missing columns...');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add-missing-columns.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement && !statement.startsWith('--') && !statement.includes('SELECT')) {
                console.log(`Executing statement ${i + 1}...`);
                await pool.query(statement);
            }
        }
        
        console.log('✅ Migration completed successfully!');
        
        // Verify the added columns
        console.log('\n📊 VERIFYING ADDED COLUMNS:');
        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'officials' 
            AND column_name IN ('source_of_wealth', 'conviction_status', 'career_highlight', 'party_switches')
            ORDER BY column_name
        `);
        
        console.log('Found columns:');
        result.rows.forEach(row => {
            console.log(`  ✅ ${row.column_name}`);
        });
        
        // Check total column count
        const countResult = await pool.query(`
            SELECT COUNT(*) as total_columns 
            FROM information_schema.columns 
            WHERE table_name = 'officials'
        `);
        
        console.log(`\n📈 Total columns in officials table: ${countResult.rows[0].total_columns}`);
        
        await pool.end();
    } catch (error) {
        console.error('❌ Migration Error:', error.message);
        process.exit(1);
    }
}

runMigration();
