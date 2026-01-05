
-- Solution Papers: Link answer keys to question papers
CREATE TABLE public.solution_papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_paper_id UUID NOT NULL REFERENCES public.question_papers(id) ON DELETE CASCADE,
  solution_file_url TEXT NOT NULL,
  solution_file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  description TEXT,
  is_verified BOOLEAN DEFAULT false,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Solution upvotes
CREATE TABLE public.solution_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solution_id UUID NOT NULL REFERENCES public.solution_papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(solution_id, user_id)
);

-- Paper Requests
CREATE TABLE public.paper_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  class_level TEXT NOT NULL,
  board TEXT NOT NULL,
  year INTEGER,
  exam_type TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'closed')),
  fulfilled_by_paper_id UUID REFERENCES public.question_papers(id) ON DELETE SET NULL,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Request upvotes
CREATE TABLE public.request_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.paper_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Exam Calendar Events
CREATE TABLE public.exam_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  exam_date DATE NOT NULL,
  subject TEXT,
  board TEXT,
  class_level TEXT,
  reminder_days INTEGER[] DEFAULT '{7,1}',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Exam Reminders
CREATE TABLE public.exam_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_event_id UUID NOT NULL REFERENCES public.exam_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reminder_date DATE NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solution_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solution_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_reminders ENABLE ROW LEVEL SECURITY;

-- Solution Papers Policies
CREATE POLICY "Anyone can view solutions" ON public.solution_papers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload solutions" ON public.solution_papers FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update their solutions" ON public.solution_papers FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can delete their solutions" ON public.solution_papers FOR DELETE USING (auth.uid() = uploaded_by);

-- Solution Upvotes Policies
CREATE POLICY "Anyone can view solution upvotes" ON public.solution_upvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upvote" ON public.solution_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their upvotes" ON public.solution_upvotes FOR DELETE USING (auth.uid() = user_id);

-- Paper Requests Policies
CREATE POLICY "Anyone can view requests" ON public.paper_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create requests" ON public.paper_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their requests" ON public.paper_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their requests" ON public.paper_requests FOR DELETE USING (auth.uid() = user_id);

-- Request Upvotes Policies
CREATE POLICY "Anyone can view request upvotes" ON public.request_upvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upvote requests" ON public.request_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove request upvotes" ON public.request_upvotes FOR DELETE USING (auth.uid() = user_id);

-- Exam Events Policies
CREATE POLICY "Users can view their own events" ON public.exam_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own events" ON public.exam_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.exam_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.exam_events FOR DELETE USING (auth.uid() = user_id);

-- Exam Reminders Policies
CREATE POLICY "Users can view their own reminders" ON public.exam_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reminders" ON public.exam_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.exam_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON public.exam_reminders FOR DELETE USING (auth.uid() = user_id);

-- Triggers for upvote counts
CREATE OR REPLACE FUNCTION public.update_solution_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE solution_papers SET upvotes_count = upvotes_count + 1 WHERE id = NEW.solution_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE solution_papers SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = OLD.solution_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_solution_upvote_change
  AFTER INSERT OR DELETE ON public.solution_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.update_solution_upvotes_count();

CREATE OR REPLACE FUNCTION public.update_request_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE paper_requests SET upvotes_count = upvotes_count + 1 WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE paper_requests SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_request_upvote_change
  AFTER INSERT OR DELETE ON public.request_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.update_request_upvotes_count();

-- Function to auto-create reminders when exam event is created
CREATE OR REPLACE FUNCTION public.create_exam_reminders()
RETURNS TRIGGER AS $$
DECLARE
  days_before INTEGER;
BEGIN
  FOREACH days_before IN ARRAY NEW.reminder_days
  LOOP
    INSERT INTO public.exam_reminders (exam_event_id, user_id, reminder_date)
    VALUES (NEW.id, NEW.user_id, NEW.exam_date - days_before);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_exam_event_created
  AFTER INSERT ON public.exam_events
  FOR EACH ROW EXECUTE FUNCTION public.create_exam_reminders();

-- Indexes
CREATE INDEX idx_solution_papers_question ON public.solution_papers(question_paper_id);
CREATE INDEX idx_solution_upvotes_solution ON public.solution_upvotes(solution_id);
CREATE INDEX idx_paper_requests_status ON public.paper_requests(status);
CREATE INDEX idx_paper_requests_user ON public.paper_requests(user_id);
CREATE INDEX idx_request_upvotes_request ON public.request_upvotes(request_id);
CREATE INDEX idx_exam_events_user ON public.exam_events(user_id);
CREATE INDEX idx_exam_events_date ON public.exam_events(exam_date);
CREATE INDEX idx_exam_reminders_date ON public.exam_reminders(reminder_date);
