import express from "express";
import upload from "../config/s3.js"; // this handles file upload to S3
import db from "../config/db.js";     // this connects to PostgreSQL

const router = express.Router();

// POST /api/campaigns
router.post("/", upload.single("sourceImage"), async (req, res) => {
  try {
    const { title, description } = req.body;

    // ✅ This comes from S3 — Multer-S3 middleware uploads it automatically
    const imageUrl = req.file ? req.file.location : null;

    // ✅ This goes to PostgreSQL
    const result = await db.query(
      "INSERT INTO campaigns (title, description, image_url) VALUES ($1, $2, $3) RETURNING *",
      [title, description, imageUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
