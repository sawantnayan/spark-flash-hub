
-- Create a trigger function that auto-creates session_logs when a booking is confirmed
CREATE OR REPLACE FUNCTION public.create_session_from_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When booking status changes to 'confirmed', create a session log
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO public.session_logs (user_id, computer_id, login_time, logout_time, duration_minutes)
    VALUES (
      NEW.user_id,
      NEW.computer_id,
      NEW.start_time,
      NEW.end_time,
      EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger on bookings table
CREATE TRIGGER on_booking_confirmed
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_session_from_booking();

-- Also allow students to insert their own session logs (for self-tracking)
CREATE POLICY "Users can insert own session logs"
  ON public.session_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
