-- Add is_admin column to users table
ALTER TABLE public.users 
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create function to check if is_admin is being modified
CREATE OR REPLACE FUNCTION public.check_is_admin_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_admin is being changed and user is not service role, prevent update
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Users cannot modify their own admin status';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to protect is_admin column
CREATE TRIGGER protect_is_admin_update
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.check_is_admin_update();

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;