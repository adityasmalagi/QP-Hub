-- Enable realtime for existing tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.paper_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paper_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_upvotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_upvotes;

-- Study Groups table
CREATE TABLE public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  class_level TEXT,
  board TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 50,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Group Members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group Shared Papers table
CREATE TABLE public.group_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  paper_id UUID REFERENCES public.question_papers(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID,
  note TEXT,
  shared_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, paper_id)
);

-- Group Chat Messages table
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'paper_share', 'system')),
  paper_reference_id UUID REFERENCES public.question_papers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;

-- Enable RLS
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Helper function to check group admin/owner
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id AND role IN ('owner', 'admin')
  )
$$;

-- Study Groups RLS policies
CREATE POLICY "Anyone can view public groups"
ON public.study_groups FOR SELECT
USING (is_public = true OR public.is_group_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create groups"
ON public.study_groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
ON public.study_groups FOR UPDATE
USING (public.is_group_admin(auth.uid(), id));

CREATE POLICY "Group owners can delete groups"
ON public.study_groups FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.group_members 
  WHERE user_id = auth.uid() AND group_id = id AND role = 'owner'
));

-- Group Members RLS policies
CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
USING (public.is_group_member(auth.uid(), group_id) OR 
  EXISTS (SELECT 1 FROM public.study_groups WHERE id = group_id AND is_public = true));

CREATE POLICY "Users can join public groups"
ON public.group_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM public.study_groups WHERE id = group_id AND is_public = true) OR
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_members.group_id AND user_id = auth.uid())
  )
);

CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
USING (auth.uid() = user_id OR public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins can update member roles"
ON public.group_members FOR UPDATE
USING (public.is_group_admin(auth.uid(), group_id));

-- Group Papers RLS policies
CREATE POLICY "Members can view group papers"
ON public.group_papers FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can share papers"
ON public.group_papers FOR INSERT
WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = shared_by);

CREATE POLICY "Admins can remove papers"
ON public.group_papers FOR DELETE
USING (public.is_group_admin(auth.uid(), group_id) OR auth.uid() = shared_by);

-- Group Messages RLS policies
CREATE POLICY "Members can view messages"
ON public.group_messages FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can send messages"
ON public.group_messages FOR INSERT
WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
ON public.group_messages FOR DELETE
USING (auth.uid() = user_id OR public.is_group_admin(auth.uid(), group_id));

-- Indexes for performance
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_papers_group ON public.group_papers(group_id);
CREATE INDEX idx_group_messages_group ON public.group_messages(group_id);
CREATE INDEX idx_group_messages_created ON public.group_messages(created_at DESC);
CREATE INDEX idx_study_groups_public ON public.study_groups(is_public) WHERE is_public = true;