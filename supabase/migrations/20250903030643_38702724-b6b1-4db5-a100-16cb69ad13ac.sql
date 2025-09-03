-- Delete orphaned records that have no user_id
-- These are test data that can't be properly linked to users
DELETE FROM attendance WHERE job_id IN (SELECT id FROM jobs WHERE user_id IS NULL);
DELETE FROM deliverables WHERE job_id IN (SELECT id FROM jobs WHERE user_id IS NULL);
DELETE FROM deliverables WHERE worker_id IN (SELECT id FROM workers WHERE user_id IS NULL);
DELETE FROM job_workers WHERE job_id IN (SELECT id FROM jobs WHERE user_id IS NULL);
DELETE FROM job_workers WHERE worker_id IN (SELECT id FROM workers WHERE user_id IS NULL);
DELETE FROM payouts WHERE job_id IN (SELECT id FROM jobs WHERE user_id IS NULL);
DELETE FROM payouts WHERE worker_id IN (SELECT id FROM workers WHERE user_id IS NULL);

-- Delete orphaned jobs and workers
DELETE FROM jobs WHERE user_id IS NULL;
DELETE FROM workers WHERE user_id IS NULL;

-- Now add the NOT NULL constraints
ALTER TABLE jobs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE workers ALTER COLUMN user_id SET NOT NULL;