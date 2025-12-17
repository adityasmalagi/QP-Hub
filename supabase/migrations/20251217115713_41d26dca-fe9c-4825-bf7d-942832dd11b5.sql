-- Create table for user follows
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_follows
CREATE POLICY "Users can view their own follows"
ON public.user_follows FOR SELECT
USING (auth.uid() = follower_id);

CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
USING (auth.uid() = follower_id);

CREATE POLICY "Users can see who follows them"
ON public.user_follows FOR SELECT
USING (auth.uid() = following_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications as read"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Allow system to insert notifications (for triggers)
CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create function to notify followers when paper is approved
CREATE OR REPLACE FUNCTION public.notify_followers_on_paper_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uploader_name TEXT;
  follower RECORD;
BEGIN
  -- Only trigger when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get uploader name
    SELECT full_name INTO uploader_name FROM profiles WHERE id = NEW.user_id;
    
    -- Notify all followers
    FOR follower IN SELECT follower_id FROM user_follows WHERE following_id = NEW.user_id
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        follower.follower_id,
        'new_paper',
        'New Paper Upload',
        COALESCE(uploader_name, 'Someone you follow') || ' uploaded a new paper: ' || NEW.title,
        '/paper/' || NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for paper approval notifications
CREATE TRIGGER on_paper_approved
  AFTER INSERT OR UPDATE ON question_papers
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_paper_approval();