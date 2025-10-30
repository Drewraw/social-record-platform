const pool = require("./config/database");

(async () => {
  try {
    const res = await pool.query("SELECT NOW();");
    console.log("🕒 Database time:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Connection test failed:", err.message);
  } finally {
    pool.end();
  }
})();
