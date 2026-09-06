-- NEXT — esquema mínimo de base de datos
-- Ejecutar en el SQL Editor de tu proyecto Supabase.

create extension if not exists "uuid-ossp";

-- Nota: "users" ya existe como auth.users (gestionado por Supabase Auth).
-- No creamos una tabla users propia para no duplicar autenticación.

create table if not exists brain_dumps (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  original_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  brain_dump_id uuid references brain_dumps (id) on delete cascade,
  title text not null,
  estimated_minutes int not null default 5,
  status text not null default 'pending', -- pending | active | done | skipped
  energy_required text not null default 'medium', -- low | medium | high
  urgency int not null default 3,
  importance int not null default 3,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists focus_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  task_id uuid references tasks (id) on delete cascade,
  planned_minutes int not null,
  actual_minutes int,
  difficulty_feedback text, -- easy | fine | hard
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Índices simples para las consultas más comunes.
create index if not exists idx_tasks_user_status on tasks (user_id, status);
create index if not exists idx_brain_dumps_user on brain_dumps (user_id);
create index if not exists idx_events_user_event on analytics_events (user_id, event);

-- Row Level Security: cada usuario solo ve sus propios datos.
alter table brain_dumps enable row level security;
alter table tasks enable row level security;
alter table focus_sessions enable row level security;
alter table analytics_events enable row level security;

create policy "own brain dumps" on brain_dumps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own focus sessions" on focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own analytics events" on analytics_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
