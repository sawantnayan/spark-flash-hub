-- Add RLS policies for notifications table
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admin and staff can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin and staff can delete notifications"
ON public.notifications
FOR DELETE
USING (is_admin_or_staff(auth.uid()));

-- Add RLS policies for lab_notices table
CREATE POLICY "Anyone can view active lab notices"
ON public.lab_notices
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin and staff can manage lab notices"
ON public.lab_notices
FOR ALL
USING (is_admin_or_staff(auth.uid()));