
-- Update question_papers RLS to only allow authenticated users to view papers
DROP POLICY IF EXISTS "Anyone can view papers" ON public.question_papers;

CREATE POLICY "Authenticated users can view papers"
ON public.question_papers
FOR SELECT
TO authenticated
USING (true);
