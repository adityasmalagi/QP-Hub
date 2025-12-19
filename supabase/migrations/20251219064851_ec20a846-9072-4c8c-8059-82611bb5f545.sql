-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a proper restrictive INSERT policy
-- Only SECURITY DEFINER functions (like the trigger) can insert notifications
-- The trigger function `notify_followers_on_paper_approval` is SECURITY DEFINER
-- so it can still insert notifications, but no regular user can directly insert
CREATE POLICY "Only system functions can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Note: The trigger function notify_followers_on_paper_approval uses SECURITY DEFINER
-- which bypasses RLS, so notifications will still be created when papers are approved