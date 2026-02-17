-- Link transactions to the import job that created them
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS import_job_id uuid REFERENCES import_jobs(id);

-- Add rolled_back status
ALTER TABLE import_jobs DROP CONSTRAINT IF EXISTS valid_job_status;
ALTER TABLE import_jobs ADD CONSTRAINT valid_job_status CHECK (status IN ('pending','processing','completed','failed','rolled_back'));
