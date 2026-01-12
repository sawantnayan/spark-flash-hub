-- Create maintenance_logs table to track maintenance history
CREATE TABLE public.maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  computer_id UUID NOT NULL REFERENCES public.computers(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  parts_replaced TEXT,
  cost DECIMAL(10, 2),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view maintenance logs"
ON public.maintenance_logs
FOR SELECT
USING (true);

CREATE POLICY "Admin and staff can manage maintenance logs"
ON public.maintenance_logs
FOR ALL
USING (is_admin_or_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_maintenance_logs_updated_at
BEFORE UPDATE ON public.maintenance_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_maintenance_logs_computer ON public.maintenance_logs(computer_id);
CREATE INDEX idx_maintenance_logs_performed_by ON public.maintenance_logs(performed_by);