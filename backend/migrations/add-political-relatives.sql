-- Add political_relatives column to officials table

-- Add political_relatives column (JSON array of family members in politics)
ALTER TABLE officials 
ADD COLUMN IF NOT EXISTS political_relatives TEXT;

-- Add comment
COMMENT ON COLUMN officials.political_relatives IS 'List of family members who are politicians - Format: "Nara Lokesh (Son, Minister), Nandamuri Balakrishna (Brother-in-law, MLA)"';

-- Update existing records to have default values
UPDATE officials 
SET political_relatives = 'None identified'
WHERE political_relatives IS NULL;
