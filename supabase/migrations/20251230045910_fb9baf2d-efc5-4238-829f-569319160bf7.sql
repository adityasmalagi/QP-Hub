-- Add columns for multi-file support and file type
ALTER TABLE public.question_papers 
ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'pdf',
ADD COLUMN IF NOT EXISTS additional_file_urls text[] DEFAULT '{}'::text[];