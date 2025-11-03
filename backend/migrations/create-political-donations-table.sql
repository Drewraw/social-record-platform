-- Create political_donations table
CREATE TABLE IF NOT EXISTS political_donations (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES officials(id) ON DELETE CASCADE,
  donor_name VARCHAR(255) NOT NULL,
  donor_type VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'INR',
  year INTEGER,
  source_url TEXT,
  source_type VARCHAR(100),
  verified BOOLEAN DEFAULT false,
  notes TEXT,
  donation_recipient_type VARCHAR(50) DEFAULT 'Politician',
  party_name VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_politician ON political_donations(politician_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON political_donations(donor_name);
CREATE INDEX IF NOT EXISTS idx_donations_year ON political_donations(year);
CREATE INDEX IF NOT EXISTS idx_donations_type ON political_donations(donor_type);
CREATE INDEX IF NOT EXISTS idx_donations_party ON political_donations(party_name);
CREATE INDEX IF NOT EXISTS idx_donations_recipient_type ON political_donations(donation_recipient_type);

-- Add comments
COMMENT ON TABLE political_donations IS 'Political donations and funding records from various sources';
COMMENT ON COLUMN political_donations.donation_recipient_type IS 'Whether donation was to Politician directly, Party, or Both';
COMMENT ON COLUMN political_donations.party_name IS 'Party name if donation was made to party (e.g., TDP, INC, BJP)';
