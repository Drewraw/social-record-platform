const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:Kalyan@localhost:5432/local-dbserver?sslmode=disable'
});

async function checkKCR() {
    try {
        const result = await pool.query(`
            SELECT id, name, position, constituency, party, assets, criminal_cases, 
                   dynasty_status, political_relatives, image_url, education,
                   liabilities, state, education_source, image_url_source
            FROM officials 
            WHERE name ILIKE '%Chandrashekar%' OR name ILIKE '%KCR%'
            ORDER BY id DESC 
            LIMIT 1
        `);
        
        if (result.rows.length > 0) {
            console.log('🎉 K. Chandrashekar Rao Record Found:');
            console.log(JSON.stringify(result.rows[0], null, 2));
        } else {
            console.log('❌ No record found for K. Chandrashekar Rao');
        }
    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await pool.end();
    }
}

checkKCR();