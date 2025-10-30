-- Update political_donations table to track party-level donations

-- Add donation_recipient_type column
ALTER TABLE political_donations 
ADD COLUMN IF NOT EXISTS donation_recipient_type VARCHAR(50) DEFAULT 'Politician' 
CHECK (donation_recipient_type IN ('Politician', 'Party', 'Both'));

-- Add party_name column (for party-level donations)
ALTER TABLE political_donations 
ADD COLUMN IF NOT EXISTS party_name VARCHAR(200);

-- Add index for party donations
CREATE INDEX IF NOT EXISTS idx_donations_party ON political_donations(party_name);
CREATE INDEX IF NOT EXISTS idx_donations_recipient_type ON political_donations(donation_recipient_type);

-- Add comments
COMMENT ON COLUMN political_donations.donation_recipient_type IS 'Whether donation was to Politician directly, Party, or Both';
COMMENT ON COLUMN political_donations.party_name IS 'Party name if donation was made to party (e.g., TDP, INC, BJP)';
