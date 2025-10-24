import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import Redis from "ioredis";
import cors from "cors";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";

// ✅ Load environment variables
dotenv.config();

const app = express();

// ✅ Allowed frontend origins (Render frontend)
const allowedOrigins = ['https://social-record-frontend.onrender.com', 'http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

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

// ✅ Multer S3 Storage setup
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read", // files are publicly accessible
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = `campaigns/${Date.now().toString()}-${file.originalname}`;
      cb(null, fileName);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ✅ Database initialization - Create tables if they don't exist
const initializeDatabase = async () => {
  try {
    // Create campaigns table
    const createCampaignsTable = `
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        promise TEXT NOT NULL,
        source VARCHAR(255) NOT NULL,
        recorded_date DATE NOT NULL,
        question TEXT NOT NULL,
        source_image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createCampaignsTable);
    console.log('✅ Campaigns table ready');

    // Create votes table
    const createVotesTable = `
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('yes', 'no', 'unsure')),
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createVotesTable);
    console.log('✅ Votes table ready');

  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
};

// ✅ Root route (server health check)
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

// ✅ Test PostgreSQL connection
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "✅ Postgres connected successfully",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("❌ Postgres test failed:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Test AWS S3 Connection
app.get("/test-s3", async (req, res) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME
    };
    const data = await s3.listObjectsV2(params).promise();

    res.json({
      message: "✅ S3 connected successfully",
      bucket: process.env.AWS_BUCKET_NAME,
      totalFiles: data.KeyCount || 0
    });
  } catch (error) {
    console.error("❌ S3 test failed:", error);
    res.status(500).json({
      error: "S3 connection failed",
      details: error.message
    });
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

// ========================================
// 🎯 CAMPAIGN ROUTES
// ========================================

// ✅ Create a new campaign
app.post('/api/campaigns', upload.single('sourceImage'), async (req, res) => {
  try {
    const { title, promise, source, recordedDate, question } = req.body;

    // Validation
    if (!title || !promise || !source || !recordedDate || !question) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Get S3 URL if image was uploaded
    const sourceImageUrl = req.file ? req.file.location : null;

    const result = await pool.query(
      `INSERT INTO campaigns (title, promise, source, recorded_date, question, source_image_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, promise, source, recordedDate, question, sourceImageUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign', details: error.message });
  }
});

// ✅ Get all campaigns with vote counts
app.get('/api/campaigns', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(CASE WHEN v.vote_type = 'yes' THEN 1 END)::INTEGER as yes_votes,
        COUNT(CASE WHEN v.vote_type = 'no' THEN 1 END)::INTEGER as no_votes,
        COUNT(CASE WHEN v.vote_type = 'unsure' THEN 1 END)::INTEGER as unsure_votes
      FROM campaigns c
      LEFT JOIN votes v ON c.id = v.campaign_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json({
      success: true,
      campaigns: result.rows
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns', details: error.message });
  }
});

// ✅ Get a single campaign by ID
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(CASE WHEN v.vote_type = 'yes' THEN 1 END)::INTEGER as yes_votes,
        COUNT(CASE WHEN v.vote_type = 'no' THEN 1 END)::INTEGER as no_votes,
        COUNT(CASE WHEN v.vote_type = 'unsure' THEN 1 END)::INTEGER as unsure_votes
      FROM campaigns c
      LEFT JOIN votes v ON c.id = v.campaign_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      success: true,
      campaign: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign', details: error.message });
  }
});

// ✅ Update a campaign
app.put('/api/campaigns/:id', upload.single('sourceImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, promise, source, recordedDate, question } = req.body;

    // Get existing campaign
    const existing = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    let sourceImageUrl = existing.rows[0].source_image_url;
    
    // If new image uploaded, use new S3 URL
    if (req.file) {
      sourceImageUrl = req.file.location;
      
      // Optionally delete old S3 image
      if (existing.rows[0].source_image_url) {
        const oldKey = existing.rows[0].source_image_url.split('.com/')[1];
        if (oldKey) {
          try {
            await s3.deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: oldKey
            }).promise();
          } catch (err) {
            console.error('Error deleting old S3 image:', err);
          }
        }
      }
    }

    const result = await pool.query(
      `UPDATE campaigns 
       SET title = $1, promise = $2, source = $3, recorded_date = $4, 
           question = $5, source_image_url = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [title, promise, source, recordedDate, question, sourceImageUrl, id]
    );

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign', details: error.message });
  }
});

// ✅ Delete a campaign
app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign to delete associated S3 image
    const campaign = await pool.query('SELECT source_image_url FROM campaigns WHERE id = $1', [id]);
    
    if (campaign.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Delete S3 image if exists
    if (campaign.rows[0].source_image_url) {
      const imageKey = campaign.rows[0].source_image_url.split('.com/')[1];
      if (imageKey) {
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageKey
          }).promise();
        } catch (err) {
          console.error('Error deleting S3 image:', err);
        }
      }
    }

    // Delete campaign (votes will be deleted automatically due to CASCADE)
    await pool.query('DELETE FROM campaigns WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign', details: error.message });
  }
});

// ✅ Vote on a campaign
app.post('/api/campaigns/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'yes', 'no', or 'unsure'
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!['yes', 'no', 'unsure'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // Check if campaign exists
    const campaignCheck = await pool.query('SELECT id FROM campaigns WHERE id = $1', [id]);
    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Insert vote
    await pool.query(
      'INSERT INTO votes (campaign_id, vote_type, ip_address) VALUES ($1, $2, $3)',
      [id, voteType, ipAddress]
    );

    // Get updated vote counts
    const result = await pool.query(`
      SELECT 
        COUNT(CASE WHEN vote_type = 'yes' THEN 1 END)::INTEGER as yes_votes,
        COUNT(CASE WHEN vote_type = 'no' THEN 1 END)::INTEGER as no_votes,
        COUNT(CASE WHEN vote_type = 'unsure' THEN 1 END)::INTEGER as unsure_votes
      FROM votes
      WHERE campaign_id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      votes: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Failed to record vote', details: error.message });
  }
});

// ✅ Initialize database and start server
initializeDatabase().then(() => {
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});