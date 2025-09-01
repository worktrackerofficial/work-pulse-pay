-- First, we need to create a profiles table to link users to data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profile policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add user_id column to main tables to link data to users
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing data to have a user_id (this will set all existing data to null for now)
-- Users will need to recreate their data or we can assign to first user

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Enable all operations for jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable all operations for workers" ON public.workers;
DROP POLICY IF EXISTS "Enable all operations for attendance" ON public.attendance;
DROP POLICY IF EXISTS "Enable all operations for deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Enable all operations for job_workers" ON public.job_workers;
DROP POLICY IF EXISTS "Enable all operations for activity_logs" ON public.activity_logs;

-- Create proper user-specific policies for jobs
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON public.jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Create proper user-specific policies for workers
CREATE POLICY "Users can view own workers" ON public.workers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workers" ON public.workers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workers" ON public.workers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workers" ON public.workers
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for attendance (based on job ownership)
CREATE POLICY "Users can view attendance for own jobs" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = attendance.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attendance for own jobs" ON public.attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = attendance.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update attendance for own jobs" ON public.attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = attendance.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attendance for own jobs" ON public.attendance
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = attendance.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Create policies for deliverables (based on job ownership)
CREATE POLICY "Users can view deliverables for own jobs" ON public.deliverables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = deliverables.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create deliverables for own jobs" ON public.deliverables
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = deliverables.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update deliverables for own jobs" ON public.deliverables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = deliverables.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete deliverables for own jobs" ON public.deliverables
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = deliverables.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Create policies for job_workers (based on job ownership)
CREATE POLICY "Users can view job_workers for own jobs" ON public.job_workers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_workers.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create job_workers for own jobs" ON public.job_workers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_workers.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update job_workers for own jobs" ON public.job_workers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_workers.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete job_workers for own jobs" ON public.job_workers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_workers.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Create policies for activity_logs (users can only see their own activity)
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
  FOR SELECT USING (
    entity_type IN ('job', 'worker') AND
    (
      (entity_type = 'job' AND EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE jobs.id = activity_logs.entity_id::uuid 
        AND jobs.user_id = auth.uid()
      )) OR
      (entity_type = 'worker' AND EXISTS (
        SELECT 1 FROM public.workers 
        WHERE workers.id = activity_logs.entity_id::uuid 
        AND workers.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can create activity logs for own entities" ON public.activity_logs
  FOR INSERT WITH CHECK (
    entity_type IN ('job', 'worker') AND
    (
      (entity_type = 'job' AND EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE jobs.id = activity_logs.entity_id::uuid 
        AND jobs.user_id = auth.uid()
      )) OR
      (entity_type = 'worker' AND EXISTS (
        SELECT 1 FROM public.workers 
        WHERE workers.id = activity_logs.entity_id::uuid 
        AND workers.user_id = auth.uid()
      ))
    )
  );

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();