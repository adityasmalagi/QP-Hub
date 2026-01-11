-- Allow everyone (including non-logged-in visitors) to read public profiles
-- so paper cards can display uploader names.

ALTER POLICY "Anyone can view public profiles"
ON public.public_profiles
TO public
USING (true);
