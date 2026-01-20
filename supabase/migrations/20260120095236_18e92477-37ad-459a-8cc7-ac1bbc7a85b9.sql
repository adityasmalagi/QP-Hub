-- Fix 1: User activities table - restrict to authenticated users only viewing their own activities
DROP POLICY IF EXISTS "Anyone can view activities" ON public.user_activities;

CREATE POLICY "Users can view their own activities"
ON public.user_activities
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix 2: Group members table - only allow viewing members if user is a member of the group
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;

CREATE POLICY "Members can view group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  -- User can see their own membership record
  user_id = auth.uid() 
  OR 
  -- User can see other members only if they are also a member of the same group
  is_group_member(auth.uid(), group_id)
);

-- Fix 3: User badges - only allow system/triggers to grant badges, not users themselves
DROP POLICY IF EXISTS "System can grant badges" ON public.user_badges;

-- Create a SECURITY DEFINER function to grant badges that will be used by triggers
CREATE OR REPLACE FUNCTION public.grant_user_badge(_user_id uuid, _badge_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (_user_id, _badge_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- No INSERT policy for user_badges - only system functions can insert
-- This prevents users from granting themselves badges