-- GTG Mandatory Targets & Target History Schema

-- 1. Enforce NOT NULL on gtg_exercises.daily_target (defaulting to 20 for legacy rows)
update gtg_exercises set daily_target = 20 where daily_target is null;
alter table gtg_exercises alter column daily_target set not null;
alter table gtg_exercises alter column daily_target set default 20;

-- 2. Create gtg_target_history table
create table if not exists gtg_target_history (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references gtg_exercises(id) on delete cascade,
  daily_target integer not null check (daily_target > 0),
  effective_from date not null,
  created_at timestamp with time zone default now(),
  unique (exercise_id, effective_from)
);

alter table gtg_target_history enable row level security;

create policy "Allow all operations v1 gtg_target_history" on gtg_target_history for all using (true) with check (true);

-- 3. Backfill initial target history for existing exercises
insert into gtg_target_history (exercise_id, daily_target, effective_from)
select id, daily_target, coalesce(created_at::date, '2026-01-01'::date)
from gtg_exercises
on conflict (exercise_id, effective_from) do update set daily_target = excluded.daily_target;
