-- Create payouts table to persist payout approvals
CREATE TABLE public.payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL,
  job_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days_worked INTEGER NOT NULL DEFAULT 0,
  total_days INTEGER NOT NULL DEFAULT 0,
  deliverables INTEGER NOT NULL DEFAULT 0,
  target_deliverables INTEGER NOT NULL DEFAULT 0,
  base_pay NUMERIC NOT NULL DEFAULT 0,
  commission NUMERIC NOT NULL DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  total_payout NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Create policies for payouts
CREATE POLICY "Users can view payouts for own jobs"
ON public.payouts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = payouts.job_id 
  AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can create payouts for own jobs"
ON public.payouts
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = payouts.job_id 
  AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can update payouts for own jobs"
ON public.payouts
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = payouts.job_id 
  AND jobs.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payouts_updated_at
BEFORE UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create tasks table for task management
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view own tasks"
ON public.tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
ON public.tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
ON public.tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
ON public.tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();