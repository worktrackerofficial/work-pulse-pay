-- Fix data integrity issue where some jobs have null user_id
-- First, let's add a NOT NULL constraint to prevent future null user_ids
ALTER TABLE jobs ALTER COLUMN user_id SET NOT NULL;

-- Also fix workers table to ensure user_id is not null
ALTER TABLE workers ALTER COLUMN user_id SET NOT NULL;

-- Let's also add some constraints to ensure data integrity
-- Add a constraint to ensure attendance dates are not in the future
ALTER TABLE attendance ADD CONSTRAINT attendance_date_not_future 
CHECK (attendance_date <= CURRENT_DATE);

-- Add a constraint to ensure deliverable dates are not in the future  
ALTER TABLE deliverables ADD CONSTRAINT deliverable_date_not_future 
CHECK (deliverable_date <= CURRENT_DATE);