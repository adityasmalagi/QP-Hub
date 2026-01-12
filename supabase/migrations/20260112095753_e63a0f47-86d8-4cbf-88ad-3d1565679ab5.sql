-- =============================================
-- MEDIUM PRIORITY FEATURES DATABASE MIGRATION
-- =============================================

-- 1. Paper Votes Table (Upvote/Downvote System)
CREATE TABLE public.paper_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.question_papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(paper_id, user_id)
);

-- Add vote columns to question_papers
ALTER TABLE public.question_papers 
ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;

-- Enable RLS on paper_votes
ALTER TABLE public.paper_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for paper_votes
CREATE POLICY "Anyone can view votes" ON public.paper_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.paper_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.paper_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.paper_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update vote counts
CREATE OR REPLACE FUNCTION public.update_paper_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE public.question_papers SET upvotes_count = upvotes_count + 1, quality_score = quality_score + 1 WHERE id = NEW.paper_id;
    ELSE
      UPDATE public.question_papers SET downvotes_count = downvotes_count + 1, quality_score = quality_score - 1 WHERE id = NEW.paper_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE public.question_papers SET upvotes_count = GREATEST(0, upvotes_count - 1), quality_score = quality_score - 1 WHERE id = OLD.paper_id;
    ELSE
      UPDATE public.question_papers SET downvotes_count = GREATEST(0, downvotes_count - 1), quality_score = quality_score + 1 WHERE id = OLD.paper_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote change
    IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
      UPDATE public.question_papers SET upvotes_count = GREATEST(0, upvotes_count - 1), downvotes_count = downvotes_count + 1, quality_score = quality_score - 2 WHERE id = NEW.paper_id;
    ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
      UPDATE public.question_papers SET downvotes_count = GREATEST(0, downvotes_count - 1), upvotes_count = upvotes_count + 1, quality_score = quality_score + 2 WHERE id = NEW.paper_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_paper_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.paper_votes
FOR EACH ROW EXECUTE FUNCTION public.update_paper_vote_counts();

-- 2. Reports Table (Moderation)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('paper', 'user', 'comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 3. User Activities Table (Activity Feed)
CREATE TABLE public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('upload', 'comment', 'vote', 'bookmark', 'download', 'follow')),
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activities" ON public.user_activities
  FOR SELECT USING (true);

CREATE POLICY "System can insert activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Badge Definitions Table
CREATE TABLE public.badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default badges
INSERT INTO public.badge_definitions (id, name, description, icon, tier, requirement_type, requirement_value) VALUES
  ('bronze_contributor', 'Bronze Contributor', 'Uploaded 5 or more papers', 'medal', 'bronze', 'uploads', 5),
  ('silver_contributor', 'Silver Contributor', 'Uploaded 15 or more papers', 'medal', 'silver', 'uploads', 15),
  ('gold_contributor', 'Gold Contributor', 'Uploaded 30 or more papers', 'medal', 'gold', 'uploads', 30),
  ('platinum_contributor', 'Platinum Contributor', 'Uploaded 50 or more papers', 'medal', 'platinum', 'uploads', 50),
  ('helping_hand', 'Helping Hand', 'Your papers have been downloaded 100+ times', 'hand-helping', 'silver', 'downloads_received', 100),
  ('quality_star', 'Quality Star', 'Received 50+ upvotes on your papers', 'star', 'gold', 'upvotes_received', 50),
  ('community_leader', 'Community Leader', 'Have 10+ followers', 'users', 'silver', 'followers', 10);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badge definitions" ON public.badge_definitions
  FOR SELECT USING (true);

-- 5. User Badges Table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user badges" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "System can grant badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Study Plans Table
CREATE TABLE public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_exam TEXT,
  target_date DATE,
  subjects TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_plans_user_id ON public.study_plans(user_id);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans" ON public.study_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plans" ON public.study_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" ON public.study_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans" ON public.study_plans
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Study Plan Items Table
CREATE TABLE public.study_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES public.question_papers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  day_number INTEGER,
  scheduled_date DATE,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_plan_items_plan_id ON public.study_plan_items(plan_id);

ALTER TABLE public.study_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their plan items" ON public.study_plan_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.study_plans WHERE id = plan_id AND user_id = auth.uid()));

CREATE POLICY "Users can create plan items" ON public.study_plan_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.study_plans WHERE id = plan_id AND user_id = auth.uid()));

CREATE POLICY "Users can update plan items" ON public.study_plan_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.study_plans WHERE id = plan_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete plan items" ON public.study_plan_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.study_plans WHERE id = plan_id AND user_id = auth.uid()));

-- Function to log activities automatically
CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'question_papers' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.user_activities (user_id, activity_type, target_type, target_id, metadata)
    VALUES (NEW.user_id, 'upload', 'paper', NEW.id, jsonb_build_object('title', NEW.title, 'subject', NEW.subject));
  ELSIF TG_TABLE_NAME = 'paper_comments' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.user_activities (user_id, activity_type, target_type, target_id, metadata)
    VALUES (NEW.user_id, 'comment', 'paper', NEW.paper_id, jsonb_build_object('content', LEFT(NEW.content, 100)));
  ELSIF TG_TABLE_NAME = 'paper_votes' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.user_activities (user_id, activity_type, target_type, target_id, metadata)
    VALUES (NEW.user_id, 'vote', 'paper', NEW.paper_id, jsonb_build_object('vote_type', NEW.vote_type));
  ELSIF TG_TABLE_NAME = 'user_follows' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.user_activities (user_id, activity_type, target_type, target_id, metadata)
    VALUES (NEW.follower_id, 'follow', 'user', NEW.following_id, '{}'::jsonb);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for activity logging
CREATE TRIGGER trigger_log_paper_upload
AFTER INSERT ON public.question_papers
FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER trigger_log_comment
AFTER INSERT ON public.paper_comments
FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER trigger_log_vote
AFTER INSERT ON public.paper_votes
FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER trigger_log_follow
AFTER INSERT ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();