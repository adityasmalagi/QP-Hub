-- Add CHECK constraints for server-side input validation on question_papers
ALTER TABLE question_papers ADD CONSTRAINT title_length CHECK (length(title) <= 200 AND length(title) >= 1);
ALTER TABLE question_papers ADD CONSTRAINT description_length CHECK (description IS NULL OR length(description) <= 1000);
ALTER TABLE question_papers ADD CONSTRAINT year_valid CHECK (year >= 1900 AND year <= 2100);
ALTER TABLE question_papers ADD CONSTRAINT semester_valid CHECK (semester IS NULL OR (semester >= 1 AND semester <= 8));
ALTER TABLE question_papers ADD CONSTRAINT internal_number_valid CHECK (internal_number IS NULL OR (internal_number >= 1 AND internal_number <= 3));

-- Add CHECK constraint for profiles full_name
ALTER TABLE profiles ADD CONSTRAINT full_name_length CHECK (full_name IS NULL OR length(full_name) <= 100);

-- Update handle_new_user function to validate and truncate full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id, 
    CASE 
      WHEN new.raw_user_meta_data ->> 'full_name' IS NULL THEN NULL
      WHEN length(new.raw_user_meta_data ->> 'full_name') > 100 
      THEN substring(new.raw_user_meta_data ->> 'full_name', 1, 100)
      ELSE new.raw_user_meta_data ->> 'full_name'
    END
  );
  RETURN new;
END;
$$;