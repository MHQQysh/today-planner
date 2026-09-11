-- 公开共享看板：任何访问者都可以读取、添加、修改、删除下面两张表中的记录。
-- 在 SQL Editor 执行。原有私人 plans/tasks 表和数据保持不变。
begin;
create table if not exists public.shared_plans (
 id uuid primary key,
 day date not null,
 title text not null check (char_length(trim(title)) between 1 and 120),
 start time not null,
 "end" time not null,
 category text not null check (category in ('work','life','health','rest')),
 note text not null default '' check (char_length(note)<=1000),
 done boolean not null default false,
 updated_at timestamptz not null default now(),
 check ("end">start)
);
create table if not exists public.shared_tasks (
 id uuid primary key,
 title text not null check (char_length(trim(title)) between 1 and 120),
 done boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.shared_plans enable row level security;
alter table public.shared_tasks enable row level security;
grant usage on schema public to anon, authenticated;
grant select,insert,update,delete on public.shared_plans,public.shared_tasks to anon,authenticated;
drop policy if exists public_board on public.shared_plans;
create policy public_board on public.shared_plans for all to anon,authenticated using (true) with check (true);
drop policy if exists public_board on public.shared_tasks;
create policy public_board on public.shared_tasks for all to anon,authenticated using (true) with check (true);
create or replace function public.set_shared_timestamp() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=clock_timestamp();return new;end;
$$;
drop trigger if exists shared_timestamp on public.shared_plans;
create trigger shared_timestamp before update on public.shared_plans for each row execute function public.set_shared_timestamp();
drop trigger if exists shared_timestamp on public.shared_tasks;
create trigger shared_timestamp before update on public.shared_tasks for each row execute function public.set_shared_timestamp();
commit;
