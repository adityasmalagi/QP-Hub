-- Add new profile fields for educational information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS class_level text,
ADD COLUMN IF NOT EXISTS board text,
ADD COLUMN IF NOT EXISTS year integer,
ADD COLUMN IF NOT EXISTS course text,
ADD COLUMN IF NOT EXISTS semester integer;