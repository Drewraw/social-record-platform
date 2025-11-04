-- Add missing columns to align with frontend requirements
-- Missing fields: source_of_wealth, conviction_status, party_switches, career_highlight

ALTER TABLE officials ADD COLUMN IF NOT EXISTS source_of_wealth TEXT;
ALTER TABLE officials ADD COLUMN IF NOT EXISTS source_of_wealth_source TEXT;
ALTER TABLE officials ADD COLUMN IF NOT EXISTS conviction_status TEXT;
ALTER TABLE officials ADD COLUMN IF NOT EXISTS conviction_status_source TEXT;
ALTER TABLE officials ADD COLUMN IF NOT EXISTS career_highlight TEXT;
ALTER TABLE officials ADD COLUMN IF NOT EXISTS career_highlight_source TEXT;

-- Note: We already have political_switches which serves the same purpose as party_switches
-- But let's add party_switches as an alias or separate field if needed
ALTER TABLE officials ADD COLUMN IF NOT EXISTS party_switches TEXT;
ALTER TABLE officials ADD COLUMN IF NOT EXISTS party_switches_source TEXT;

-- Update existing data to copy political_switches to party_switches for consistency
UPDATE officials SET party_switches = political_switches WHERE political_switches IS NOT NULL;
UPDATE officials SET party_switches_source = political_switches_source WHERE political_switches_source IS NOT NULL;

-- Display updated schema summary
SELECT 
    'source_of_wealth' as field_name,
    CASE WHEN column_name = 'source_of_wealth' THEN '✅ Added' ELSE '❌ Missing' END as status
FROM information_schema.columns 
WHERE table_name = 'officials' AND column_name = 'source_of_wealth'
UNION ALL
SELECT 
    'conviction_status' as field_name,
    CASE WHEN column_name = 'conviction_status' THEN '✅ Added' ELSE '❌ Missing' END as status
FROM information_schema.columns 
WHERE table_name = 'officials' AND column_name = 'conviction_status'
UNION ALL
SELECT 
    'career_highlight' as field_name,
    CASE WHEN column_name = 'career_highlight' THEN '✅ Added' ELSE '❌ Missing' END as status
FROM information_schema.columns 
WHERE table_name = 'officials' AND column_name = 'career_highlight'
UNION ALL
SELECT 
    'party_switches' as field_name,
    CASE WHEN column_name = 'party_switches' THEN '✅ Added' ELSE '❌ Missing' END as status
FROM information_schema.columns 
WHERE table_name = 'officials' AND column_name = 'party_switches';