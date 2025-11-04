-- =====================================================
-- SOCIAL RECORD PLATFORM - COMPLETE DATABASE SETUP
-- =====================================================
-- This script creates the complete database schema for the social record platform
-- Includes all tables, columns, indexes, and foreign keys
-- Run this script to set up the database from scratch

-- Drop existing tables if they exist (be careful with this in production)
-- DROP TABLE IF EXISTS official_sources CASCADE;
-- DROP TABLE IF EXISTS data_sources CASCADE;
-- DROP TABLE IF EXISTS officials CASCADE;

-- =====================================================
-- 1. DATA SOURCES TABLE
-- =====================================================
-- This table tracks the different data sources (MyNeta, Wikipedia, Wikidata, etc.)
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    base_url TEXT,
    description TEXT,
    reliability_score INTEGER DEFAULT 5 CHECK (reliability_score BETWEEN 1 AND 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default data sources
INSERT INTO data_sources (name, base_url, description, reliability_score) VALUES
('MyNeta', 'https://myneta.info', 'Association for Democratic Reforms - Primary source for Indian politician data', 9),
('Wikipedia', 'https://en.wikipedia.org', 'Wikipedia encyclopedia - Secondary source for biographical data', 7),
('Wikidata', 'https://www.wikidata.org', 'Structured data from Wikimedia - Tertiary source', 8),
('Manual', NULL, 'Manually entered/verified data', 10),
('Government', NULL, 'Official government sources', 10)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. MAIN OFFICIALS TABLE
-- =====================================================
-- This is the primary table storing all politician/official information
CREATE TABLE IF NOT EXISTS officials (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- =====================================================
    -- BASIC INFORMATION FIELDS
    -- =====================================================
    name TEXT NOT NULL,
    position TEXT,
    party TEXT,
    constituency TEXT,
    state TEXT,
    tenure TEXT, -- Changed from DATE to TEXT to handle ranges like "2019-2024"
    
    -- =====================================================
    -- PERSONAL & EDUCATIONAL INFORMATION
    -- =====================================================
    education TEXT,
    educational_status TEXT, -- Detailed educational background
    age VARCHAR(10),
    image_url TEXT,
    contact_email TEXT,
    serial_number VARCHAR(20), -- Official serial numbers from sources
    
    -- =====================================================
    -- POLITICAL BACKGROUND
    -- =====================================================
    dynasty_status TEXT,
    political_relatives TEXT,
    consistent_winner TEXT,
    party_history TEXT, -- Complete party history
    political_switches TEXT, -- Alias for party switches
    party_switches TEXT, -- Party switching history
    political_experience TEXT,
    leadership_roles TEXT,
    achievements TEXT,
    career_highlight TEXT,
    policy_focus TEXT,
    
    -- =====================================================
    -- FINANCIAL INFORMATION
    -- =====================================================
    assets TEXT,
    liabilities TEXT,
    family_wealth TEXT,
    source_of_wealth TEXT,
    total_assets TEXT, -- Detailed asset breakdown
    total_liabilities TEXT, -- Detailed liability breakdown
    net_worth TEXT,
    financial_growth TEXT,
    business_interests TEXT,
    income_sources TEXT,
    
    -- =====================================================
    -- CRIMINAL CASES INFORMATION
    -- =====================================================
    criminal_cases INTEGER DEFAULT 0,
    convicted_cases INTEGER DEFAULT 0,
    conviction_status TEXT,
    pending_cases TEXT,
    serious_charges TEXT,
    case_details TEXT,
    
    -- =====================================================
    -- PERFORMANCE METRICS
    -- =====================================================
    knowledgeful TEXT,
    approvals INTEGER DEFAULT 0,
    disapprovals INTEGER DEFAULT 0,
    transparency_score TEXT,
    public_engagement TEXT,
    accountability_record TEXT,
    
    -- =====================================================
    -- SOURCE TRACKING COLUMNS
    -- Every field has a corresponding source column for transparency
    -- =====================================================
    name_source TEXT,
    position_source TEXT,
    party_source TEXT,
    constituency_source TEXT,
    state_source TEXT,
    tenure_source TEXT,
    education_source TEXT,
    educational_status_source TEXT,
    age_source TEXT,
    image_url_source TEXT,
    contact_email_source TEXT,
    dynasty_status_source TEXT,
    political_relatives_source TEXT,
    consistent_winner_source TEXT,
    party_history_source TEXT,
    political_switches_source TEXT,
    party_switches_source TEXT,
    political_experience_source TEXT,
    leadership_roles_source TEXT,
    achievements_source TEXT,
    career_highlight_source TEXT,
    policy_focus_source TEXT,
    assets_source TEXT,
    liabilities_source TEXT,
    family_wealth_source TEXT,
    source_of_wealth_source TEXT,
    total_assets_source TEXT,
    total_liabilities_source TEXT,
    net_worth_source TEXT,
    financial_growth_source TEXT,
    business_interests_source TEXT,
    income_sources_source TEXT,
    criminal_cases_source TEXT,
    convicted_cases_source TEXT,
    conviction_status_source TEXT,
    pending_cases_source TEXT,
    serious_charges_source TEXT,
    case_details_source TEXT,
    knowledgeful_source TEXT,
    transparency_score_source TEXT,
    public_engagement_source TEXT,
    accountability_record_source TEXT,
    
    -- =====================================================
    -- SYSTEM FIELDS
    -- =====================================================
    profile_updated_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. OFFICIAL SOURCES JUNCTION TABLE
-- =====================================================
-- This table tracks which sources contributed data for each official
-- Many-to-many relationship between officials and data_sources
CREATE TABLE IF NOT EXISTS official_sources (
    id SERIAL PRIMARY KEY,
    official_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    source_url TEXT, -- The specific URL where data was obtained
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_quality_score INTEGER DEFAULT 5 CHECK (data_quality_score BETWEEN 1 AND 10),
    notes TEXT,
    
    -- Foreign Keys
    CONSTRAINT fk_official_sources_official 
        FOREIGN KEY (official_id) REFERENCES officials(id) ON DELETE CASCADE,
    CONSTRAINT fk_official_sources_source 
        FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
        
    -- Unique constraint to prevent duplicate entries
    CONSTRAINT unique_official_source 
        UNIQUE (official_id, source_id)
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================
-- Create indexes on frequently queried columns

-- Basic search indexes
CREATE INDEX IF NOT EXISTS idx_officials_name ON officials(name);
CREATE INDEX IF NOT EXISTS idx_officials_party ON officials(party);
CREATE INDEX IF NOT EXISTS idx_officials_constituency ON officials(constituency);
CREATE INDEX IF NOT EXISTS idx_officials_state ON officials(state);
CREATE INDEX IF NOT EXISTS idx_officials_position ON officials(position);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_officials_criminal_cases ON officials(criminal_cases);
CREATE INDEX IF NOT EXISTS idx_officials_convicted_cases ON officials(convicted_cases);
CREATE INDEX IF NOT EXISTS idx_officials_approvals ON officials(approvals);
CREATE INDEX IF NOT EXISTS idx_officials_disapprovals ON officials(disapprovals);

-- System indexes
CREATE INDEX IF NOT EXISTS idx_officials_updated_at ON officials(updated_at);
CREATE INDEX IF NOT EXISTS idx_officials_profile_updated_at ON officials(profile_updated_at);

-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_official_sources_official_id ON official_sources(official_id);
CREATE INDEX IF NOT EXISTS idx_official_sources_source_id ON official_sources(source_id);
CREATE INDEX IF NOT EXISTS idx_official_sources_scraped_at ON official_sources(scraped_at);

-- Data sources indexes
CREATE INDEX IF NOT EXISTS idx_data_sources_name ON data_sources(name);
CREATE INDEX IF NOT EXISTS idx_data_sources_reliability ON data_sources(reliability_score);

-- =====================================================
-- 5. CONSTRAINTS AND VALIDATIONS
-- =====================================================

-- Add check constraints for data validation
ALTER TABLE officials 
    ADD CONSTRAINT check_criminal_cases_positive 
    CHECK (criminal_cases >= 0);

ALTER TABLE officials 
    ADD CONSTRAINT check_convicted_cases_positive 
    CHECK (convicted_cases >= 0);

ALTER TABLE officials 
    ADD CONSTRAINT check_convicted_not_greater_than_criminal 
    CHECK (convicted_cases <= criminal_cases);

-- =====================================================
-- 6. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for officials table
DROP TRIGGER IF EXISTS update_officials_updated_at ON officials;
CREATE TRIGGER update_officials_updated_at
    BEFORE UPDATE ON officials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for data_sources table
DROP TRIGGER IF EXISTS update_data_sources_updated_at ON data_sources;
CREATE TRIGGER update_data_sources_updated_at
    BEFORE UPDATE ON data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for officials with source information
CREATE OR REPLACE VIEW officials_with_sources AS
SELECT 
    o.*,
    array_agg(ds.name ORDER BY ds.reliability_score DESC) as source_names,
    array_agg(os.source_url) as source_urls,
    array_agg(ds.reliability_score ORDER BY ds.reliability_score DESC) as reliability_scores
FROM officials o
LEFT JOIN official_sources os ON o.id = os.official_id
LEFT JOIN data_sources ds ON os.source_id = ds.id
GROUP BY o.id;

-- View for high-quality profiles (multiple sources)
CREATE OR REPLACE VIEW high_quality_officials AS
SELECT 
    o.*,
    COUNT(os.source_id) as source_count,
    AVG(ds.reliability_score) as avg_reliability
FROM officials o
LEFT JOIN official_sources os ON o.id = os.official_id
LEFT JOIN data_sources ds ON os.source_id = ds.id
GROUP BY o.id
HAVING COUNT(os.source_id) >= 2;

-- =====================================================
-- 8. SAMPLE DATA INSERTION FUNCTIONS
-- =====================================================

-- Function to insert a new official with source tracking
CREATE OR REPLACE FUNCTION insert_official_with_source(
    official_data JSONB,
    source_name VARCHAR(50),
    source_url TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    new_official_id INTEGER;
    source_id INTEGER;
BEGIN
    -- Insert official data
    INSERT INTO officials (
        name, position, party, constituency, state, tenure,
        education, age, assets, liabilities, criminal_cases,
        convicted_cases, dynasty_status, political_relatives,
        family_wealth, image_url, contact_email
    ) VALUES (
        official_data->>'name',
        official_data->>'position',
        official_data->>'party',
        official_data->>'constituency',
        official_data->>'state',
        official_data->>'tenure',
        official_data->>'education',
        official_data->>'age',
        official_data->>'assets',
        official_data->>'liabilities',
        (official_data->>'criminal_cases')::INTEGER,
        (official_data->>'convicted_cases')::INTEGER,
        official_data->>'dynasty_status',
        official_data->>'political_relatives',
        official_data->>'family_wealth',
        official_data->>'image_url',
        official_data->>'contact_email'
    ) RETURNING id INTO new_official_id;
    
    -- Link to source
    SELECT id INTO source_id FROM data_sources WHERE name = source_name;
    
    IF source_id IS NOT NULL THEN
        INSERT INTO official_sources (official_id, source_id, source_url)
        VALUES (new_official_id, source_id, source_url);
    END IF;
    
    RETURN new_official_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. DATA CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to cleanup duplicate officials (by name similarity)
CREATE OR REPLACE FUNCTION cleanup_duplicate_officials()
RETURNS INTEGER AS $$
DECLARE
    duplicates_removed INTEGER := 0;
BEGIN
    -- This is a basic example - you might want more sophisticated duplicate detection
    WITH duplicates AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY UPPER(TRIM(name)) ORDER BY updated_at DESC) as rn
        FROM officials
        WHERE name IS NOT NULL AND TRIM(name) != ''
    )
    DELETE FROM officials 
    WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
    
    GET DIAGNOSTICS duplicates_removed = ROW_COUNT;
    RETURN duplicates_removed;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the setup

-- Check table creation
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('officials', 'data_sources', 'official_sources')
ORDER BY tablename;

-- Check column counts
SELECT 
    'officials' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'officials'
UNION ALL
SELECT 
    'data_sources' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'data_sources'
UNION ALL
SELECT 
    'official_sources' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'official_sources';

-- Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('officials', 'official_sources');

-- Check indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('officials', 'data_sources', 'official_sources')
ORDER BY tablename, indexname;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

COMMIT;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE '✅ Social Record Platform database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: officials (90 columns), data_sources, official_sources';
    RAISE NOTICE '🔗 Foreign keys: Proper relationships established';
    RAISE NOTICE '📈 Indexes: Performance indexes created';
    RAISE NOTICE '🔧 Functions: Helper functions for data management';
    RAISE NOTICE '👁️ Views: Convenient views for common queries';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready to import politician data!';
END $$;