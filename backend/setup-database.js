const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Social Record Platform - Database Setup Script
 * 
 * This script sets up the complete database schema for the social record platform.
 * It creates all necessary tables, indexes, foreign keys, and helper functions.
 * 
 * Usage:
 * 1. Make sure PostgreSQL is running
 * 2. Create a database named 'social_records' 
 * 3. Update your .env file with DATABASE_URL
 * 4. Run: node setup-database.js
 */

async function setupDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('\n🚀 Starting Social Record Platform Database Setup...\n');
        console.log('=' * 60);

        // Read the complete setup SQL file
        const setupSQLPath = path.join(__dirname, 'migrations', 'complete-database-setup.sql');
        
        if (!fs.existsSync(setupSQLPath)) {
            throw new Error(`Setup SQL file not found: ${setupSQLPath}`);
        }

        const setupSQL = fs.readFileSync(setupSQLPath, 'utf8');
        
        console.log('📂 Reading setup SQL file...');
        console.log('✅ SQL file loaded successfully');
        
        console.log('\n🔄 Executing database setup...');
        
        // Execute the complete setup
        await pool.query(setupSQL);
        
        console.log('✅ Database schema created successfully!');
        
        // Verify the setup
        console.log('\n📊 Verifying database setup...');
        
        // Check tables
        const tablesResult = await pool.query(`
            SELECT tablename, schemaname 
            FROM pg_tables 
            WHERE tablename IN ('officials', 'data_sources', 'official_sources')
            ORDER BY tablename
        `);
        
        console.log('\n📋 Tables created:');
        tablesResult.rows.forEach(table => {
            console.log(`  ✅ ${table.tablename}`);
        });
        
        // Check column count for main table
        const columnCountResult = await pool.query(`
            SELECT COUNT(*) as column_count 
            FROM information_schema.columns 
            WHERE table_name = 'officials'
        `);
        
        const columnCount = columnCountResult.rows[0].column_count;
        console.log(`\n📈 Officials table has ${columnCount} columns`);
        
        // Check foreign keys
        const foreignKeysResult = await pool.query(`
            SELECT 
                tc.table_name,
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name IN ('official_sources')
        `);
        
        console.log('\n🔗 Foreign keys:');
        foreignKeysResult.rows.forEach(fk => {
            console.log(`  ✅ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        
        // Check data sources
        const sourcesResult = await pool.query('SELECT name, reliability_score FROM data_sources ORDER BY reliability_score DESC');
        
        console.log('\n🗂️  Default data sources:');
        sourcesResult.rows.forEach(source => {
            console.log(`  ✅ ${source.name} (reliability: ${source.reliability_score}/10)`);
        });
        
        console.log('\n' + '=' * 60);
        console.log('🎉 DATABASE SETUP COMPLETED SUCCESSFULLY!');
        console.log('=' * 60);
        
        console.log('\n📋 What was created:');
        console.log('  • officials table (90+ columns with source tracking)');
        console.log('  • data_sources table (tracks data source reliability)');
        console.log('  • official_sources table (many-to-many relationships)');
        console.log('  • Performance indexes on key columns');
        console.log('  • Foreign key constraints for data integrity');
        console.log('  • Helper functions for data insertion');
        console.log('  • Views for common queries');
        console.log('  • Automatic timestamp triggers');
        
        console.log('\n🚀 Next steps:');
        console.log('  1. Run MyNeta scrapers to collect politician data');
        console.log('  2. Use json-DBconv.js to import scraped data');
        console.log('  3. Start your backend API server');
        console.log('  4. Access politician profiles through the API');
        
        console.log('\n📖 Example usage:');
        console.log('  • Scrape data: python myneta_scraper.py "Politician Name"');
        console.log('  • Import data: node json-DBconv.js');
        console.log('  • Query data: SELECT * FROM officials_with_sources;');
        
        await pool.end();
        
    } catch (error) {
        console.error('\n❌ Database setup failed:');
        console.error(error.message);
        console.error('\nPlease check:');
        console.error('  1. PostgreSQL is running');
        console.error('  2. Database "social_records" exists');
        console.error('  3. DATABASE_URL in .env file is correct');
        console.error('  4. Database user has sufficient privileges');
        
        process.exit(1);
    }
}

// Helper function to create database if it doesn't exist
async function createDatabaseIfNotExists() {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const dbName = dbUrl.pathname.slice(1); // Remove leading '/'
    
    // Connect to postgres database to create our target database
    dbUrl.pathname = '/postgres';
    
    const adminPool = new Pool({
        connectionString: dbUrl.toString(),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    try {
        // Check if database exists
        const result = await adminPool.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [dbName]
        );
        
        if (result.rows.length === 0) {
            console.log(`📚 Creating database "${dbName}"...`);
            await adminPool.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database "${dbName}" created successfully`);
        } else {
            console.log(`✅ Database "${dbName}" already exists`);
        }
        
        await adminPool.end();
    } catch (error) {
        console.error(`❌ Error creating database: ${error.message}`);
        await adminPool.end();
        throw error;
    }
}

// Main execution
async function main() {
    try {
        console.log('🔍 Checking DATABASE_URL...');
        
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL not found in environment variables. Please check your .env file.');
        }
        
        console.log('✅ DATABASE_URL found');
        
        // Create database if it doesn't exist
        await createDatabaseIfNotExists();
        
        // Setup the schema
        await setupDatabase();
        
    } catch (error) {
        console.error('\n💥 Setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { setupDatabase, createDatabaseIfNotExists };