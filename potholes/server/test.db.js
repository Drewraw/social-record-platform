import pool from "./database.js";

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database time:", res.rows[0]);
  } catch (err) {
    console.error("DB test failed:", err);
  } finally {
    await pool.end();
  }
}

testConnection();