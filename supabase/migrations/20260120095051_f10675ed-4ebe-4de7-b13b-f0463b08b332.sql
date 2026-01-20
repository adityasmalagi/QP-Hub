-- Drop the existing overly permissive policy that allows anyone (including unauthenticated users) to view public profiles
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.public_profiles;

-- Create a new policy that restricts SELECT to authenticated users only
CREATE POLICY "Authenticated users can view public profiles"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (true);