-- Migration: Complete Officials Table Structure
-- This ensures the officials table has all necessary columns for the profile data

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Check and add profile_data column (JSONB for structured profile)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'profile_data'
    ) THEN
        ALTER TABLE officials ADD COLUMN profile_data JSONB;
        RAISE NOTICE 'Added profile_data column';
    END IF;

    -- Check and add profile_updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'profile_updated_at'
    ) THEN
        ALTER TABLE officials ADD COLUMN profile_updated_at TIMESTAMP;
        RAISE NOTICE 'Added profile_updated_at column';
    END IF;

    -- Check and add state column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'state'
    ) THEN
        ALTER TABLE officials ADD COLUMN state VARCHAR(100);
        RAISE NOTICE 'Added state column';
    END IF;

    -- Update education column if it's too short
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'education' 
        AND character_maximum_length < 500
    ) THEN
        ALTER TABLE officials ALTER COLUMN education TYPE TEXT;
        RAISE NOTICE 'Updated education column to TEXT';
    END IF;

    -- Update assets column if it's too short
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'assets' 
        AND character_maximum_length < 200
    ) THEN
        ALTER TABLE officials ALTER COLUMN assets TYPE VARCHAR(200);
        RAISE NOTICE 'Updated assets column to VARCHAR(200)';
    END IF;

    -- Update liabilities column if it's too short
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'liabilities' 
        AND character_maximum_length < 200
    ) THEN
        ALTER TABLE officials ALTER COLUMN liabilities TYPE VARCHAR(200);
        RAISE NOTICE 'Updated liabilities column to VARCHAR(200)';
    END IF;

    -- Update criminal_cases column if it's too short
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'criminal_cases' 
        AND character_maximum_length < 200
    ) THEN
        ALTER TABLE officials ALTER COLUMN criminal_cases TYPE VARCHAR(200);
        RAISE NOTICE 'Updated criminal_cases column to VARCHAR(200)';
    END IF;

END $$;

-- Create index on profile_data JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_officials_profile_data ON officials USING gin(profile_data);

-- Create index on profile_updated_at for cache queries
CREATE INDEX IF NOT EXISTS idx_officials_profile_updated ON officials(profile_updated_at);

-- Show final table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'officials'
ORDER BY ordinal_position;

COMMENT ON COLUMN officials.profile_data IS 'Complete profile data in JSON format with all 8 sections';
COMMENT ON COLUMN officials.profile_updated_at IS 'Timestamp when profile was last fetched from Gemini API';
COMMENT ON COLUMN officials.state IS 'State/Region where the official serves';
