-- 1. Fix paper_ratings: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.paper_ratings;
CREATE POLICY "Authenticated users can view ratings"
  ON public.paper_ratings FOR SELECT
  TO authenticated
  USING (true);

-- 2. Fix user_roles: add explicit INSERT deny for non-admins
-- The existing "Admins can manage roles" ALL policy covers admin inserts.
-- Add a restrictive policy that blocks non-admin inserts.
CREATE POLICY "Non-admins cannot insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));