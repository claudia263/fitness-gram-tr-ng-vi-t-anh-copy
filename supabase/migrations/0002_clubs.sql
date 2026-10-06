-- Module Câu lạc bộ: vai trò cán bộ, CLB + lịch sinh hoạt, ảnh minh chứng (Storage) và duyệt của HR.
-- Chạy SAU 0001_init.sql, toàn bộ file trong Supabase Dashboard → SQL Editor.
--
-- Vai trò (profiles.role):
--   admin   : toàn quyền (dữ liệu thể lực + CLB)
--   lead    : Tổ trưởng Tổ Thể dục — quản lý CLB, lịch, chụp minh chứng mọi CLB
--   hr      : Phòng Nhân sự — xem kho ảnh, duyệt / từ chối minh chứng
--   teacher : giáo viên — chụp minh chứng cho CLB mình phụ trách
--   user    : tài khoản thường (không vào được khu vực cán bộ)

begin;

-- ---------------------------------------------------------------------------
-- Vai trò
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'lead', 'hr', 'teacher', 'user'));

create or replace function public.has_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = any (p_roles));
$$;

-- Gán sẵn vai trò theo email: khi người đó đăng ký / được tạo tài khoản, vai trò tự áp vào.
create table public.staff_invites (
  email text primary key check (email = lower(email)),
  role text not null check (role in ('admin', 'lead', 'hr', 'teacher')),
  full_name text,
  created_date timestamptz not null default now()
);
alter table public.staff_invites enable row level security;
create policy staff_invites_admin on public.staff_invites
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Tổ trưởng được mời giáo viên
create policy staff_invites_lead_read on public.staff_invites
  for select to authenticated using (public.has_role(array['lead']));
create policy staff_invites_lead_teacher on public.staff_invites
  for insert to authenticated with check (public.has_role(array['lead']) and role = 'teacher');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', (select full_name from public.staff_invites where email = lower(new.email)), ''),
    coalesce((select role from public.staff_invites where email = lower(new.email)), 'user')
  );
  return new;
end;
$$;

-- Mời người đã có tài khoản → cập nhật vai trò ngay
create or replace function public.apply_staff_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set role = new.role,
         full_name = case when coalesce(full_name, '') = '' then coalesce(new.full_name, '') else full_name end
   where lower(email) = new.email and role <> 'admin';
  return new;
end;
$$;

create trigger on_staff_invite
  after insert or update on public.staff_invites
  for each row execute function public.apply_staff_invite();

-- Cán bộ xem được hồ sơ của nhau (để phân công giáo viên phụ trách CLB)
create policy profiles_read_staff on public.profiles
  for select to authenticated
  using (role <> 'user' and public.has_role(array['admin', 'lead', 'hr', 'teacher']));

-- ---------------------------------------------------------------------------
-- Cấu hình: vị trí trường để kiểm tra khuôn viên
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_date timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy app_settings_read on public.app_settings for select to authenticated using (true);
create policy app_settings_write on public.app_settings
  for all to authenticated using (public.has_role(array['admin', 'lead'])) with check (public.has_role(array['admin', 'lead']));

-- Toạ độ gần đúng (đường Phan Huy Ích, P. An Hội Tây — OpenStreetMap). Sửa lại cho đúng cổng trường.
insert into public.app_settings (key, value) values
  ('school_location', '{"name": "Trường Việt Anh – CS Gò Vấp", "address": "160/72 Phan Huy Ích, P. An Hội Tây, TP.HCM", "lat": 10.83718, "lon": 106.63621, "radius": 150}');

-- ---------------------------------------------------------------------------
-- CLB & lịch sinh hoạt
-- ---------------------------------------------------------------------------
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null default 'other' check (sport in ('football', 'volleyball', 'badminton', 'basketball', 'bjj', 'dance', 'other')),
  levels text[] not null default '{}',
  teacher_name text,
  teacher_id uuid references public.profiles (id) on delete set null,
  expected_size integer check (expected_size is null or expected_size between 1 and 200),
  starts_on date,
  ends_on date,
  note text,
  source text not null default 'manual' check (source in ('tkb', 'manual')),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.club_slots (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  dow smallint not null check (dow between 0 and 6),
  start_time time not null,
  end_time time not null,
  place text not null,
  check (end_time > start_time),
  unique (club_id, dow)
);
create index on public.club_slots (club_id);

