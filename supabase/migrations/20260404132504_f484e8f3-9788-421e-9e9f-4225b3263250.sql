
-- Fix 1: Restrict group_invites SELECT to admins only + create RPC for invite lookup by code
DROP POLICY IF EXISTS "Anyone can view active invites" ON public.group_invites;

CREATE POLICY "Group admins can view invites"
  ON public.group_invites FOR SELECT
  TO authenticated
  USING (is_group_admin(auth.uid(), group_id));

-- Create a secure function to look up a single invite by code (for join flow)
CREATE OR REPLACE FUNCTION public.lookup_invite_by_code(p_invite_code text)
RETURNS TABLE (
  id uuid,
  group_id uuid,
  invite_code text,
  expires_at timestamptz,
  max_uses int,
  use_count int,
  is_active boolean,
  group_name text,
  group_description text,
  group_subject text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gi.id,
    gi.group_id,
    gi.invite_code,
    gi.expires_at,
    gi.max_uses,
    gi.use_count,
    gi.is_active,
    sg.name AS group_name,
    sg.description AS group_description,
    sg.subject AS group_subject
  FROM public.group_invites gi
  JOIN public.study_groups sg ON sg.id = gi.group_id
  WHERE gi.invite_code = p_invite_code
    AND gi.is_active = true;
END;
$$;

-- Fix 2: Fix broken study_groups delete policy (self-referencing bug)
DROP POLICY IF EXISTS "Group owners can delete groups" ON public.study_groups;

CREATE POLICY "Group owners can delete groups"
  ON public.study_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.user_id = auth.uid()
        AND group_members.group_id = study_groups.id
        AND group_members.role = 'owner'
    )
  );
