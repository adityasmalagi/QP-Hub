
-- 1) Revoke EXECUTE from PUBLIC on all SECURITY DEFINER functions in public schema
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_downloads(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_paper_difficulty() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_request_upvotes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_solution_upvotes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_public_profile_on_profile_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_user_badge(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_comment_upvotes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_collection_papers_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_admin_access() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lookup_invite_by_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_exam_reminders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_trending_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_paper_vote_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_views(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_public_profiles_from_profiles() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_study_streak() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_followers_on_paper_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.use_group_invite(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_user_activity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_trending_papers(integer) FROM PUBLIC;

-- 2) Grant EXECUTE only to roles that need to call these RPCs from the API
GRANT EXECUTE ON FUNCTION public.get_public_trending_papers(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_invite_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_downloads(uuid) TO authenticated;

-- 3) Fix profiles: add PERMISSIVE owner SELECT policy so restrictive policy doesn't block everything
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 4) group_invites: allow authenticated users to look up an active invite by code (needed to join)
CREATE POLICY "Authenticated users can view active invites"
ON public.group_invites
FOR SELECT
TO authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 5) paper_metric_events: keep default-deny for writes; only SECURITY DEFINER funcs insert.
-- Ensure no accidental grants exist that would allow direct writes.
REVOKE INSERT, UPDATE, DELETE ON public.paper_metric_events FROM anon, authenticated;
