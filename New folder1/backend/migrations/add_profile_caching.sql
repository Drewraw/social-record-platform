-- Add profile caching columns to officials table
-- This allows us to cache profile data fetched from ProfileService

-- Add profile_data column (JSONB) to store standardized profile
ALTER TABLE officials ADD COLUMN IF NOT EXISTS profile_data JSONB;

-- Add profile_updated_at to track when profile was last fetched
ALTER TABLE officials ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP;

-- Add state column if not exists
ALTER TABLE officials ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Karnataka';

-- Create index on profile_updated_at for efficient cache checking
CREATE INDEX IF NOT EXISTS idx_officials_profile_updated ON officials(profile_updated_at);

-- Add comment explaining the schema
COMMENT ON COLUMN officials.profile_data IS 'Cached standardized profile data from ProfileService (8 sections)';
COMMENT ON COLUMN officials.profile_updated_at IS 'Timestamp when profile was last fetched from external sources';

-- Example: Update existing officials with state information
UPDATE officials SET state = 'Karnataka' WHERE state IS NULL;
UPDATE officials SET state = 'Andhra Pradesh' WHERE name LIKE '%Naidu%' OR name LIKE '%Pawan%';
