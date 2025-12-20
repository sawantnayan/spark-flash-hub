-- Drop existing select policy and create one that allows admin/staff to see all
DROP POLICY IF EXISTS "Anyone can view active lab notices" ON public.lab_notices;

-- Create new policy: admin/staff see all, others see only active
CREATE POLICY "View lab notices based on role"
ON public.lab_notices
FOR SELECT
USING (
  is_active = true 
  OR is_admin_or_staff(auth.uid())
);