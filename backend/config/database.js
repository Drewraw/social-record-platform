/**
 * database.js
 * Works for both local and production databases.
 * Disables SSL automatically for local PostgreSQL.
 */

const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const { Pool } = require("pg");

// Detect whether this is a local or cloud environment
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is not defined. Please check your .env file.");
}

const isLocal = typeof dbUrl === 'string' && dbUrl.includes('localhost');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }, // ✅ disable SSL for local
});

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client:", err);
  process.exit(-1);
});

module.exports = pool;
