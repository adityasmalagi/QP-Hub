-- 1. Fix paper_votes: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view votes" ON public.paper_votes;
CREATE POLICY "Authenticated users can view votes"
  ON public.paper_votes FOR SELECT
  TO authenticated
  USING (true);

-- 2. Fix storage upload path enforcement
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'question-papers' AND (auth.uid())::text = (storage.foldername(name))[1]);