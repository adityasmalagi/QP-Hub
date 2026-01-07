-- Fix the infinite recursion in group_members RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can join public groups" ON group_members;
DROP POLICY IF EXISTS "Members can leave groups" ON group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON group_members;

-- Recreate with proper non-recursive conditions
-- View policy: use a simple check without recursion
CREATE POLICY "Members can view group members" ON group_members
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM study_groups sg 
    WHERE sg.id = group_members.group_id 
    AND (sg.is_public = true OR sg.created_by = auth.uid())
  )
);

-- Join policy: allow joining public groups (checking study_groups directly, not group_members)
CREATE POLICY "Users can join public groups" ON group_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  role = 'member' AND
  EXISTS (
    SELECT 1 FROM study_groups sg 
    WHERE sg.id = group_members.group_id 
    AND sg.is_public = true
  )
);

-- Leave policy: users can delete their own membership
CREATE POLICY "Members can leave groups" ON group_members
FOR DELETE USING (user_id = auth.uid());

-- Admin management: group owners/admins can manage (check via study_groups.created_by)
CREATE POLICY "Admins can manage members" ON group_members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM study_groups sg 
    WHERE sg.id = group_members.group_id 
    AND sg.created_by = auth.uid()
  )
);

-- Also add policy for owners to add members (for invite functionality)
CREATE POLICY "Owners can add members" ON group_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM study_groups sg 
    WHERE sg.id = group_members.group_id 
    AND sg.created_by = auth.uid()
  )
);