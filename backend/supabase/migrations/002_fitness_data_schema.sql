-- =============================================
-- PROFILES POLICIES
-- =============================================

alter table public.profiles enable row level security;

create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);


-- =============================================
-- USER METRICS
-- =============================================

create table if not exists public.user_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  age integer,
  gender text,
  weight numeric,
  height numeric,
  activity_level text,
  unit_system text default 'metric',
  goal_weight numeric,
  created_at timestamptz default now() not null
);

alter table public.user_metrics enable row level security;

create policy "Users can view own metrics"
on public.user_metrics
for select
using (auth.uid() = user_id);

create policy "Users can insert own metrics"
on public.user_metrics
for insert
with check (auth.uid() = user_id);

create policy "Users can update own metrics"
on public.user_metrics
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own metrics"
on public.user_metrics
for delete
using (auth.uid() = user_id);


-- =============================================
-- METABOLIC CALCULATIONS
-- =============================================

create table if not exists public.metabolic_calculations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text,
  bmr numeric,
  rmr numeric,
  tdee numeric,
  calorie_goal numeric,
  protein_grams numeric,
  carbs_grams numeric,
  fat_grams numeric,
  created_at timestamptz default now() not null
);

alter table public.metabolic_calculations enable row level security;

create policy "Users can view own calculations"
on public.metabolic_calculations
for select
using (auth.uid() = user_id);

create policy "Users can insert own calculations"
on public.metabolic_calculations
for insert
with check (auth.uid() = user_id);

create policy "Users can update own calculations"
on public.metabolic_calculations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own calculations"
on public.metabolic_calculations
for delete
using (auth.uid() = user_id);


-- =============================================
-- EXERCISE LOGS
-- =============================================

create table if not exists public.exercise_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_type text not null,
  sets integer,
  reps integer,
  weight numeric,
  duration_minutes numeric,
  exercise_date timestamptz default now() not null,
  created_at timestamptz default now() not null
);

alter table public.exercise_logs enable row level security;

create policy "Users can view own exercises"
on public.exercise_logs
for select
using (auth.uid() = user_id);

create policy "Users can insert own exercises"
on public.exercise_logs
for insert
with check (auth.uid() = user_id);

create policy "Users can update own exercises"
on public.exercise_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own exercises"
on public.exercise_logs
for delete
using (auth.uid() = user_id);


-- =============================================
-- MEAL LOGS
-- =============================================

create table if not exists public.meal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_name text not null,
  calories numeric not null,
  protein_grams numeric default 0,
  carbs_grams numeric default 0,
  fat_grams numeric default 0,
  meal_type text,
  meal_date timestamptz default now() not null,
  created_at timestamptz default now() not null
);

alter table public.meal_logs enable row level security;

create policy "Users can view own meals"
on public.meal_logs
for select
using (auth.uid() = user_id);

create policy "Users can insert own meals"
on public.meal_logs
for insert
with check (auth.uid() = user_id);

create policy "Users can update own meals"
on public.meal_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own meals"
on public.meal_logs
for delete
using (auth.uid() = user_id);


-- =============================================
-- WATER LOGS
-- =============================================

create table if not exists public.water_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cups integer default 1 not null,
  logged_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

alter table public.water_logs enable row level security;

create policy "Users can view own water logs"
on public.water_logs
for select
using (auth.uid() = user_id);

create policy "Users can insert own water logs"
on public.water_logs
for insert
with check (auth.uid() = user_id);

create policy "Users can update own water logs"
on public.water_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own water logs"
on public.water_logs
for delete
using (auth.uid() = user_id);


-- =============================================
-- INDEXES
-- =============================================

create index if not exists idx_user_metrics_user_id
on public.user_metrics(user_id);

create index if not exists idx_metabolic_calculations_user_id
on public.metabolic_calculations(user_id);

create index if not exists idx_exercise_logs_user_id
on public.exercise_logs(user_id);

create index if not exists idx_exercise_logs_date
on public.exercise_logs(exercise_date);

create index if not exists idx_meal_logs_user_id
on public.meal_logs(user_id);

create index if not exists idx_meal_logs_date
on public.meal_logs(meal_date);

create index if not exists idx_water_logs_user_id
on public.water_logs(user_id);

create index if not exists idx_water_logs_date
on public.water_logs(logged_at);