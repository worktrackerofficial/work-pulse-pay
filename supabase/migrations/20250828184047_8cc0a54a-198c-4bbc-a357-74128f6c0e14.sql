-- Create enum types
CREATE TYPE public.job_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
CREATE TYPE public.worker_status AS ENUM ('active', 'inactive', 'terminated');
CREATE TYPE public.pay_structure AS ENUM ('commission', 'flat', 'commission_adjusted', 'hourly');
CREATE TYPE public.deliverable_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'partial');

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    deliverable_type TEXT NOT NULL,
    deliverable_frequency deliverable_frequency NOT NULL DEFAULT 'daily',
    target_deliverable INTEGER NOT NULL DEFAULT 0,
    pay_structure pay_structure NOT NULL DEFAULT 'commission',
    commission_per_item DECIMAL(10,2) DEFAULT 0,
    flat_rate DECIMAL(10,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    payment_frequency TEXT DEFAULT 'Weekly',
    excluded_days TEXT[] DEFAULT '{}',
    status job_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workers table
CREATE TABLE public.workers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    status worker_status NOT NULL DEFAULT 'active',
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_workers junction table
CREATE TABLE public.job_workers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(job_id, worker_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(job_id, worker_id, attendance_date)
);

-- Create deliverables table
CREATE TABLE public.deliverables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    deliverable_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(job_id, worker_id, deliverable_date)
);

-- Create activity_logs table for dashboard
CREATE TABLE public.activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_name TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - adjust based on auth requirements)
CREATE POLICY "Enable all operations for jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for job_workers" ON public.job_workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for deliverables" ON public.deliverables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workers_updated_at
    BEFORE UPDATE ON public.workers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.jobs (name, industry, description, start_date, end_date, deliverable_type, deliverable_frequency, target_deliverable, pay_structure, commission_per_item, payment_frequency, excluded_days) VALUES
('Warehouse Team Alpha', 'Manufacturing', 'Processing and packaging items for delivery', '2024-01-15', '2024-03-15', 'Daily Items', 'daily', 150, 'commission', 2.50, 'Weekly', ARRAY['Sunday']),
('Delivery Squad Beta', 'Logistics', 'Package delivery and distribution', '2024-02-01', '2024-04-30', 'Weekly Deliveries', 'weekly', 50, 'commission', 25.00, 'Weekly', ARRAY['Sunday']),
('Customer Support Team', 'Service', 'Customer service and support tickets', '2024-01-01', '2024-12-31', 'Monthly Tickets', 'monthly', 200, 'hourly', 0, 'Bi-weekly', ARRAY['Saturday', 'Sunday']);

INSERT INTO public.workers (name, email, phone, role, department, join_date) VALUES
('John Smith', 'john.smith@company.com', '+1 (555) 123-4567', 'Warehouse Operator', 'Manufacturing', '2024-01-15'),
('Sarah Johnson', 'sarah.j@company.com', '+1 (555) 234-5678', 'Delivery Driver', 'Logistics', '2024-02-01'),
('Mike Chen', 'mike.chen@company.com', '+1 (555) 345-6789', 'Support Agent', 'Customer Service', '2024-01-20'),
('Emily Davis', 'emily.davis@company.com', '+1 (555) 456-7890', 'Quality Inspector', 'Manufacturing', '2023-11-10'),
('John Doe', 'john.doe@company.com', '+1 (555) 567-8901', 'Packer', 'Manufacturing', '2024-01-15'),
('Jane Smith', 'jane.smith@company.com', '+1 (555) 678-9012', 'Quality Check', 'Manufacturing', '2024-01-16'),
('Mike Johnson', 'mike.johnson@company.com', '+1 (555) 789-0123', 'Supervisor', 'Manufacturing', '2024-01-15');

-- Assign workers to jobs
INSERT INTO public.job_workers (job_id, worker_id) 
SELECT j.id, w.id FROM public.jobs j, public.workers w 
WHERE j.name = 'Warehouse Team Alpha' AND w.name IN ('John Smith', 'John Doe', 'Jane Smith', 'Mike Johnson');

INSERT INTO public.job_workers (job_id, worker_id) 
SELECT j.id, w.id FROM public.jobs j, public.workers w 
WHERE j.name = 'Delivery Squad Beta' AND w.name = 'Sarah Johnson';

INSERT INTO public.job_workers (job_id, worker_id) 
SELECT j.id, w.id FROM public.jobs j, public.workers w 
WHERE j.name = 'Customer Support Team' AND w.name = 'Mike Chen';

-- Insert some sample activity logs
INSERT INTO public.activity_logs (action, entity_type, entity_name) VALUES
('New job created', 'job', 'Warehouse Team Alpha'),
('Attendance recorded', 'worker', 'John Smith'),
('Payout processed', 'payout', '$2,340'),
('Worker added', 'worker', 'Sarah Johnson');