const {Pool} = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}
});

(async () => {
  try {
    console.log('Running migration...');
    const sql = fs.readFileSync('migrations/add-consistent-winner-and-wealth.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Migration completed!');
    
    const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='officials' AND column_name IN ('consistent_winner','family_wealth','current_wealth','knowledgeful')");
    console.log('New columns:', r.rows.map(x => x.column_name).join(', '));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
