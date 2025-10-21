import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Campaigns table
    db.run(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        promise TEXT NOT NULL,
        promise_date TEXT NOT NULL,
        organization TEXT NOT NULL,
        verification_status TEXT DEFAULT 'verified',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Votes table
    db.run(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        vote_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    // Updates table
    db.run(`
      CREATE TABLE IF NOT EXISTS updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        update_type TEXT DEFAULT 'community',
        verification_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    // Mid-term verifications table
    db.run(`
      CREATE TABLE IF NOT EXISTS verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        verification_date TEXT NOT NULL,
        verified_by TEXT DEFAULT 'CiviCast Mods',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    console.log('Database tables initialized');
  });
}

export default db;
