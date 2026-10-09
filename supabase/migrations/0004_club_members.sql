-- Danh sách học viên CLB: giáo viên phụ trách (và Tổ trưởng / admin) thêm, xoá học sinh của CLB.
-- Chạy SAU 0003_major_os.sql, toàn bộ file trong Supabase Dashboard → SQL Editor.
--
-- Học viên có thể là học sinh đã có trong hệ thống (student_id) hoặc nhập tay (chỉ có họ tên, lớp)
-- khi em đó chưa có trong dữ liệu thể lực.

begin;

-- Ai được sửa danh sách học viên của một CLB
create or replace function public.can_manage_club(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['admin', 'lead'])
      or (public.has_role(array['teacher']) and exists (select 1 from public.clubs where id = p_club and teacher_id = auth.uid()));
$$;

create table public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  student_id text references public.students (id) on delete set null,
  full_name text not null check (length(trim(full_name)) >= 2),
  class_name text,
  grade text,
  note text,
  added_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (club_id, student_id)
);
create index on public.club_members (club_id);
create index on public.club_members (student_id);

create trigger touch_updated_date before update on public.club_members
  for each row execute function public.touch_updated_date();

alter table public.club_members enable row level security;
create policy club_members_read on public.club_members for select to authenticated
  using (public.has_role(array['admin', 'lead', 'hr', 'teacher']));
create policy club_members_insert on public.club_members for insert to authenticated
  with check (public.can_manage_club(club_id));
create policy club_members_update on public.club_members for update to authenticated
  using (public.can_manage_club(club_id)) with check (public.can_manage_club(club_id));
create policy club_members_delete on public.club_members for delete to authenticated
  using (public.can_manage_club(club_id));

-- ---------------------------------------------------------------------------
-- Tìm học sinh theo tên (cán bộ CLB không đọc trực tiếp bảng students — chỉ admin được).
-- Khớp một phần, không phân biệt hoa thường / dấu. Trả về thông tin tối thiểu để chọn đúng em.
-- ---------------------------------------------------------------------------
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
    where public.norm_name(s.full_name) like '%' || public.norm_name(p_q) || '%'
    order by s.school_year desc, s.full_name
    limit 20;
end;
$$;
revoke all on function public.search_students(text) from public;
grant execute on function public.search_students(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Ghi nhận sử dụng cho Major OS
-- ---------------------------------------------------------------------------
insert into public.usage_features (key, ten, nhom) values
  ('them_hoc_vien_clb', 'Thêm học viên vào CLB', 'can_bo'),
  ('xoa_hoc_vien_clb', 'Xoá học viên khỏi CLB', 'can_bo')
on conflict (key) do nothing;

create or replace function public.usage_from_club_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return null;
  end if;
  if tg_op = 'DELETE' then
    insert into public.usage_events (user_id, student_id, tinh_nang, chi_tiet)
    values (auth.uid(), old.student_id, 'xoa_hoc_vien_clb', jsonb_build_object('club_id', old.club_id));
  else
    insert into public.usage_events (user_id, student_id, tinh_nang, chi_tiet)
    values (auth.uid(), new.student_id, 'them_hoc_vien_clb', jsonb_build_object('club_id', new.club_id));
  end if;
  return null;
end;
$$;
create trigger usage_club_member after insert or delete on public.club_members
  for each row execute function public.usage_from_club_member();

commit;
