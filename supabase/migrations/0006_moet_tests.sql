-- Bài kiểm tra thể lực theo Quyết định 53/2008/QĐ-BGDĐT (Bộ GD&ĐT), lưu cùng kết quả FitnessGram của mỗi đợt.
-- Chạy SAU 0005_admin_data.sql, toàn bộ file trong Supabase Dashboard → SQL Editor.
--
-- Bắt buộc: bật xa tại chỗ, chạy tuỳ sức 5 phút. Trường chọn thêm: nằm ngửa gập bụng, chạy 30m XPC.
-- Lực bóp tay thuận và chạy con thoi 4x10m để sẵn cho trường hợp đổi bài tự chọn.
-- Bảng chuẩn Tốt / Đạt nằm trong app (src/lib/moetNorms.js); student_bundle tự trả về các cột mới.

begin;

alter table public.fitness_results
  add column if not exists long_jump_cm double precision check (long_jump_cm is null or long_jump_cm between 0 and 400),
  add column if not exists run_5min_m double precision check (run_5min_m is null or run_5min_m between 0 and 2500),
  add column if not exists situps_30s double precision check (situps_30s is null or situps_30s between 0 and 80),
  add column if not exists sprint_30m_s double precision check (sprint_30m_s is null or sprint_30m_s between 2 and 30),
  add column if not exists grip_strength_kg double precision check (grip_strength_kg is null or grip_strength_kg between 0 and 120),
  add column if not exists shuttle_4x10_s double precision check (shuttle_4x10_s is null or shuttle_4x10_s between 5 and 60);

comment on column public.fitness_results.long_jump_cm is 'QĐ 53 — Bật xa tại chỗ (cm), bắt buộc';
comment on column public.fitness_results.run_5min_m is 'QĐ 53 — Chạy tuỳ sức 5 phút (m), bắt buộc';
comment on column public.fitness_results.situps_30s is 'QĐ 53 — Nằm ngửa gập bụng (lần/30 giây)';
comment on column public.fitness_results.sprint_30m_s is 'QĐ 53 — Chạy 30m xuất phát cao (giây)';
comment on column public.fitness_results.grip_strength_kg is 'QĐ 53 — Lực bóp tay thuận (kg)';
comment on column public.fitness_results.shuttle_4x10_s is 'QĐ 53 — Chạy con thoi 4x10m (giây)';

insert into public.usage_features (key, ten, nhom) values
  ('xem_chuan_bo_gd', 'Xem bảng tiêu chuẩn thể lực Bộ GD&ĐT (QĐ 53)', 'chung')
on conflict (key) do nothing;

commit;
