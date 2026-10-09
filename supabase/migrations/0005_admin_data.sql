-- Trang "Dữ liệu" (admin) và trang "Cán bộ" (admin, Tổ trưởng): quản lý dữ liệu và tài khoản ngay trong app.
-- Chạy SAU 0004_club_members.sql, toàn bộ file trong Supabase Dashboard → SQL Editor.
--
-- Các bảng thể lực, CLB, staff_invites, app_settings đã cho admin ghi từ trước. File này bổ sung:
--   * admin sửa họ tên / vai trò tài khoản (profiles) — luôn giữ lại ít nhất 1 admin
--   * admin xoá buổi minh chứng (evidence_sessions)
--   * ghi nhận sử dụng cho Major OS

begin;

-- ---------------------------------------------------------------------------
-- Tài khoản: admin sửa được họ tên, vai trò
-- ---------------------------------------------------------------------------
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Không cho đổi email / id qua API, và không để hệ thống mất admin cuối cùng
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id <> old.id or new.email is distinct from old.email then
    raise exception 'Không sửa được email / mã tài khoản' using errcode = '42501';
  end if;
  if old.role = 'admin' and new.role <> 'admin'
     and not exists (select 1 from public.profiles where role = 'admin' and id <> old.id) then
    raise exception 'Phải còn ít nhất một tài khoản admin' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------------
-- Minh chứng: admin xoá buổi (ảnh trong buổi bị xoá theo)
-- ---------------------------------------------------------------------------
create policy evidence_sessions_admin_delete on public.evidence_sessions for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Ghi nhận sử dụng
-- ---------------------------------------------------------------------------
insert into public.usage_features (key, ten, nhom) values
  ('xem_du_lieu', 'Mở trang quản lý dữ liệu (admin)', 'can_bo'),
  ('sua_du_lieu', 'Thêm / sửa / xoá dữ liệu trên trang quản lý dữ liệu', 'can_bo'),
  ('xuat_du_lieu', 'Xuất Excel từ trang quản lý dữ liệu', 'can_bo'),
  ('xem_can_bo', 'Mở trang quản lý cán bộ', 'can_bo'),
  ('them_can_bo', 'Thêm cán bộ bằng email', 'can_bo'),
  ('doi_vai_tro_can_bo', 'Đổi vai trò cán bộ', 'can_bo'),
  ('go_quyen_can_bo', 'Gỡ quyền cán bộ', 'can_bo'),
  ('gan_clb_giao_vien', 'Gán CLB phụ trách cho giáo viên', 'can_bo')
on conflict (key) do nothing;

commit;
