-- Function to check service status
-- This can be executed in the Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.get_service_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'status', 'ok',
    'timestamp', extract(epoch from now()),
    'version', '1.0.0'
  );
END;
$$;
