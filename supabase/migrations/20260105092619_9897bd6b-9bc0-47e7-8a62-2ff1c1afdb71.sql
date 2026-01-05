-- =============================================
-- PHASE 1: Core Engagement Features
-- =============================================

-- Feature 4: Paper Difficulty Rating
-- =============================================

-- Paper ratings table
CREATE TABLE paper_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES question_papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(paper_id, user_id)
);

-- Add average difficulty to question_papers
ALTER TABLE question_papers 
ADD COLUMN IF NOT EXISTS avg_difficulty TEXT,
ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0;

-- Enable RLS on paper_ratings
ALTER TABLE paper_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for paper_ratings
CREATE POLICY "Anyone can view ratings" ON paper_ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can rate papers" ON paper_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON paper_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON paper_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update average difficulty
CREATE OR REPLACE FUNCTION update_paper_difficulty()
RETURNS TRIGGER AS $$
DECLARE
  easy_count INTEGER;
  medium_count INTEGER;
  hard_count INTEGER;
  total_count INTEGER;
  new_difficulty TEXT;
BEGIN
  -- Get counts for each difficulty level
  SELECT 
    COUNT(*) FILTER (WHERE difficulty = 'easy'),
    COUNT(*) FILTER (WHERE difficulty = 'medium'),
    COUNT(*) FILTER (WHERE difficulty = 'hard'),
    COUNT(*)
  INTO easy_count, medium_count, hard_count, total_count
  FROM paper_ratings
  WHERE paper_id = COALESCE(NEW.paper_id, OLD.paper_id);

  -- Determine average difficulty based on majority
  IF total_count = 0 THEN
    new_difficulty := NULL;
  ELSIF hard_count >= medium_count AND hard_count >= easy_count THEN
    new_difficulty := 'hard';
  ELSIF medium_count >= easy_count THEN
    new_difficulty := 'medium';
  ELSE
    new_difficulty := 'easy';
  END IF;

  -- Update the paper
  UPDATE question_papers
  SET avg_difficulty = new_difficulty, ratings_count = total_count
  WHERE id = COALESCE(NEW.paper_id, OLD.paper_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update difficulty on rating changes
CREATE TRIGGER trigger_update_paper_difficulty
AFTER INSERT OR UPDATE OR DELETE ON paper_ratings
FOR EACH ROW EXECUTE FUNCTION update_paper_difficulty();

-- Feature 1: AI Study Assistant
-- =============================================

-- AI conversations table
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  paper_id UUID REFERENCES question_papers(id) ON DELETE SET NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI messages table
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_conversations
CREATE POLICY "Users can view their own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for ai_messages
CREATE POLICY "Users can view messages in their conversations" ON ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE id = ai_messages.conversation_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE id = ai_messages.conversation_id 
      AND user_id = auth.uid()
    )
  );

-- Function to calculate trending score for papers
CREATE OR REPLACE FUNCTION calculate_trending_score(p_paper_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  recent_views INTEGER;
  recent_downloads INTEGER;
BEGIN
  -- Views in last 7 days
  SELECT COUNT(*) INTO recent_views FROM paper_metric_events 
  WHERE paper_id = p_paper_id AND event_type = 'view' 
  AND created_at > NOW() - INTERVAL '7 days';
  
  -- Downloads in last 7 days (weighted 3x)
  SELECT COUNT(*) INTO recent_downloads FROM paper_metric_events 
  WHERE paper_id = p_paper_id AND event_type = 'download' 
  AND created_at > NOW() - INTERVAL '7 days';
  
  RETURN recent_views + (recent_downloads * 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;