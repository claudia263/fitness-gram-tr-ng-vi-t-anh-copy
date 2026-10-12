-- Giáo viên tự thêm / cập nhật CLB của mình.
-- Chạy SAU 0006_moet_tests.sql, toàn bộ file trong Supabase Dashboard → SQL Editor.
--
--   * Thêm CLB mới: CLB phải do chính giáo viên phụ trách (teacher_id = mình)
--   * Sửa CLB mình phụ trách hoặc do mình tạo (kể cả lịch sinh hoạt, học viên); không gán sang giáo viên khác
--   * Xoá: chỉ CLB phát sinh (source = 'manual') do chính mình tạo
-- Admin và Tổ trưởng giữ nguyên quyền (policy clubs_write / club_slots_write ở 0002).

begin;

-- Ai sửa được CLB (dùng cho lịch sinh hoạt và học viên): admin, Tổ trưởng, GV phụ trách hoặc GV tạo CLB
create or replace function public.can_manage_club(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['admin', 'lead'])
      or (public.has_role(array['teacher'])
          and exists (select 1 from public.clubs where id = p_club and (teacher_id = auth.uid() or created_by = auth.uid())));
$$;

create policy clubs_teacher_insert on public.clubs for insert to authenticated
  with check (public.has_role(array['teacher']) and teacher_id = auth.uid() and created_by = auth.uid() and source = 'manual');

create policy clubs_teacher_update on public.clubs for update to authenticated
  using (public.has_role(array['teacher']) and (teacher_id = auth.uid() or created_by = auth.uid()))
  with check (public.has_role(array['teacher']) and teacher_id = auth.uid());

create policy clubs_teacher_delete on public.clubs for delete to authenticated
  using (public.has_role(array['teacher']) and created_by = auth.uid() and source = 'manual');

-- Giáo viên không đổi được nguồn (TKB / phát sinh) và người tạo CLB
create or replace function public.guard_club_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(array['admin', 'lead'])
     and (new.source is distinct from old.source or new.created_by is distinct from old.created_by) then
    raise exception 'Không sửa được nguồn hoặc người tạo CLB' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_club_update before update on public.clubs
  for each row execute function public.guard_club_update();

-- Lịch sinh hoạt của CLB mình
create policy club_slots_teacher_write on public.club_slots for all to authenticated
  using (public.has_role(array['teacher']) and public.can_manage_club(club_id))
  with check (public.has_role(array['teacher']) and public.can_manage_club(club_id));

commit;
