const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Revanth_Reddy_at_TS_Formation_Day_Celebrations_2024.jpg/440px-Revanth_Reddy_at_TS_Formation_Day_Celebrations_2024.jpg';

pool.query("UPDATE officials SET profile_image_url = $1 WHERE name LIKE '%Revanth%'", [imageUrl])
  .then(() => {
    console.log('✅ Updated Revanth Reddy with Wikipedia image');
    console.log(`   ${imageUrl}`);
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    pool.end();
  });
