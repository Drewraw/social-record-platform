import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { query } from "./database.js";

import dotenv from "dotenv";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = path.join(__dirname, process.env.UPLOAD_DIR || "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// ✅ Step 3: TEST POSTGRES CONNECTION HERE
(async () => {
  try {
    const res = await query("SELECT NOW()");
    console.log("✅ PostgreSQL connected successfully:", res.rows[0].now);
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
  }})();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));
// Serve GeoJSON files for frontend map
const geojsonDir = path.join(path.dirname(__filename), ".");
app.use("/geojson", express.static(geojsonDir));

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, UPLOAD_DIR),
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const name = `pothole-${Date.now()}${ext}`;
		cb(null, name);
	}
});
const upload = multer({ storage });

// Health Check
app.get("/api/health", (_, res) => res.json({ ok: true }));

// Fetch Reports
app.get("/api/potholes", async (_, res) => {
	try {
		const { rows } = await query("SELECT * FROM reports ORDER BY created_at DESC LIMIT 5000");
		res.json(rows);
	} catch (e) {
		res.status(500).json({ error: "Failed to fetch reports" });
	}
});

// Submit Report
app.post("/api/potholes", upload.single("photo"), async (req, res) => {
	try {
		const { description, lat, lng } = req.body;
		if (!req.file) return res.status(400).json({ error: "Photo required" });

		const photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
		const result = await query(
			"INSERT INTO reports (lat, lng, description, photo_url) VALUES ($1, $2, $3, $4) RETURNING *",
			[lat, lng, description || "", photoUrl]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to save report" });
	}
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
