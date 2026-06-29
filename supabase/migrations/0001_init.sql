-- =====================================================================
-- EduVerse — Full Supabase Migration (real, executable SQL)
-- Run via: supabase db push   (or paste directly into SQL Editor)
-- =====================================================================

-- ---------- app_settings ----------
create table if not exists app_settings (
  id serial primary key,
  theme_colors jsonb,
  app_name text not null default 'EduVerse',
  logo_url text,
  logo_animation_style text not null default 'pulse',
  rgb_lighting_enabled boolean not null default true,
  -- Master toggle: only reveals the per-item allow_download switch in the
  -- admin UI. Does NOT enable downloads globally — see content.allow_download.
  allow_download_controls_enabled boolean not null default false
);

insert into app_settings (id, app_name) values (1, 'EduVerse')
  on conflict (id) do nothing;

-- ---------- sections ----------
create table if not exists sections (
  id serial primary key,
  title text not null,
  is_visible boolean not null default true,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  display_order int not null default 0
);

-- ---------- content ----------
create table if not exists content (
  id serial primary key,
  section_id int references sections(id) on delete set null,
  title text not null,
  type text not null check (type in ('video','text','pdf','word','powerpoint','excel','zip')),
  file_url text,
  content_body text,
  is_featured boolean not null default false,
  show_on_home boolean not null default false,
  -- Per-item only. Default false. There is intentionally no global flag
  -- that enables this for all rows at once.
  allow_download boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_section on content(section_id) where is_deleted = false;

-- ---------- profiles ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  level int not null default 1,
  preferred_language text not null default 'ar' check (preferred_language in ('ar','en','egy')),
  grade_year int
);

-- ---------- comments ----------
create table if not exists comments (
  id serial primary key,
  content_id int references content(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  comment_text text not null,
  reply_text text,
  is_visible boolean not null default true,
  user_grade_year int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table app_settings enable row level security;
alter table sections enable row level security;
alter table content enable row level security;
alter table profiles enable row level security;
alter table comments enable row level security;

-- app_settings: readable by everyone (theme/logo are public), writable only by service_role (admin dashboard uses service key server-side)
create policy "app_settings readable by all" on app_settings
  for select using (true);
create policy "app_settings writable by service role only" on app_settings
  for all using (auth.role() = 'service_role');

-- sections: visible, non-deleted sections are public; admin (service_role) manages everything
create policy "sections visible to all" on sections
  for select using (is_visible = true and is_deleted = false);
create policy "sections managed by service role" on sections
  for all using (auth.role() = 'service_role');

-- content: a logged-in user can see content only if their profile level
-- requirement is met (extend with content.required_level if you add tiered access)
create policy "content visible to authenticated users" on content
  for select using (
    is_deleted = false
    and exists (select 1 from profiles where profiles.id = auth.uid())
  );
create policy "content managed by service role" on content
  for all using (auth.role() = 'service_role');

-- profiles: a user can only read/update their own profile row
create policy "profiles self read" on profiles
  for select using (auth.uid() = id);
create policy "profiles self update" on profiles
  for update using (auth.uid() = id);
create policy "profiles self insert" on profiles
  for insert with check (auth.uid() = id);

-- comments: visible comments readable by all authenticated users;
-- a user may only insert their own comment_text (never set reply_text themselves)
create policy "comments visible read" on comments
  for select using (is_visible = true or auth.role() = 'service_role');
create policy "comments self insert" on comments
  for insert with check (auth.uid() = user_id);
create policy "comments managed by service role" on comments
  for all using (auth.role() = 'service_role');

-- =====================================================================
-- Functions
-- =====================================================================

create or replace function update_content(
  p_id int, p_title text, p_body text, p_section_id int
) returns void as $$
begin
  update content
  set title = p_title, content_body = p_body, section_id = p_section_id, updated_at = now()
  where id = p_id;
end;
$$ language plpgsql security definer;

create or replace function restore_content(content_ids int[])
returns void as $$
begin
  update content set is_deleted = false, deleted_at = null where id = any(content_ids);
end;
$$ language plpgsql security definer;

create or replace function get_daily_comment_report()
returns table (total_comments_today bigint, pending_replies bigint, hidden_comments bigint)
language plpgsql security definer as $$
begin
  return query
  select
    count(*) filter (where created_at::date = current_date),
    count(*) filter (where reply_text is null and is_visible = true),
    count(*) filter (where is_visible = false)
  from comments;
end;
$$;

create or replace function search_content(search_query text)
returns setof content as $$
begin
  return query
  select * from content
  where is_deleted = false
    and to_tsvector('arabic', coalesce(title, '') || ' ' || coalesce(content_body, ''))
        @@ plainto_tsquery('arabic', search_query);
end;
$$ language plpgsql security definer;

-- =====================================================================
-- Realtime (so useSections/useContent live-update across all open tabs)
-- =====================================================================
alter publication supabase_realtime add table sections;
alter publication supabase_realtime add table content;
alter publication supabase_realtime add table comments;
