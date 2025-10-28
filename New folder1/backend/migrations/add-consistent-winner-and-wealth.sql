-- Add consistent_winner and family_wealth columns to officials table

-- Add consistent_winner column
ALTER TABLE officials 
ADD COLUMN IF NOT EXISTS consistent_winner TEXT;

-- Add family_wealth column (original family background)
ALTER TABLE officials 
ADD COLUMN IF NOT EXISTS family_wealth VARCHAR(100);

-- Add current_wealth column (current net worth from MyNeta)
ALTER TABLE officials 
ADD COLUMN IF NOT EXISTS current_wealth VARCHAR(100);

-- Add knowledgeful column (based on education and welfare schemes)
ALTER TABLE officials 
ADD COLUMN IF NOT EXISTS knowledgeful TEXT;

-- Add comments
COMMENT ON COLUMN officials.consistent_winner IS 'Whether politician has consistently won elections over time (e.g., "Consistent winner - MLA for 15+ years")';
COMMENT ON COLUMN officials.family_wealth IS 'Original family wealth background before politics (Wealthy/Not wealthy based on ₹2 crore threshold)';
COMMENT ON COLUMN officials.current_wealth IS 'Current net worth from MyNeta affidavit (Wealthy/Not wealthy based on ₹2 crore threshold)';
COMMENT ON COLUMN officials.knowledgeful IS 'Whether politician is knowledgeable based on education and welfare schemes (Knowledgeable/Not knowledgeable)';

-- Update existing records to have default values
UPDATE officials 
SET consistent_winner = 'To be verified',
    family_wealth = 'Unknown',
    current_wealth = 'Unknown',
    knowledgeful = 'To be verified'
WHERE consistent_winner IS NULL OR family_wealth IS NULL OR current_wealth IS NULL OR knowledgeful IS NULL;
