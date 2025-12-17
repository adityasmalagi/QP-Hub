-- Add policy to allow authenticated users to view profile names (for displaying uploader info)
CREATE POLICY "Authenticated users can view profile names"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);