create trigger touch_updated_date before update on public.clubs
  for each row execute function public.touch_updated_date();

alter table public.clubs enable row level security;
alter table public.club_slots enable row level security;
create policy clubs_read on public.clubs for select to authenticated using (public.has_role(array['admin', 'lead', 'hr', 'teacher']));
create policy clubs_write on public.clubs for all to authenticated
  using (public.has_role(array['admin', 'lead'])) with check (public.has_role(array['admin', 'lead']));
create policy club_slots_read on public.club_slots for select to authenticated using (public.has_role(array['admin', 'lead', 'hr', 'teacher']));
create policy club_slots_write on public.club_slots for all to authenticated
  using (public.has_role(array['admin', 'lead'])) with check (public.has_role(array['admin', 'lead']));

-- ---------------------------------------------------------------------------
-- Minh chứng: mỗi CLB mỗi ngày một buổi; mỗi buổi nhiều ảnh
-- ---------------------------------------------------------------------------
create table public.evidence_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  session_date date not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (club_id, session_date)
);
create index on public.evidence_sessions (session_date);

create table public.evidence_photos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.evidence_sessions (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete cascade,
  taken_by uuid references public.profiles (id) on delete set null,
  taken_at timestamptz not null default now(),       -- giờ máy chủ lúc nhận ảnh
  device_time timestamptz,                           -- giờ in trên ảnh (giờ điện thoại)
  lat double precision,
  lon double precision,
  accuracy_m double precision,
  distance_m double precision,
  inside_campus boolean,
  storage_path text not null unique,
  code text not null unique,
  created_date timestamptz not null default now()
);
create index on public.evidence_photos (session_id);
create index on public.evidence_photos (club_id, taken_at desc);

create trigger touch_updated_date before update on public.evidence_sessions
  for each row execute function public.touch_updated_date();

alter table public.evidence_sessions enable row level security;
alter table public.evidence_photos enable row level security;
create policy evidence_sessions_read on public.evidence_sessions for select to authenticated using (public.has_role(array['admin', 'lead', 'hr', 'teacher']));
-- Duyệt / từ chối: HR và admin. Tạo buổi: chỉ qua hàm submit_evidence.
create policy evidence_sessions_review on public.evidence_sessions for update to authenticated
  using (public.has_role(array['admin', 'hr'])) with check (public.has_role(array['admin', 'hr']));
create policy evidence_photos_read on public.evidence_photos for select to authenticated using (public.has_role(array['admin', 'lead', 'hr', 'teacher']));
create policy evidence_photos_admin_delete on public.evidence_photos for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Kho ảnh (Supabase Storage, riêng tư). Đường dẫn: <uid người chụp>/<club_id>/<ngày>/<mã>.jpg
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 6291456, array['image/jpeg'])
on conflict (id) do nothing;

create policy evidence_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_role(array['admin', 'lead', 'teacher'])
  );
create policy evidence_read on storage.objects for select to authenticated
  using (bucket_id = 'evidence' and public.has_role(array['admin', 'lead', 'hr', 'teacher']));

