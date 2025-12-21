-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- Allow users to delete their own role
CREATE POLICY "Users can delete own role" 
ON public.user_roles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow users to delete their own issues
CREATE POLICY "Users can delete their own issues" 
ON public.issues 
FOR DELETE 
USING (auth.uid() = reported_by);

-- Allow users to delete their own session logs
CREATE POLICY "Users can delete their own session logs" 
ON public.session_logs 
FOR DELETE 
USING (auth.uid() = user_id);