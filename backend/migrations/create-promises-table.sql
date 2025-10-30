-- SQL to create the promises table
CREATE TABLE IF NOT EXISTS promises (
  id SERIAL PRIMARY KEY,
  official_id INTEGER REFERENCES officials(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