-- ---------------------------------------------------------------------------
-- Ghi nhận ảnh sau khi tải lên: kiểm tra quyền, tính khoảng cách tới trường, mở/cập nhật buổi.
-- ---------------------------------------------------------------------------
create or replace function public.submit_evidence(
  p_club uuid,
  p_path text,
  p_code text,
  p_device_time timestamptz,
  p_lat double precision,
  p_lon double precision,
  p_accuracy double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club public.clubs;
  v_loc jsonb;
  v_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_session public.evidence_sessions;
  v_dist double precision;
  v_photo public.evidence_photos;
begin
  select * into v_club from public.clubs where id = p_club;
  if not found then
    raise exception 'Không tìm thấy CLB' using errcode = 'P0002';
  end if;
  if not (public.has_role(array['admin', 'lead']) or (public.has_role(array['teacher']) and v_club.teacher_id = auth.uid())) then
    raise exception 'Bạn không phụ trách CLB này' using errcode = '42501';
  end if;
  if split_part(p_path, '/', 1) <> auth.uid()::text
     or not exists (select 1 from storage.objects where bucket_id = 'evidence' and name = p_path) then
    raise exception 'Chưa tải ảnh lên kho' using errcode = '22023';
  end if;

  select value into v_loc from public.app_settings where key = 'school_location';
  if p_lat is not null and p_lon is not null and v_loc is not null then
    v_dist := 2 * 6371000 * asin(sqrt(
      power(sin(radians(p_lat - (v_loc ->> 'lat')::float8) / 2), 2) +
      cos(radians((v_loc ->> 'lat')::float8)) * cos(radians(p_lat)) *
      power(sin(radians(p_lon - (v_loc ->> 'lon')::float8) / 2), 2)
    ));
  end if;

  -- Buổi bị từ chối mà có ảnh mới → quay về chờ duyệt
  insert into public.evidence_sessions as es (club_id, session_date)
  values (p_club, v_date)
  on conflict (club_id, session_date) do update
    set status = case when es.status = 'rejected' then 'pending' else es.status end,
        reason = case when es.status = 'rejected' then null else es.reason end
  returning * into v_session;

  insert into public.evidence_photos (session_id, club_id, taken_by, device_time, lat, lon, accuracy_m, distance_m, inside_campus, storage_path, code)
  values (
    v_session.id, p_club, auth.uid(), p_device_time, p_lat, p_lon, p_accuracy, v_dist,
    case when v_dist is null then null else v_dist <= coalesce((v_loc ->> 'radius')::float8, 150) end,
    p_path, upper(p_code)
  )
  returning * into v_photo;

  return to_jsonb(v_photo) || jsonb_build_object('session_status', v_session.status);
end;
$$;

revoke all on function public.submit_evidence(uuid, text, text, timestamptz, double precision, double precision, double precision) from public;
grant execute on function public.submit_evidence(uuid, text, text, timestamptz, double precision, double precision, double precision) to authenticated;

-- ---------------------------------------------------------------------------
-- Dữ liệu: 13 CLB theo thời khoá biểu CLB thể thao CS Gò Vấp
-- ---------------------------------------------------------------------------
with c as (
  insert into public.clubs (name, sport, levels, teacher_name, expected_size, source, created_by)
  values
    ('Bóng đá THCS–THPT',       'football',   '{THCS,THPT}', null,             null, 'tkb', null),
    ('Bóng đá Tiểu học',        'football',   '{TH}',        'Thầy Hiếu',      null, 'tkb', null),
    ('Bóng chuyền THCS & THPT', 'volleyball', '{THCS,THPT}', 'Thầy Kiệt',      null, 'tkb', null),
    ('Cầu lông THCS',           'badminton',  '{THCS}',      'Thầy Kiệt',      null, 'tkb', null),
    ('Cầu lông THPT',           'badminton',  '{THPT}',      'Thầy Kiệt',      null, 'tkb', null),
    ('Cầu lông Tiểu học',       'badminton',  '{TH}',        'Thầy Tứ',        null, 'tkb', null),
    ('Bóng rổ Tiểu học',        'basketball', '{TH}',        'Thầy Tứ',        null, 'tkb', null),
    ('Bóng rổ THCS+THPT',       'basketball', '{THCS,THPT}', 'Thầy Kiệt',      null, 'tkb', null),
    ('BJJ Tiểu học',            'bjj',        '{TH}',        'Thầy Văn',       null, 'tkb', null),
    ('Nhảy THCS',               'dance',      '{THCS}',      'GV thỉnh giảng', null, 'tkb', null),
    ('Nhảy THPT',               'dance',      '{THPT}',      'GV thỉnh giảng', null, 'tkb', null),
    ('Nhảy Tiểu học 1–3',       'dance',      '{TH}',        'GV thỉnh giảng', null, 'tkb', null),
    ('Nhảy Tiểu học 4–5',       'dance',      '{TH}',        'GV thỉnh giảng', null, 'tkb', null)
  returning id, name
)
insert into public.club_slots (club_id, dow, start_time, end_time, place)
select c.id, s.dow, s.start_time::time, s.end_time::time, s.place
from c
join (values
  ('Bóng đá THCS–THPT', 1, '16:15', '17:30', 'Sân bóng'), ('Bóng đá THCS–THPT', 2, '16:15', '17:30', 'Sân bóng'),
  ('Bóng đá THCS–THPT', 3, '16:15', '17:30', 'Sân bóng'), ('Bóng đá THCS–THPT', 4, '16:15', '17:30', 'Sân bóng'),
  ('Bóng đá THCS–THPT', 5, '16:15', '17:30', 'Sân bóng'),
  ('Bóng đá Tiểu học', 2, '17:15', '18:30', 'Sân bóng'), ('Bóng đá Tiểu học', 5, '17:15', '18:30', 'Sân bóng'),
  ('Bóng chuyền THCS & THPT', 1, '17:45', '19:00', 'Sân bóng'), ('Bóng chuyền THCS & THPT', 3, '17:45', '19:00', 'Sân bóng'),
  ('Cầu lông THCS', 1, '16:15', '17:30', 'Lầu 5'), ('Cầu lông THCS', 3, '16:15', '17:30', 'Lầu 5'),
  ('Cầu lông THPT', 2, '16:15', '17:30', 'Lầu 5'), ('Cầu lông THPT', 4, '16:15', '17:30', 'Lầu 5'),
  ('Cầu lông Tiểu học', 1, '17:15', '19:00', 'Lầu 5'), ('Cầu lông Tiểu học', 3, '17:15', '19:00', 'Lầu 5'),
  ('Bóng rổ Tiểu học', 2, '17:15', '19:00', 'Lầu 5'), ('Bóng rổ Tiểu học', 4, '17:15', '19:00', 'Lầu 5'),
  ('Bóng rổ THCS+THPT', 2, '17:45', '19:00', 'Lầu 5'), ('Bóng rổ THCS+THPT', 4, '17:45', '19:00', 'Lầu 5'),
  ('Bóng rổ THCS+THPT', 5, '16:15', '17:30', 'Lầu 5'),
  ('BJJ Tiểu học', 1, '17:15', '18:30', 'Sàn võ'), ('BJJ Tiểu học', 2, '17:15', '18:30', 'Sàn võ'),
  ('BJJ Tiểu học', 3, '17:15', '18:30', 'Sàn võ'), ('BJJ Tiểu học', 4, '17:15', '18:30', 'Sàn võ'),
  ('BJJ Tiểu học', 5, '17:15', '18:30', 'Sàn võ'),
  ('Nhảy THCS', 1, '16:15', '17:30', 'Phòng Dance'), ('Nhảy THCS', 3, '16:15', '17:30', 'Phòng Dance'),
  ('Nhảy THPT', 2, '16:15', '17:30', 'Phòng Dance'), ('Nhảy THPT', 4, '16:15', '17:30', 'Phòng Dance'),
  ('Nhảy Tiểu học 1–3', 1, '17:15', '18:30', 'Phòng Dance'), ('Nhảy Tiểu học 1–3', 3, '17:15', '18:30', 'Phòng Dance'),
  ('Nhảy Tiểu học 4–5', 2, '17:15', '18:30', 'Phòng Dance'), ('Nhảy Tiểu học 4–5', 4, '17:15', '18:30', 'Phòng Dance')
) as s (club, dow, start_time, end_time, place) on s.club = c.name;

-- ---------------------------------------------------------------------------
-- Tài khoản cán bộ
-- ---------------------------------------------------------------------------
insert into public.staff_invites (email, role, full_name) values
  ('van.le@truongvietanh.com', 'lead', 'Tổ trưởng Tổ Thể dục')
on conflict (email) do update set role = excluded.role;

commit;
