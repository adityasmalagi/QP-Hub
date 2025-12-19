-- 1) Defense-in-depth: server-side admin verification helper
create or replace function public.verify_admin_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

-- 2) Rate limiting support table for view/download counters
create table if not exists public.paper_metric_events (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.question_papers(id) on delete cascade,
  identifier_hash text not null,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_paper_metric_events_lookup
on public.paper_metric_events (paper_id, identifier_hash, event_type, created_at desc);

alter table public.paper_metric_events enable row level security;

-- No SELECT policy on purpose (default deny) to prevent scraping identifiers.
-- Allow no direct writes either (default deny). Functions below run as SECURITY DEFINER.

-- 3) Harden + rate-limit increment functions
create or replace function public.increment_views(_paper_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hdr_json json;
  ip_raw text;
  ip text;
  base_identifier text;
  identifier_hash text;
  can_count boolean;
  recent_exists boolean;
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

  -- Build a best-effort identifier (hashed) for rate limiting
  hdr_json := null;
  begin
    hdr_json := current_setting('request.headers', true)::json;
  exception when others then
    hdr_json := null;
  end;

  ip_raw := coalesce(hdr_json ->> 'x-forwarded-for', hdr_json ->> 'cf-connecting-ip', hdr_json ->> 'x-real-ip');
  ip := null;
  if ip_raw is not null then
    ip := split_part(ip_raw, ',', 1);
  end if;

  base_identifier := coalesce(auth.uid()::text, 'anon') || ':' || coalesce(ip, '');
  identifier_hash := md5(base_identifier);

  select exists (
    select 1
    from public.paper_metric_events e
    where e.paper_id = _paper_id
      and e.identifier_hash = identifier_hash
      and e.event_type = 'view'
      and e.created_at > now() - interval '10 minutes'
  )
  into recent_exists;

  if coalesce(recent_exists, false) then
    return;
  end if;

  update public.question_papers
  set views_count = coalesce(views_count, 0) + 1
  where id = _paper_id;

  insert into public.paper_metric_events (paper_id, identifier_hash, event_type)
  values (_paper_id, identifier_hash, 'view');

  -- Best-effort cleanup (keeps table from growing unbounded)
  delete from public.paper_metric_events
  where paper_id = _paper_id
    and event_type = 'view'
    and created_at < now() - interval '7 days';
end;
$$;

create or replace function public.increment_downloads(_paper_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hdr_json json;
  ip_raw text;
  ip text;
  base_identifier text;
  identifier_hash text;
  can_count boolean;
  recent_exists boolean;
begin
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

  hdr_json := null;
  begin
    hdr_json := current_setting('request.headers', true)::json;
  exception when others then
    hdr_json := null;
  end;

  ip_raw := coalesce(hdr_json ->> 'x-forwarded-for', hdr_json ->> 'cf-connecting-ip', hdr_json ->> 'x-real-ip');
  ip := null;
  if ip_raw is not null then
    ip := split_part(ip_raw, ',', 1);
  end if;

  base_identifier := coalesce(auth.uid()::text, 'anon') || ':' || coalesce(ip, '');
  identifier_hash := md5(base_identifier);

  select exists (
    select 1
    from public.paper_metric_events e
    where e.paper_id = _paper_id
      and e.identifier_hash = identifier_hash
      and e.event_type = 'download'
      and e.created_at > now() - interval '30 minutes'
  )
  into recent_exists;

  if coalesce(recent_exists, false) then
    return;
  end if;

  update public.question_papers
  set downloads_count = coalesce(downloads_count, 0) + 1
  where id = _paper_id;

  insert into public.paper_metric_events (paper_id, identifier_hash, event_type)
  values (_paper_id, identifier_hash, 'download');

  delete from public.paper_metric_events
  where paper_id = _paper_id
    and event_type = 'download'
    and created_at < now() - interval '30 days';
end;
$$;

-- 4) Harden notification function (even if not currently attached to a trigger)
create or replace function public.notify_followers_on_paper_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uploader_name text;
  follower record;
begin
  -- Only trigger when status changes to 'approved'
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    -- Ensure uploader exists in profiles (public schema) before notifying
    if new.user_id is null or not exists (select 1 from public.profiles p where p.id = new.user_id) then
      return new;
    end if;

    select p.full_name into uploader_name
    from public.profiles p
    where p.id = new.user_id;

    for follower in
      select uf.follower_id
      from public.user_follows uf
      where uf.following_id = new.user_id
        and uf.follower_id is not null
        and uf.follower_id <> new.user_id
    loop
      -- Validate follower exists
      if exists (select 1 from public.profiles p where p.id = follower.follower_id) then
        insert into public.notifications (user_id, type, title, message, link)
        values (
          follower.follower_id,
          'new_paper',
          'New Paper Upload',
          coalesce(uploader_name, 'Someone you follow') || ' uploaded a new paper: ' || new.title,
          '/paper/' || new.id
        );
      end if;
    end loop;
  end if;

  return new;
end;
$$;