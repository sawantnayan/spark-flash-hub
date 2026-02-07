-- Update the handle_new_user function to use the role from metadata instead of defaulting to student
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_role app_role;
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.email
    );
    
    -- Get role from metadata, default to student if not provided
    user_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::app_role,
        'student'::app_role
    );
    
    -- Assign role from user metadata
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    RETURN NEW;
END;
$function$;