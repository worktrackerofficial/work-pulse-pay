-- Add commission_pool field to jobs table for team commission payment structure
ALTER TABLE jobs ADD COLUMN commission_pool DECIMAL(10,2) DEFAULT 0.00;

-- Add comment to describe the field
COMMENT ON COLUMN jobs.commission_pool IS 'Total commission pool for team-based commission payment structure';
