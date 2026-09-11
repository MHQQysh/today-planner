-- 清单版规划：先执行本文件，再使用新版网页。保留旧表和历史数据。
begin;
create table if not exists public.planning_boards (
 id uuid primary key,
 title text not null check(char_length(trim(title)) between 1 and 120),
 color text not null default 'mint' check(color in ('mint','blue','lavender','sand')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.checklist_items (
 id uuid primary key,
 title text not null check(char_length(trim(title)) between 1 and 500),
 done boolean not null default false,
 day date,
 board_id uuid references public.planning_boards(id) on delete cascade,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check((day is not null and board_id is null) or (day is null and board_id is not null))
);
create index if not exists checklist_day on public.checklist_items(day);
create index if not exists checklist_board on public.checklist_items(board_id);
alter table public.planning_boards enable row level security;
alter table public.checklist_items enable row level security;
grant select,insert,update,delete on public.planning_boards,public.checklist_items to anon,authenticated;
drop policy if exists shared_checklists on public.planning_boards;
create policy shared_checklists on public.planning_boards for all to anon,authenticated using(true) with check(true);
drop policy if exists shared_checklists on public.checklist_items;
create policy shared_checklists on public.checklist_items for all to anon,authenticated using(true) with check(true);
create or replace function public.set_checklist_timestamp() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=clock_timestamp();return new;end;
$$;
drop trigger if exists checklist_timestamp on public.checklist_items;
create trigger checklist_timestamp before update on public.checklist_items for each row execute function public.set_checklist_timestamp();
drop trigger if exists board_timestamp on public.planning_boards;
create trigger board_timestamp before update on public.planning_boards for each row execute function public.set_checklist_timestamp();
-- 旧时间规划按原日期转为今日清单，不再显示时间。
do $$ begin
 if to_regclass('public.shared_plans') is not null then
  insert into public.checklist_items(id,title,done,day)
   select id,title,done,day from public.shared_plans on conflict(id) do nothing;
 end if;
 if to_regclass('public.shared_tasks') is not null then
  if exists(select 1 from public.shared_tasks) then
   insert into public.planning_boards(id,title,color) values('11111111-1111-4111-8111-111111111111','原有 Tasks','mint') on conflict(id) do nothing;
   insert into public.checklist_items(id,title,done,board_id)
    select id,title,done,'11111111-1111-4111-8111-111111111111'::uuid from public.shared_tasks on conflict(id) do nothing;
  end if;
 end if;
end $$;
commit;
