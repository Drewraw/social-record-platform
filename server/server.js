import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import Redis from "ioredis";
import cors from "cors";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.POSTGRESS_URL,
  ssl: { rejectUnauthorized: false }
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL);

// JWT secret
const jwtSecret = process.env.JWT_TOKEN;

// Test route
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Server running ✅",
      time: result.rows[0].now,
      jwt_loaded: Boolean(jwtSecret)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));