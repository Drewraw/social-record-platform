const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyDatabase() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              DATABASE VERIFICATION REPORT                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Check all columns exist
  const columnsResult = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'officials'
    ORDER BY ordinal_position
  `);
  
  console.log('📋 Table Columns:');
  columnsResult.rows.forEach(row => {
    console.log(`   • ${row.column_name} (${row.data_type})`);
  });
  
  // Check data completeness
  const dataResult = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(profile_image_url) as has_image,
      COUNT(CASE WHEN dynasty_status IS NOT NULL AND dynasty_status != 'To be verified' THEN 1 END) as has_dynasty,
      COUNT(CASE WHEN current_wealth IS NOT NULL AND current_wealth != 'Unknown' THEN 1 END) as has_wealth,
      COUNT(CASE WHEN knowledgeful IS NOT NULL AND knowledgeful != 'Unknown' THEN 1 END) as has_knowledge,
      COUNT(CASE WHEN political_relatives IS NOT NULL AND political_relatives != 'None identified' THEN 1 END) as has_relatives,
      COUNT(profile_data) as has_profile_data
    FROM officials
  `);
  
  const stats = dataResult.rows[0];
  
  console.log('\n📊 Data Completeness:');
  console.log(`   Total Officials: ${stats.total}`);
  console.log(`   ✅ With Images: ${stats.has_image}/${stats.total} (${Math.round(stats.has_image/stats.total*100)}%)`);
  console.log(`   ✅ With Dynasty Data: ${stats.has_dynasty}/${stats.total} (${Math.round(stats.has_dynasty/stats.total*100)}%)`);
  console.log(`   ✅ With Wealth Data: ${stats.has_wealth}/${stats.total} (${Math.round(stats.has_wealth/stats.total*100)}%)`);
  console.log(`   ✅ With Knowledge Data: ${stats.has_knowledge}/${stats.total} (${Math.round(stats.has_knowledge/stats.total*100)}%)`);
  console.log(`   ✅ With Relatives Data: ${stats.has_relatives}/${stats.total} (${Math.round(stats.has_relatives/stats.total*100)}%)`);
  console.log(`   ✅ With Profile Data: ${stats.has_profile_data}/${stats.total} (${Math.round(stats.has_profile_data/stats.total*100)}%)`);
  
  // Sample data
  const sampleResult = await pool.query(`
    SELECT id, name, party, 
           LEFT(profile_image_url, 50) as image_preview,
           LEFT(dynasty_status, 60) as dynasty_preview,
           current_wealth,
           LEFT(knowledgeful, 50) as knowledge_preview
    FROM officials 
    ORDER BY id 
    LIMIT 3
  `);
  
  console.log('\n📝 Sample Data (First 3 Officials):\n');
  sampleResult.rows.forEach((row, i) => {
    console.log(`${i+1}. ${row.name} (${row.party})`);
    console.log(`   Image: ${row.image_preview}...`);
    console.log(`   Dynasty: ${row.dynasty_preview}...`);
    console.log(`   Wealth: ${row.current_wealth}`);
    console.log(`   Knowledge: ${row.knowledge_preview}...\n`);
  });
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                 VERIFICATION COMPLETE                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  if (stats.has_image == stats.total && 
      stats.has_dynasty == stats.total && 
      stats.has_wealth == stats.total && 
      stats.has_knowledge == stats.total) {
    console.log('✅ ALL DATA COMPLETE! Database is fully updated.\n');
  } else {
    console.log('⚠️  Some data is missing. Run update scripts to complete.\n');
  }
  
  await pool.end();
}

verifyDatabase().catch(err => {
  console.error('Error:', err);
  pool.end();
});
