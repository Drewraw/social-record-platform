/**
 * Manual update with direct Wikipedia URLs for Chandrababu and Jagan
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Known Wikipedia/Official image URLs for these politicians
const imageUrls = {
  'Chandrababu Naidu': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Nara_Chandrababu_Naidu_2018.jpg',
  'YS Jagan Mohan Reddy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Y._S._Jaganmohan_Reddy_at_Aero_India_2023_%28cropped%29.jpg/440px-Y._S._Jaganmohan_Reddy_at_Aero_India_2023_%28cropped%29.jpg'
};

async function updateImages() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      MANUAL IMAGE UPDATE (Wikipedia URLs)                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Update Chandrababu Naidu
  console.log('1. Updating Chandrababu Naidu...');
  await pool.query(`
    UPDATE officials 
    SET profile_image_url = $1
    WHERE name LIKE '%Chandrababu%'
  `, [imageUrls['Chandrababu Naidu']]);
  console.log('   ✅ Updated with Wikipedia image\n');
  
  // Update YS Jagan
  console.log('2. Updating YS Jagan Mohan Reddy...');
  await pool.query(`
    UPDATE officials 
    SET profile_image_url = $1
    WHERE name LIKE '%Jagan%'
  `, [imageUrls['YS Jagan Mohan Reddy']]);
  console.log('   ✅ Updated with Wikipedia image\n');
  
  // Verify
  const result = await pool.query(`
    SELECT name, profile_image_url 
    FROM officials 
    WHERE name LIKE '%Chandrababu%' OR name LIKE '%Jagan%'
  `);
  
  console.log('📊 Updated Images:\n');
  result.rows.forEach(row => {
    console.log(`• ${row.name}`);
    console.log(`  ${row.profile_image_url}\n`);
  });
  
  console.log('✅ Both politicians now have real Wikipedia images!\n');
  
  await pool.end();
}

updateImages().catch(err => {
  console.error('Error:', err);
  pool.end();
});
