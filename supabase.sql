-- 在 Supabase SQL Editor 中执行一次。所有计划必须属于已登录用户。
create table if not exists public.plans (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  day date not null,
  title text not null check (char_length(trim(title)) between 1 and 120),
  start time not null,
  "end" time not null,
  category text not null check (category in ('work','life','health','rest')),
  note text not null default '' check (char_length(note) <= 1000),
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  check ("end" > start)
);
create index if not exists plans_user_day on public.plans(user_id,day);
alter table public.plans enable row level security;
revoke all on public.plans from anon;
grant select, insert, update, delete on public.plans to authenticated;
drop policy if exists own_plans on public.plans;
create policy own_plans on public.plans for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create or replace function public.set_plan_timestamp() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end;
$$;
drop trigger if exists plan_timestamp on public.plans;
create trigger plan_timestamp before update on public.plans for each row execute function public.set_plan_timestamp();

-- 无需日期或时间的任务清单。
create table if not exists public.tasks (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 title text not null check (char_length(trim(title)) between 1 and 120),
 done boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists tasks_user on public.tasks(user_id);
alter table public.tasks enable row level security;
revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;
drop policy if exists own_tasks on public.tasks;
create policy own_tasks on public.tasks for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop trigger if exists task_timestamp on public.tasks;
create trigger task_timestamp before update on public.tasks for each row execute function public.set_plan_timestamp();
