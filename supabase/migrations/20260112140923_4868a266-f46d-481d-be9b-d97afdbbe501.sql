-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the cleanup function to run every 5 minutes
SELECT cron.schedule(
  'cleanup-old-issues',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://xworhgopytabzldmvkry.supabase.co/functions/v1/cleanup-old-issues',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3b3JoZ29weXRhYnpsZG12a3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNDMxNDcsImV4cCI6MjA3ODYxOTE0N30.b7xPg0Qm2nkUUPAEVpJioeDwHMEeS9_0LZcuGBR0H3E"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);