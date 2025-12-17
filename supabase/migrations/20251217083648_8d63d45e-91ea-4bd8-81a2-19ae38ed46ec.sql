-- Add age column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age integer;

-- Add semester and internal_number columns to question_papers
ALTER TABLE public.question_papers ADD COLUMN IF NOT EXISTS semester integer;
ALTER TABLE public.question_papers ADD COLUMN IF NOT EXISTS internal_number integer;

-- Create user_downloads table for tracking downloads
CREATE TABLE IF NOT EXISTS public.user_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  paper_id uuid NOT NULL REFERENCES public.question_papers(id) ON DELETE CASCADE,
  downloaded_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, paper_id)
);

-- Enable RLS on user_downloads
ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_downloads
CREATE POLICY "Users can view their own downloads" 
ON public.user_downloads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own downloads" 
ON public.user_downloads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own downloads" 
ON public.user_downloads 
FOR DELETE 
USING (auth.uid() = user_id);