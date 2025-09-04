-- Create team_deliverables table for pool commission jobs
CREATE TABLE public.team_deliverables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    deliverable_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(job_id, deliverable_date)
);

-- Enable RLS
ALTER TABLE public.team_deliverables ENABLE ROW LEVEL SECURITY;

-- Create policies for team_deliverables (based on job ownership)
CREATE POLICY "Users can view team_deliverables for own jobs" ON public.team_deliverables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = team_deliverables.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create team_deliverables for own jobs" ON public.team_deliverables
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = team_deliverables.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team_deliverables for own jobs" ON public.team_deliverables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = team_deliverables.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete team_deliverables for own jobs" ON public.team_deliverables
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = team_deliverables.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at (function already exists from earlier migration)
CREATE TRIGGER update_team_deliverables_updated_at
    BEFORE UPDATE ON public.team_deliverables
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
