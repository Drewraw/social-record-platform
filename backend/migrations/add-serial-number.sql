-- Add serial_number column to officials table

ALTER TABLE officials
ADD COLUMN IF NOT EXISTS serial_number INTEGER;

-- Add comment
COMMENT ON COLUMN officials.serial_number IS 'Sequential number for officials (used for ordering and identification)';
