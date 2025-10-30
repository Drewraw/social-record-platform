-- Increase column sizes for wealth and knowledge fields

ALTER TABLE officials 
ALTER COLUMN current_wealth TYPE TEXT;

ALTER TABLE officials 
ALTER COLUMN knowledgeful TYPE TEXT;

ALTER TABLE officials 
ALTER COLUMN dynasty_status TYPE TEXT;

COMMENT ON COLUMN officials.current_wealth IS 'Wealth category and details';
COMMENT ON COLUMN officials.knowledgeful IS 'Knowledge status and education details';
COMMENT ON COLUMN officials.dynasty_status IS 'Dynasty status with relationship details';
