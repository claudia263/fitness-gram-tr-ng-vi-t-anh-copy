-- Nhiều trường trên cùng một hệ thống: Trường Việt Anh (fitness.truongvietanh.com) và
-- Mê Kông Xanh MGIS (fitness.truongvietanh.com/mgis). Dữ liệu mỗi trường tách riêng.
-- Chạy SAU 0011, toàn bộ file trong Supabase Dashboard → SQL Editor (một lần, trong một giao dịch).
--
-- Quy tắc:
--   * role 'admin'        : CHỦ HỆ THỐNG (vd van.le@truongvietanh.com), thấy và quản lý mọi trường,
--                           thêm / gỡ quản trị cho từng trường (trang Cán bộ).
--   * role 'school_admin' : QUẢN TRỊ MỘT TRƯỜNG (profiles.school). Chỉ đọc / ghi học sinh, lớp, đợt kiểm tra và
--                           kết quả của trường mình. Không thấy trường khác, không vào CLB / kho ảnh / dữ liệu hệ thống.
--   * Học sinh, lớp, đợt kiểm tra có cột `school`. Mặc định 'vietanh' nên dữ liệu hiện có không đổi.
--   * Phụ huynh tra theo tên CHỈ ra học sinh đúng trường (lookup_students có tham số p_school).
--   * Cán bộ CLB (lead, hr, teacher) chỉ thấy học sinh Việt Anh.
-- Việt Anh: không đổi gì với dữ liệu và cách dùng hiện tại.

begin;

-- ---------------------------------------------------------------------------
-- Danh sách trường
-- ---------------------------------------------------------------------------
create table if not exists public.schools (
  id text primary key,
  name text not null
);
insert into public.schools (id, name) values
  ('vietanh', 'Trường Việt Anh'),
  ('mgis', 'Mê Kông Xanh (MGIS)')
on conflict (id) do nothing;
alter table public.schools enable row level security;
drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Vai trò và trường của cán bộ
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists school text not null default 'vietanh' references public.schools (id);
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'lead', 'hr', 'teacher', 'school_admin', 'user'));

alter table public.staff_invites add column if not exists school text not null default 'vietanh' references public.schools (id);
alter table public.staff_invites drop constraint if exists staff_invites_role_check;
alter table public.staff_invites add constraint staff_invites_role_check
  check (role in ('admin', 'lead', 'hr', 'teacher', 'school_admin'));

create or replace function public.my_school()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select school from public.profiles where id = auth.uid()), 'vietanh');
$$;

create or replace function public.is_school_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'school_admin');
$$;

-- Tài khoản mới: vai trò và trường lấy từ lời mời (staff_invites) theo email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, school)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', (select full_name from public.staff_invites where email = lower(new.email)), ''),
    coalesce((select role from public.staff_invites where email = lower(new.email)), 'user'),
    coalesce((select school from public.staff_invites where email = lower(new.email)), 'vietanh')
  );
  return new;
end;
$$;

-- Mời người đã có tài khoản: cập nhật vai trò và trường ngay (không đụng tới admin)
create or replace function public.apply_staff_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set role = new.role,
         school = new.school,
         full_name = case when coalesce(full_name, '') = '' then coalesce(new.full_name, '') else full_name end
   where lower(email) = new.email and role <> 'admin';
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cột trường trên dữ liệu học sinh
-- ---------------------------------------------------------------------------
alter table public.students add column if not exists school text not null default 'vietanh' references public.schools (id);
alter table public.classes add column if not exists school text not null default 'vietanh' references public.schools (id);
alter table public.test_sessions add column if not exists school text not null default 'vietanh' references public.schools (id);
create index if not exists students_school_idx on public.students (school);
create index if not exists classes_school_idx on public.classes (school);
create index if not exists test_sessions_school_idx on public.test_sessions (school);

-- Quản trị trường chỉ tạo được dữ liệu của trường mình (bỏ qua giá trị client gửi lên)
create or replace function public.force_school()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_school_admin() then
    new.school := public.my_school();
  end if;
  return new;
end;
$$;
drop trigger if exists force_school on public.students;
drop trigger if exists force_school on public.classes;
drop trigger if exists force_school on public.test_sessions;
create trigger force_school before insert on public.students for each row execute function public.force_school();
create trigger force_school before insert on public.classes for each row execute function public.force_school();
create trigger force_school before insert on public.test_sessions for each row execute function public.force_school();

