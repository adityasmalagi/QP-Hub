-- Update increment_views function to count every click (no rate limiting)
CREATE OR REPLACE FUNCTION public.increment_views(_paper_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  can_count boolean;
begin
  -- Determine if the caller is allowed to affect metrics for this paper
  select (
    qp.status = 'approved'
    or (auth.uid() is not null and auth.uid() = qp.user_id)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  into can_count
  from public.question_papers qp
  where qp.id = _paper_id;

  if coalesce(can_count, false) = false then
    return;
  end if;

  -- Simply increment the view count
  update public.question_papers
  set views_count = coalesce(views_count, 0) + 1
  where id = _paper_id;
end;
$function$;