-- Học sinh / phụ huynh xem kết quả bằng tài khoản email học sinh @student.truongvietanh.com.
-- Chạy SAU 0008_campus_rounds.sql, toàn bộ file trong Supabase Dashboard → SQL Editor.
--
--   students.email          : email học sinh (nhập từ danh sách của trường)
--   app_settings.student_login = true  → BẮT BUỘC đăng nhập email: tắt tra cứu theo họ tên,
--                                         chỉ đúng email của em đó (hoặc cán bộ) mới xem được kết quả
--   app_settings.student_login = false → giữ cách cũ (tra cứu theo họ tên) trong lúc nhập danh sách email
-- Bật / tắt trên trang Quản trị của app.

begin;

alter table public.students add column if not exists email text;
alter table public.students drop constraint if exists students_email_domain;
alter table public.students add constraint students_email_domain
  check (email is null or (email = lower(email) and email like '%@student.truongvietanh.com'));
create unique index if not exists students_email_unique on public.students (email) where email is not null;

insert into public.app_settings (key, value) values ('student_login', 'false'::jsonb)
on conflict (key) do nothing;

-- Admin bật / tắt chế độ: dùng quyền ghi app_settings sẵn có (policy app_settings_write ở 0002)

create or replace function public.student_login_required()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value = 'true'::jsonb from public.app_settings where key = 'student_login'), false);
$$;

-- Email đang đăng nhập (chỉ nhận email học sinh của trường)
create or replace function public.current_student_email()
returns text
language sql
stable
as $$
  select case when lower(auth.jwt() ->> 'email') like '%@student.truongvietanh.com' then lower(auth.jwt() ->> 'email') end;
$$;

-- Ai được xem kết quả một học sinh
create or replace function public.can_view_student(p_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['admin', 'lead', 'hr', 'teacher'])
      or not public.student_login_required()
      or exists (select 1 from public.students where id = p_id and email = public.current_student_email());
$$;

-- Học sinh của tài khoản đang đăng nhập
create or replace function public.my_students()
returns setof public.students
language sql
stable
security definer
set search_path = public
as $$
  select * from public.students where email is not null and email = public.current_student_email();
$$;

-- Cài đặt công khai cho trang đăng nhập (chưa đăng nhập vẫn đọc được)
create or replace function public.public_settings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('student_login', public.student_login_required());
$$;

-- Tra cứu theo tên: tắt khi bắt buộc đăng nhập email
create or replace function public.lookup_students(p_name text)
returns setof public.students
language sql
stable
security definer
set search_path = public, extensions
as $$
  select s.*
  from public.students s
  where not public.student_login_required()
    and length(public.norm_name(p_name)) >= 2
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
  select * from public.students where id = p_id and public.can_view_student(p_id);
$$;

create or replace function public.student_bundle(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when not public.can_view_student(p_id) then null else jsonb_build_object(
    'fitness', coalesce((select jsonb_agg(to_jsonb(f) order by f.created_date desc)
                         from public.fitness_results f where f.student_id = p_id), '[]'::jsonb),
    'anthro', coalesce((select jsonb_agg(to_jsonb(a) order by a.created_date desc)
                        from public.anthropometric_results a where a.student_id = p_id), '[]'::jsonb),
    'comments', coalesce((select jsonb_agg(to_jsonb(c) order by c.created_date desc)
                          from public.teacher_comments c where c.student_id = p_id), '[]'::jsonb),
    'sessions', coalesce((select jsonb_agg(to_jsonb(t) order by t.test_date desc)
                          from public.test_sessions t), '[]'::jsonb)
  ) end;
$$;

revoke all on function public.my_students() from public;
revoke all on function public.public_settings() from public;
grant execute on function public.my_students() to authenticated;
grant execute on function public.public_settings() to anon, authenticated;

insert into public.usage_features (key, ten, nhom) values
  ('dang_nhap_hoc_sinh', 'Học sinh / phụ huynh đăng nhập bằng email học sinh', 'phu_huynh'),
  ('nhap_email_hoc_sinh', 'Nhập danh sách email học sinh', 'can_bo')
on conflict (key) do nothing;

commit;