-- ---------------------------------------------------------------------------
-- RLS: quản trị trường chỉ đọc / ghi dữ liệu trường mình (thêm vào, policy admin_all giữ nguyên)
-- ---------------------------------------------------------------------------
drop policy if exists school_admin_all on public.students;
drop policy if exists school_admin_all on public.classes;
drop policy if exists school_admin_all on public.test_sessions;
create policy school_admin_all on public.students for all to authenticated
  using (public.is_school_admin() and school = public.my_school())
  with check (public.is_school_admin() and school = public.my_school());
create policy school_admin_all on public.classes for all to authenticated
  using (public.is_school_admin() and school = public.my_school())
  with check (public.is_school_admin() and school = public.my_school());
create policy school_admin_all on public.test_sessions for all to authenticated
  using (public.is_school_admin() and school = public.my_school())
  with check (public.is_school_admin() and school = public.my_school());

do $$
declare t text;
begin
  foreach t in array array['fitness_results', 'anthropometric_results', 'teacher_comments'] loop
    execute format('drop policy if exists school_admin_all on public.%I', t);
    execute format(
      'create policy school_admin_all on public.%I for all to authenticated
         using (public.is_school_admin() and exists (select 1 from public.students s where s.id = %I.student_id and s.school = public.my_school()))
         with check (public.is_school_admin() and exists (select 1 from public.students s where s.id = %I.student_id and s.school = public.my_school()))',
      t, t, t);
  end loop;
end $$;

-- Bảng tham chiếu WHO dùng chung: quản trị trường được đọc
drop policy if exists school_admin_read on public.who_bmi_references;
create policy school_admin_read on public.who_bmi_references for select to authenticated using (public.is_school_admin());

-- ---------------------------------------------------------------------------
-- RPC cho phụ huynh: tra theo tên CHỈ trong trường được chọn
-- ---------------------------------------------------------------------------
drop function if exists public.lookup_students(text);
create or replace function public.lookup_students(p_name text, p_school text default 'vietanh')
returns setof public.students
language sql
stable
security definer
set search_path = public, extensions
as $$
  select s.*
  from public.students s
  where s.school = p_school
    -- chế độ bắt buộc đăng nhập email học sinh chỉ áp cho Việt Anh
    and (p_school <> 'vietanh' or not public.student_login_required())
    and length(public.norm_name(p_name)) >= 2
    and public.norm_name(s.full_name) = public.norm_name(p_name)
  limit 20;
$$;
revoke all on function public.lookup_students(text, text) from public;
grant execute on function public.lookup_students(text, text) to anon, authenticated;

-- Ai được xem kết quả một học sinh
create or replace function public.can_view_student(p_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students s
     where s.id = p_id
       and (
         public.is_admin()
         or (public.is_school_admin() and s.school = public.my_school())
         or (s.school = 'vietanh' and public.has_role(array['lead', 'hr', 'teacher']))
         or (s.school = 'vietanh' and not public.student_login_required())
         or (s.school = 'vietanh' and s.email is not null and s.email = public.current_student_email())
         or s.school <> 'vietanh'
       )
  );
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
    -- chỉ các đợt kiểm tra của đúng trường của học sinh
    'sessions', coalesce((select jsonb_agg(to_jsonb(t) order by t.test_date desc)
                          from public.test_sessions t
                          where t.school = (select school from public.students where id = p_id)), '[]'::jsonb)
  ) end;
$$;

-- Cán bộ CLB tìm học sinh: chỉ học sinh Việt Anh
create or replace function public.search_students(p_q text)
returns table (id text, full_name text, birth_date date, sex text, grade text, class_name text, school_year text)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.has_role(array['admin', 'lead', 'teacher']) then
    raise exception 'Không có quyền tìm học sinh' using errcode = '42501';
  end if;
  if length(public.norm_name(p_q)) < 2 then
    return;
  end if;
  return query
    select s.id, s.full_name, s.birth_date, s.sex, s.grade, c.name, s.school_year
    from public.students s
    left join public.classes c on c.id = s.class_id
    where s.school = 'vietanh'
      and public.norm_name(s.full_name) like '%' || public.norm_name(p_q) || '%'
    order by s.school_year desc, s.full_name
    limit 20;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- Sau khi chạy: thêm quản trị cho một trường (chủ hệ thống làm được ở trang Cán bộ, hoặc bằng SQL):
--   insert into public.staff_invites (email, role, full_name, school)
--   values ('ten@mekongxanh.com', 'school_admin', 'Tên người quản trị', 'mgis')
--   on conflict (email) do update set role = excluded.role, school = excluded.school, full_name = excluded.full_name;
--
-- Kiểm tra nhanh (kết quả mong đợi: toàn bộ dữ liệu cũ nằm ở 'vietanh'):
--   select school, count(*) from public.students group by school;
-- ---------------------------------------------------------------------------
