-- Migration: Add Source URL Columns for All Profile Fields
-- This adds separate source URL columns to track the source of each data field

-- Add source URL columns for all profile fields
DO $$ 
BEGIN
    -- Basic profile fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'name_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN name_source TEXT;
        RAISE NOTICE 'Added name_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'position_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN position_source TEXT;
        RAISE NOTICE 'Added position_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'party_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN party_source TEXT;
        RAISE NOTICE 'Added party_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'constituency_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN constituency_source TEXT;
        RAISE NOTICE 'Added constituency_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'state_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN state_source TEXT;
        RAISE NOTICE 'Added state_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'tenure_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN tenure_source TEXT;
        RAISE NOTICE 'Added tenure_source column';
    END IF;

    -- Educational fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'education_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN education_source TEXT;
        RAISE NOTICE 'Added education_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'age_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN age_source TEXT;
        RAISE NOTICE 'Added age_source column';
    END IF;

    -- Financial fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'assets_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN assets_source TEXT;
        RAISE NOTICE 'Added assets_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'liabilities_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN liabilities_source TEXT;
        RAISE NOTICE 'Added liabilities_source column';
    END IF;

    -- Criminal cases fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'criminal_cases_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN criminal_cases_source TEXT;
        RAISE NOTICE 'Added criminal_cases_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'convicted_cases_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN convicted_cases_source TEXT;
        RAISE NOTICE 'Added convicted_cases_source column';
    END IF;

    -- Political family & dynasty fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'dynasty_status_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN dynasty_status_source TEXT;
        RAISE NOTICE 'Added dynasty_status_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'political_relatives_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN political_relatives_source TEXT;
        RAISE NOTICE 'Added political_relatives_source column';
    END IF;

    -- Business & wealth fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'family_wealth_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN family_wealth_source TEXT;
        RAISE NOTICE 'Added family_wealth_source column';
    END IF;

    -- Contact fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'contact_email_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN contact_email_source TEXT;
        RAISE NOTICE 'Added contact_email_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'image_url_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN image_url_source TEXT;
        RAISE NOTICE 'Added image_url_source column';
    END IF;

    -- Performance fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'knowledgeful_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN knowledgeful_source TEXT;
        RAISE NOTICE 'Added knowledgeful_source column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'officials' AND column_name = 'consistent_winner_source'
    ) THEN
        ALTER TABLE officials ADD COLUMN consistent_winner_source TEXT;
        RAISE NOTICE 'Added consistent_winner_source column';
    END IF;

END $$;

-- Create indexes for source URL columns for better query performance
CREATE INDEX IF NOT EXISTS idx_officials_education_source ON officials(education_source);
CREATE INDEX IF NOT EXISTS idx_officials_assets_source ON officials(assets_source);
CREATE INDEX IF NOT EXISTS idx_officials_criminal_cases_source ON officials(criminal_cases_source);

-- Show updated table structure focusing on source columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'officials' AND column_name LIKE '%_source'
ORDER BY column_name;

COMMENT ON COLUMN officials.education_source IS 'Source URL for education data (MyNeta, Wikipedia, etc.)';
COMMENT ON COLUMN officials.assets_source IS 'Source URL for financial assets data';
COMMENT ON COLUMN officials.criminal_cases_source IS 'Source URL for criminal cases data';
COMMENT ON COLUMN officials.political_relatives_source IS 'Source URL for political family information';
COMMENT ON COLUMN officials.family_wealth_source IS 'Source URL for business interests data';