-- Add profile image URL column to officials table
-- Images will be fetched from MyNeta.info or Wikipedia

ALTER TABLE officials 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

COMMENT ON COLUMN officials.profile_image_url IS 
'URL to politician profile image from MyNeta.info or Wikipedia';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_officials_image 
ON officials(profile_image_url) 
WHERE profile_image_url IS NOT NULL;
