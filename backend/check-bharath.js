const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:Kalyan@localhost:5432/local-dbserver?sslmode=disable'
});

async function checkBharath() {
    try {
        // First check table structure
        const tableInfo = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'officials'
            ORDER BY ordinal_position
        `);
        
        console.log('📊 Officials table columns:');
        tableInfo.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type}`);
        });
        
        const result = await pool.query(`
            SELECT * FROM officials 
            WHERE name ILIKE '%T.G. Bharath%' 
            ORDER BY id DESC 
            LIMIT 1
        `);
        
        if (result.rows.length > 0) {
            console.log('🎉 T.G. Bharath Record Found:');
            console.log(JSON.stringify(result.rows[0], null, 2));
        } else {
            console.log('❌ No record found for T.G. Bharath');
        }
    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await pool.end();
    }
}

checkBharath();