-- Restrict paper vote visibility to the signed-in user's own votes
DROP POLICY IF EXISTS "Authenticated users can view votes" ON public.paper_votes;

CREATE POLICY "Users can view their own votes"
ON public.paper_votes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add channel authorization for Realtime private/public topics used by the app
DROP POLICY IF EXISTS "Authenticated users can subscribe to authorized channels" ON realtime.messages;

CREATE POLICY "Authenticated users can subscribe to authorized channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'notifications-' || auth.uid()::text
  OR realtime.topic() = 'paper-requests'
  OR realtime.topic() ~ '^comments-[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$'
  OR (
    realtime.topic() ~ '^group-chat-[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$'
    AND public.is_group_member(auth.uid(), replace(realtime.topic(), 'group-chat-', '')::uuid)
  )
  OR (
    realtime.topic() ~ '^group-members-[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$'
    AND public.is_group_member(auth.uid(), replace(realtime.topic(), 'group-members-', '')::uuid)
  )
);

-- Prevent anonymous clients from broadly listing storage objects in the public question paper bucket
DROP POLICY IF EXISTS "Anyone can view question paper files" ON storage.objects;

CREATE POLICY "Authenticated users can view question paper file records"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'question-papers');