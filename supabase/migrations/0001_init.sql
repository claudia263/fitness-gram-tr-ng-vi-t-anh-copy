-- FitnessGram Trường Việt Anh — schema Supabase
-- Chạy toàn bộ file này trong Supabase Dashboard → SQL Editor.
--
-- Mô hình quyền:
--   * Quản trị/giáo viên: đăng nhập Supabase Auth, profiles.role = 'admin' → đọc/ghi mọi bảng.
--   * Phụ huynh: KHÔNG đăng nhập. Chỉ gọi 3 hàm RPC (lookup_students, get_student, student_bundle)
--     để xem đúng học sinh khớp tên. Không có quyền đọc trực tiếp bảng.

create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Hồ sơ người dùng (role)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Bảng dữ liệu. id kiểu text để giữ nguyên id cũ của Base44 khi di chuyển dữ liệu.
-- ---------------------------------------------------------------------------
create table public.classes (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  grade text not null,
  campus text,
  school_year text not null,
  teacher_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table public.students (
  id text primary key default gen_random_uuid()::text,
  student_code text,
  full_name text not null,
  birth_date date not null,
  sex text not null check (sex in ('male', 'female')),
  class_id text not null,
  grade text not null,
  campus text,
  avatar_url text,
  school_year text not null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table public.teachers (
  id text primary key default gen_random_uuid()::text,
  full_name text not null,
  email text not null,
  phone text,
  campus text,
  assigned_classes text[] default '{}',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table public.parents (
  id text primary key default gen_random_uuid()::text,
  full_name text not null,
  email text not null,
  phone text,
  student_ids text[] default '{}',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table public.parent_student_relationships (
  id text primary key default gen_random_uuid()::text,
  parent_email text not null,
  student_id text not null,
  relationship text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table public.test_sessions (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  test_date date not null,
  semester text not null check (semester in ('Học kỳ I', 'Học kỳ II')),
  school_year text not null,
  teacher_id text,
  notes text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table public.fitness_results (
  id text primary key default gen_random_uuid()::text,
  student_id text not null,
  session_id text not null,
  pacer_laps double precision,
  pacer_level double precision,
  pacer_type text default '15m' check (pacer_type in ('15m', '20m')),
  sit_and_reach_cm double precision,
  pushup_count double precision,
  plank_seconds double precision,
  teacher_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table public.anthropometric_results (
  id text primary key default gen_random_uuid()::text,
  student_id text not null,
  session_id text not null,
  height_cm double precision not null,
  weight_kg double precision not null,
  bmi double precision,
  age_months double precision,
  bmi_for_age_zscore double precision,
  nutritional_status text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table public.teacher_comments (
  id text primary key default gen_random_uuid()::text,
  student_id text not null,
  session_id text not null,
  teacher_id text,
  fitness_comment text,
  growth_comment text,
  recommendation text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table public.who_bmi_references (
  id text primary key default gen_random_uuid()::text,
  sex text not null check (sex in ('male', 'female')),
  age_months double precision not null,
  "L" double precision,
  "M" double precision not null,
  "S" double precision,
  sd_minus3 double precision,
  sd_minus2 double precision,
  sd_minus1 double precision,
  sd_plus1 double precision,
  sd_plus2 double precision,
  sd_plus3 double precision,
  source text,
  version text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index on public.students (class_id);
create index on public.students (school_year);
create index on public.fitness_results (student_id);
create index on public.fitness_results (session_id);
create index on public.anthropometric_results (student_id);
create index on public.anthropometric_results (session_id);
create index on public.teacher_comments (student_id);
create index on public.teacher_comments (session_id);

-- ---------------------------------------------------------------------------
-- updated_date tự cập nhật
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_date()
returns trigger
language plpgsql
as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'classes', 'students', 'teachers', 'parents', 'parent_student_relationships',
    'test_sessions', 'fitness_results', 'anthropometric_results', 'teacher_comments', 'who_bmi_references'
  ] loop
    execute format(
      'create trigger touch_updated_date before update on public.%I for each row execute function public.touch_updated_date()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS: chỉ admin đọc/ghi trực tiếp các bảng
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'classes', 'students', 'teachers', 'parents', 'parent_student_relationships',
    'test_sessions', 'fitness_results', 'anthropometric_results', 'teacher_comments', 'who_bmi_references'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy profiles_read_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
-- Không cho client tự sửa role: chỉ admin sửa qua SQL Editor/service role.

-- ---------------------------------------------------------------------------
-- RPC cho phụ huynh (không cần đăng nhập)
-- ---------------------------------------------------------------------------
create or replace function public.norm_name(p text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select lower(regexp_replace(trim(extensions.unaccent(coalesce(p, ''))), '\s+', ' ', 'g'));
$$;

-- Trả về các học sinh có họ tên khớp chính xác (không phân biệt hoa thường/dấu).
create or replace function public.lookup_students(p_name text)
returns setof public.students
language sql
stable
security definer
set search_path = public, extensions
as $$
  select s.*
  from public.students s
  where length(public.norm_name(p_name)) >= 2
    and public.norm_name(s.full_name) = public.norm_name(p_name)
  limit 20;
$$;

create or replace function public.get_student(p_id text)
returns public.students
language sql
stable
security definer
set search_path = public
as $$
  select * from public.students where id = p_id;
$$;

-- Toàn bộ lịch sử của một học sinh (kết quả thể lực, thể trạng, nhận xét, các đợt kiểm tra).
create or replace function public.student_bundle(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'fitness', coalesce((select jsonb_agg(to_jsonb(f) order by f.created_date desc)
                         from public.fitness_results f where f.student_id = p_id), '[]'::jsonb),
    'anthro', coalesce((select jsonb_agg(to_jsonb(a) order by a.created_date desc)
                        from public.anthropometric_results a where a.student_id = p_id), '[]'::jsonb),
    'comments', coalesce((select jsonb_agg(to_jsonb(c) order by c.created_date desc)
                          from public.teacher_comments c where c.student_id = p_id), '[]'::jsonb),
    'sessions', coalesce((select jsonb_agg(to_jsonb(t) order by t.test_date desc)
                          from public.test_sessions t), '[]'::jsonb)
  );
$$;

revoke all on function public.lookup_students(text) from public;
revoke all on function public.get_student(text) from public;
revoke all on function public.student_bundle(text) from public;
grant execute on function public.lookup_students(text) to anon, authenticated;
grant execute on function public.get_student(text) to anon, authenticated;
grant execute on function public.student_bundle(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Cấp quyền admin cho tài khoản đầu tiên (chạy SAU khi đã đăng ký tài khoản):
--   update public.profiles set role = 'admin' where email = 'email-cua-ban@truongvietanh.com';
-- ---------------------------------------------------------------------------
