-- Update notifications select policy to allow admin/staff to view all
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "View notifications based on role"
ON public.notifications
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_admin_or_staff(auth.uid())
);