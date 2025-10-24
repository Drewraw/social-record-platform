import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import Redis from "ioredis";
import cors from "cors";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";

// Load .env variables
dotenv.config();

const app = express();

// ✅ Allowed frontend origins (Render frontend)
const allowedOrigins = ['https://social-record-frontend.onrender.com'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ✅ PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.POSTGRESS_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Redis connection
const redis = new Redis(process.env.REDIS_URL);

// ✅ JWT secret
const jwtSecret = process.env.JWT_TOKEN;

// ✅ AWS S3 Configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// ✅ Multer S3 Storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read", // makes files publicly accessible via URL
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = `${Date.now().toString()}-${file.originalname}`;
      cb(null, fileName);
    }
  })
});

// ✅ Root Test Route
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

// ✅ Upload Route (for S3)
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file || !req.file.location) {
    return res.status(400).json({ error: "File upload failed" });
  }
  res.json({
    message: "File uploaded successfully ✅",
    fileUrl: req.file.location
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
