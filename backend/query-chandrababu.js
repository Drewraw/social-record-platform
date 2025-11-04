const pool = require('./config/database');

async function queryChandrababu() {
    try {
        const result = await pool.query("SELECT * FROM officials WHERE name LIKE '%Chandrababu%'");
        
        if (result.rows.length > 0) {
            console.log('📊 CHANDRABABU NAIDU DATABASE FIELDS:');
            console.log('====================================');
            const data = result.rows[0];
            
            // Basic fields
            console.log('ID:', data.id);
            console.log('Name:', data.name);
            console.log('Party:', data.party);
            console.log('Position:', data.position);
            console.log('Constituency:', data.constituency);
            console.log('State:', data.state);
            console.log('Education:', data.education);
            console.log('Age:', data.age);
            console.log('Assets:', data.assets);
            console.log('Liabilities:', data.liabilities);
            console.log('Criminal Cases:', data.criminal_cases);
            console.log('Convicted Cases:', data.convicted_cases);
            console.log('Dynasty Status:', data.dynasty_status);
            console.log('Political Relatives:', data.political_relatives);
            console.log('Family Wealth:', data.family_wealth);
            console.log('Tenure:', data.tenure);
            console.log('Image URL:', data.image_url);
            
            console.log('\n📋 SOURCE URLS:');
            console.log('Name Source:', data.name_source);
            console.log('Party Source:', data.party_source);
            console.log('Education Source:', data.education_source);
            console.log('Dynasty Status Source:', data.dynasty_status_source);
            console.log('Political Relatives Source:', data.political_relatives_source);
            
        } else {
            console.log('❌ No record found for Chandrababu Naidu');
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Database Error:', error.message);
        process.exit(1);
    }
}

queryChandrababu();