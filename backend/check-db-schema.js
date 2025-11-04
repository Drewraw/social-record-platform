const pool = require('./config/database');

async function checkDatabaseColumns() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'officials' 
            ORDER BY ordinal_position
        `);
        
        console.log('📊 CURRENT DATABASE COLUMNS:');
        console.log('============================');
        
        const columns = result.rows;
        columns.forEach((col, index) => {
            console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'Nullable' : 'Not Null'}`);
        });
        
        console.log(`\nTotal columns: ${columns.length}`);
        
        // Check for missing columns based on the required fields
        const requiredFields = [
            // Basic info
            'name', 'position', 'party', 'constituency', 'state', 'tenure',
            // Educational & Personal
            'education', 'age', 'image_url',
            // Financial
            'assets', 'liabilities', 'family_wealth', 'source_of_wealth',
            // Criminal
            'criminal_cases', 'convicted_cases', 'conviction_status',
            // Political
            'dynasty_status', 'political_relatives', 'consistent_winner',
            'party_switches', 'career_highlight',
            // Contact
            'contact_email',
            // Performance metrics
            'knowledgeful', 'approvals', 'disapprovals'
        ];
        
        console.log('\n🔍 CHECKING FOR REQUIRED FIELDS:');
        console.log('=================================');
        
        const existingColumns = columns.map(col => col.column_name);
        const missingFields = requiredFields.filter(field => !existingColumns.includes(field));
        const presentFields = requiredFields.filter(field => existingColumns.includes(field));
        
        console.log(`\n✅ Present fields (${presentFields.length}):`);
        presentFields.forEach(field => console.log(`  - ${field}`));
        
        if (missingFields.length > 0) {
            console.log(`\n❌ Missing fields (${missingFields.length}):`);
            missingFields.forEach(field => console.log(`  - ${field}`));
        } else {
            console.log('\n🎉 All required fields are present!');
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Database Error:', error.message);
        process.exit(1);
    }
}

checkDatabaseColumns();