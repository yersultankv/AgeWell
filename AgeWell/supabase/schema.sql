-- AgeWell: Supabase (PostgreSQL) схемасы.
-- Supabase → SQL Editor → New query → осы файлды толық қойып, Run басыңыз.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar text,
  health jsonb,                                              -- жасы, бойы, салмағы, өмір салты...
  twofa jsonb not null default '{"enabled": false, "backup": []}'::jsonb,
  emergency jsonb not null default '{"name": "", "phone": ""}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  sys double precision, dia double precision, pulse double precision,
  steps double precision, sleep double precision, water double precision, weight double precision,
  mood integer,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  target double precision not null,
  unit text,
  current double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.meds (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dose text,
  time text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  text text,
  kind text,
  image_note boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists entries_user_date_idx on public.entries (user_id, date desc);
create index if not exists goals_user_idx on public.goals (user_id);
create index if not exists meds_user_idx on public.meds (user_id);
create index if not exists chat_user_idx on public.chat_messages (user_id, created_at);

-- Row Level Security: әр қолданушы тек өз қатарларын көреді және өзгертеді
alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.goals enable row level security;
alter table public.meds enable row level security;
alter table public.chat_messages enable row level security;

create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own entries" on public.entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own goals" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own meds" on public.meds for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own chat" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
