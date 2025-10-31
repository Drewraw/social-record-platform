/**
 * PostgreSQL Connection Setup
 * Works for both local and production environments.
 * - Loads .env automatically
 * - Uses DATABASE_URL connection string
 * - Disables SSL for local
 * - Enables SSL for production
 */

import dotenv from "dotenv";
import { Pool } from "pg";
import path from "path";
import { fileURLToPath } from "url";

// Resolve file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") }); // adjust if your .env is in /backend

// ✅ Validate environment
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined in .env file");
}

// ✅ Print (optional debug, you can remove later)
console.log("🔍 Using DATABASE_URL:", process.env.DATABASE_URL);

// Detect local vs. production
const isLocal = process.env.DATABASE_URL.includes("localhost");

// ✅ Create Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// ✅ Events
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err);
  process.exit(-1);
});

// ✅ Helper query function
export const query = (text, params) => pool.query(text, params);

// ✅ Optional: quick self-test when file runs directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      const res = await query("SELECT NOW()");
      console.log("🕒 Database time:", res.rows[0]);
      process.exit(0);
    } catch (err) {
      console.error("❌ Database test failed:", err.message);
      process.exit(1);
    }
  })();
}
