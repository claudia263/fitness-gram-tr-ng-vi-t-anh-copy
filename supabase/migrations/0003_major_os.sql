-- Kết nối Major OS: ghi nhận sử dụng + API báo cáo / cảnh báo đọc bằng key.
-- Chạy SAU 0002_clubs.sql, toàn bộ file trong Supabase Dashboard → SQL Editor.
-- Mô tả cho Major OS: docs/major-os.md

begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Danh mục tính năng (khoá cố định → tên hiển thị)
-- ---------------------------------------------------------------------------
create table public.usage_features (
  key text primary key,
  ten text not null,
  nhom text not null check (nhom in ('can_bo', 'phu_huynh', 'chung'))
);
alter table public.usage_features enable row level security;
create policy usage_features_read on public.usage_features for select using (true);

insert into public.usage_features (key, ten, nhom) values
  ('dang_nhap', 'Đăng nhập cán bộ', 'can_bo'),
  ('xem_quan_tri', 'Xem trang quản trị thể lực', 'can_bo'),
  ('nhap_excel_the_luc', 'Nhập file Excel kết quả thể lực', 'can_bo'),
  ('nhap_diem_the_luc', 'Nhập điểm thể lực một học sinh', 'can_bo'),
  ('xem_danh_sach_clb', 'Xem danh sách / thời khoá biểu CLB', 'can_bo'),
  ('xem_chi_tiet_clb', 'Xem chi tiết CLB', 'can_bo'),
  ('them_clb', 'Thêm CLB phát sinh', 'can_bo'),
  ('sua_clb', 'Sửa CLB', 'can_bo'),
  ('xoa_clb', 'Xoá CLB', 'can_bo'),
  ('chup_minh_chung', 'Chụp ảnh minh chứng CLB', 'can_bo'),
  ('xem_kho_anh', 'Xem kho ảnh minh chứng', 'can_bo'),
  ('xac_minh_ma_anh', 'Xác minh mã ảnh', 'can_bo'),
  ('xem_duyet_minh_chung', 'Mở trang duyệt minh chứng', 'can_bo'),
  ('duyet_minh_chung', 'Phê duyệt buổi sinh hoạt CLB', 'can_bo'),
  ('tu_choi_minh_chung', 'Từ chối minh chứng CLB', 'can_bo'),
  ('hoan_tac_duyet', 'Hoàn tác duyệt minh chứng', 'can_bo'),
  ('tra_cuu_ket_qua', 'Phụ huynh tra cứu kết quả theo tên học sinh', 'phu_huynh'),
  ('xem_tong_quan', 'Xem trang tổng quan học sinh', 'phu_huynh'),
  ('xem_ket_qua', 'Xem kết quả thể lực chi tiết', 'phu_huynh'),
  ('xem_lich_su', 'Xem lịch sử các đợt kiểm tra', 'phu_huynh'),
  ('xem_ho_so', 'Xem hồ sơ học sinh', 'phu_huynh'),
  ('xuat_pdf', 'Xuất báo cáo PDF', 'phu_huynh'),
  ('phien_su_dung', 'Thời gian sử dụng app', 'chung');

-- ---------------------------------------------------------------------------
-- Sự kiện sử dụng. Cán bộ: user_id. Phụ huynh (không đăng nhập): student_id của học sinh được tra cứu.
-- ---------------------------------------------------------------------------
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  luc timestamptz not null default now(),
  user_id uuid references public.profiles (id) on delete set null,
  student_id text,
  tinh_nang text not null references public.usage_features (key),
  so_lan integer not null default 1,
  so_phut numeric,
  chi_tiet jsonb
);
create index on public.usage_events (luc, id);
alter table public.usage_events enable row level security;
create policy usage_events_admin_read on public.usage_events for select to authenticated using (public.is_admin());

-- App gọi hàm này để ghi một sự kiện (bỏ qua im lặng nếu không hợp lệ)
create or replace function public.log_usage(
  p_tinh_nang text,
  p_student_id text default null,
  p_so_lan integer default 1,
  p_so_phut numeric default null,
  p_chi_tiet jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nhom text;
  v_staff boolean := public.has_role(array['admin', 'lead', 'hr', 'teacher']);
  v_so_phut numeric := case when p_so_phut is null then null else least(greatest(p_so_phut, 0), 120) end;
begin
  select nhom into v_nhom from public.usage_features where key = p_tinh_nang;
  if v_nhom is null then
    return;
  end if;
  if v_staff then
    insert into public.usage_events (user_id, tinh_nang, so_lan, so_phut, chi_tiet)
    values (auth.uid(), p_tinh_nang, least(greatest(coalesce(p_so_lan, 1), 1), 100000), v_so_phut,
            case when pg_column_size(p_chi_tiet) <= 2000 then p_chi_tiet end);
    return;
  end if;
  if v_nhom = 'can_bo' or p_student_id is null or not exists (select 1 from public.students where id = p_student_id) then
    return;
  end if;
  insert into public.usage_events (student_id, tinh_nang, so_lan, so_phut)
  values (p_student_id, p_tinh_nang, least(greatest(coalesce(p_so_lan, 1), 1), 100), v_so_phut);
end;
$$;
revoke all on function public.log_usage(text, text, integer, numeric, jsonb) from public;
grant execute on function public.log_usage(text, text, integer, numeric, jsonb) to anon, authenticated;

-- Thao tác ghi dữ liệu được ghi nhận ngay trên máy chủ
create or replace function public.usage_from_evidence_photo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usage_events (luc, user_id, tinh_nang, chi_tiet)
  values (new.taken_at, new.taken_by, 'chup_minh_chung', jsonb_build_object('club_id', new.club_id, 'ma_anh', new.code));
  return new;
end;
$$;
create trigger usage_evidence_photo after insert on public.evidence_photos
  for each row execute function public.usage_from_evidence_photo();

create or replace function public.usage_from_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and auth.uid() is not null and public.has_role(array['admin', 'hr']) then
    insert into public.usage_events (user_id, tinh_nang, chi_tiet)
    values (
      auth.uid(),
      case new.status when 'approved' then 'duyet_minh_chung' when 'rejected' then 'tu_choi_minh_chung' else 'hoan_tac_duyet' end,
      jsonb_strip_nulls(jsonb_build_object('club_id', new.club_id, 'ngay', new.session_date, 'ly_do', new.reason))
    );
  end if;
  return new;
end;
$$;
create trigger usage_review after update on public.evidence_sessions
  for each row execute function public.usage_from_review();

create or replace function public.usage_from_club()
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
    insert into public.usage_events (user_id, tinh_nang, chi_tiet) values (auth.uid(), 'xoa_clb', jsonb_build_object('club_id', old.id, 'ten_clb', old.name));
  else
    insert into public.usage_events (user_id, tinh_nang, chi_tiet)
    values (auth.uid(), case tg_op when 'INSERT' then 'them_clb' else 'sua_clb' end, jsonb_build_object('club_id', new.id, 'ten_clb', new.name));
  end if;
  return null;
end;
$$;
create trigger usage_club after insert or update or delete on public.clubs
  for each row execute function public.usage_from_club();

-- ---------------------------------------------------------------------------
-- Key cho Major OS: chỉ lưu mã băm SHA-256 và 4 ký tự cuối
-- ---------------------------------------------------------------------------
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  key_hash text not null unique,
  last4 text not null,
  tao_luc timestamptz not null default now(),
  thu_hoi_luc timestamptz
);
alter table public.api_keys enable row level security; -- không ai đọc qua API

-- Tạo key mới (chỉ chạy được trong SQL Editor). Key hiện ra MỘT lần: dán ngay vào Major OS → Kết nối app.
create or replace function public.major_os_tao_key(p_ten text default 'Major OS')
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text := 'fgmos_' || encode(extensions.gen_random_bytes(24), 'hex');
begin
  insert into public.api_keys (ten, key_hash, last4)
  values (p_ten, encode(extensions.digest(v_key, 'sha256'), 'hex'), right(v_key, 4));
  return v_key;
end;
$$;

-- Thu hồi key theo 4 ký tự cuối (chỉ chạy được trong SQL Editor)
create or replace function public.major_os_thu_hoi_key(p_last4 text)
returns integer
language sql
security definer
set search_path = public
as $$
  with r as (update public.api_keys set thu_hoi_luc = now() where last4 = p_last4 and thu_hoi_luc is null returning 1)
  select count(*)::int from r;
$$;

revoke all on function public.major_os_tao_key(text) from public, anon, authenticated;
revoke all on function public.major_os_thu_hoi_key(text) from public, anon, authenticated;

-- Key gửi qua header (Authorization: Bearer … được nginx chuyển thành x-major-key) hoặc tham số ?key=
create or replace function public.major_os_key_header()
returns text
language sql
stable
as $$
  select nullif(regexp_replace(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-major-key', ''), '^\s*Bearer\s+', '', 'i'), '');
$$;

create or replace function public.major_os_xac_thuc(p_key text)
returns void
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if p_key is null or not exists (
    select 1 from public.api_keys where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') and thu_hoi_luc is null
  ) then
    raise exception 'Key Major OS không hợp lệ hoặc đã bị thu hồi' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.major_os_thoi_gian(p text)
returns timestamptz
language plpgsql
stable
as $$
declare
  -- dấu + chưa mã hoá trên URL bị đổi thành dấu cách: "…T08:15:00 07:00" → "…T08:15:00+07:00"
  v text := regexp_replace(btrim(p), '([0-9]:[0-9]{2}(:[0-9]{2})?(\.[0-9]+)?)\s+([0-9]{2}(:?[0-9]{2})?)$', '\1+\4');
begin
  if p is null or btrim(p) = '' then
    return null;
  end if;
  if v ~ '[0-9]:[0-9]{2}' and v ~* '(z|[+-][0-9]{2}(:?[0-9]{2})?)$' then
    return v::timestamptz;
  end if;
  return v::timestamp at time zone 'Asia/Ho_Chi_Minh'; -- không ghi múi giờ → hiểu là giờ Việt Nam
exception when others then
  raise exception 'Tham số thời gian không hợp lệ: % (dùng ISO 8601 có múi giờ, vd 2026-10-04T08:15:00+07:00)', p using errcode = '22007';
end;
$$;

create or replace function public.major_os_iso(p timestamptz)
returns text
language sql
immutable
as $$
  select to_char(p at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD"T"HH24:MI:SS') || '+07:00';
$$;

-- ---------------------------------------------------------------------------
-- API 1: sự kiện sử dụng. GET /api/major-os/su-dung?tu=&den=&trang=&gioi_han=
-- ---------------------------------------------------------------------------
create or replace function public.major_os_su_dung(
  tu text default null,
  den text default null,
  trang text default null,
  gioi_han integer default 500,
  key text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_tu timestamptz;
  v_den timestamptz;
  v_lim integer := least(greatest(coalesce(gioi_han, 500), 1), 1000);
  v_cur_luc timestamptz;
  v_cur_id uuid;
  v_rows jsonb;
  v_next text;
  v_more boolean;
begin
  perform public.major_os_xac_thuc(coalesce(nullif(key, ''), public.major_os_key_header()));
  v_tu := coalesce(public.major_os_thoi_gian(tu), now() - interval '1 day');
  v_den := coalesce(public.major_os_thoi_gian(den), now());
  if nullif(trang, '') is not null then
    begin
      v_cur_luc := split_part(convert_from(decode(trang, 'hex'), 'utf8'), '|', 1)::timestamptz;
      v_cur_id := split_part(convert_from(decode(trang, 'hex'), 'utf8'), '|', 2)::uuid;
    exception when others then
      raise exception 'Tham số trang không hợp lệ' using errcode = '22023';
    end;
  end if;

  with page as (
    select e.*
    from public.usage_events e
    where e.luc >= v_tu and e.luc < v_den
      and (v_cur_luc is null or (e.luc, e.id) > (v_cur_luc, v_cur_id))
    order by e.luc, e.id
    limit v_lim + 1
  ), numbered as (
    select p.*, row_number() over (order by p.luc, p.id) as rn from page p
  )
  select
    coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id', n.id,
      'luc', public.major_os_iso(n.luc),
      'tinh_nang', n.tinh_nang,
      'ten_tinh_nang', f.ten,
      'so_lan', n.so_lan,
      'so_phut', n.so_phut,
      'nguoi', case when pr.id is not null then jsonb_build_object('email', pr.email, 'ten', pr.full_name, 'vai_tro', pr.role) end,
      'hoc_sinh', case when s.id is not null then jsonb_build_object(
        'ma_app', s.id, 'ma_truong', s.student_code, 'ho_ten', s.full_name, 'ngay_sinh', s.birth_date, 'gioi_tinh', s.sex,
        'khoi', s.grade, 'lop', cl.name, 'co_so', s.campus, 'nam_hoc', s.school_year) end,
      'chi_tiet', n.chi_tiet
    )) order by n.luc, n.id) filter (where n.rn <= v_lim), '[]'::jsonb),
    max(case when n.rn = v_lim then encode(convert_to(n.luc::text || '|' || n.id::text, 'utf8'), 'hex') end),
    coalesce(bool_or(n.rn > v_lim), false)
  into v_rows, v_next, v_more
  from numbered n
  left join public.usage_features f on f.key = n.tinh_nang
  left join public.profiles pr on pr.id = n.user_id
  left join public.students s on s.id = n.student_id
  left join public.classes cl on cl.id = s.class_id;

  return jsonb_build_object('du_lieu', v_rows, 'trang_sau', case when v_more then v_next end, 'tu', public.major_os_iso(v_tu), 'den', public.major_os_iso(v_den));
end;
$$;

-- ---------------------------------------------------------------------------
-- Cảnh báo nghiệp vụ (tính từ dữ liệu hiện có)
-- ---------------------------------------------------------------------------
create or replace function public.major_os_canh_bao_tat_ca(p_from date)
returns table (
  id text, loai text, muc_do text, luc timestamptz, con_hieu_luc boolean,
  tieu_de text, noi_dung text, club_id uuid, nguoi_id uuid, nguoi_ten text, chi_tiet jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with nl as (
    select (now() at time zone 'Asia/Ho_Chi_Minh') as ts, (now() at time zone 'Asia/Ho_Chi_Minh')::date as d
  ),
  days as (
    select g::date as d from nl, generate_series(p_from, nl.d, interval '1 day') g
  ),
  missing as (
    select c.id as club_id, c.name, c.teacher_id, c.teacher_name, s.start_time, s.end_time, s.place, dd.d
    from days dd
    join public.club_slots s on s.dow = extract(dow from dd.d)::int
    join public.clubs c on c.id = s.club_id
    cross join nl
    where dd.d >= (c.created_date at time zone 'Asia/Ho_Chi_Minh')::date
      and (c.starts_on is null or dd.d >= c.starts_on)
      and (c.ends_on is null or dd.d <= c.ends_on)
      and (dd.d < nl.d or s.end_time <= nl.ts::time)
      and not exists (select 1 from public.evidence_sessions e where e.club_id = c.id and e.session_date = dd.d)
  ),
  flagged as (
    select p.*, e.status, e.session_date, c.name as club_name,
      array_remove(array[
        case when p.inside_campus = false then 'ngoai_khuon_vien' end,
        case when p.inside_campus is null then 'khong_co_gps' end,
        case when p.device_time is not null and abs(extract(epoch from p.device_time - p.taken_at)) > 300 then 'gio_may_lech' end,
        case
          when not exists (select 1 from public.club_slots s where s.club_id = p.club_id and s.dow = extract(dow from p.taken_at at time zone 'Asia/Ho_Chi_Minh')::int) then 'ngoai_lich'
          when not exists (
            select 1 from public.club_slots s
            where s.club_id = p.club_id and s.dow = extract(dow from p.taken_at at time zone 'Asia/Ho_Chi_Minh')::int
              and (p.taken_at at time zone 'Asia/Ho_Chi_Minh')::time between s.start_time - interval '15 minutes' and s.end_time + interval '15 minutes'
          ) then 'ngoai_khung_gio'
        end
      ], null) as ly_do
    from public.evidence_photos p
    join public.evidence_sessions e on e.id = p.session_id
    join public.clubs c on c.id = p.club_id
    where p.taken_at >= (p_from::timestamp at time zone 'Asia/Ho_Chi_Minh')
  )
  select 'thieu_minh_chung:' || m.club_id || ':' || m.d, 'thieu_minh_chung', 'trung_binh',
    (m.d + m.end_time) at time zone 'Asia/Ho_Chi_Minh', true,
    'CLB ' || m.name || ' thiếu minh chứng buổi ' || to_char(m.d, 'DD/MM'),
    'Buổi ' || to_char(m.d, 'DD/MM/YYYY') || ' ' || to_char(m.start_time, 'HH24:MI') || '–' || to_char(m.end_time, 'HH24:MI') || ' tại ' || m.place || ' chưa có ảnh minh chứng.',
    m.club_id, m.teacher_id, m.teacher_name, jsonb_build_object('ngay', m.d, 'dia_diem', m.place)
  from missing m
  union all
  select 'cho_duyet_qua_3_ngay:' || e.id, 'cho_duyet_qua_3_ngay', 'thap',
    ((e.session_date + 3)::timestamp) at time zone 'Asia/Ho_Chi_Minh', true,
    'Minh chứng CLB ' || c.name || ' chờ duyệt quá 3 ngày',
    'Buổi ' || to_char(e.session_date, 'DD/MM/YYYY') || ' có ' || (select count(*) from public.evidence_photos p where p.session_id = e.id) || ' ảnh, Phòng Nhân sự chưa duyệt.',
    c.id, c.teacher_id, c.teacher_name,
    jsonb_build_object('ngay', e.session_date, 'so_anh', (select count(*) from public.evidence_photos p where p.session_id = e.id))
  from public.evidence_sessions e
  join public.clubs c on c.id = e.club_id
  cross join nl
  where e.status = 'pending' and e.session_date <= nl.d - 3
  union all
  select 'anh_bi_gan_co:' || f.id, 'anh_bi_gan_co',
    case when f.ly_do && array['ngoai_khuon_vien', 'gio_may_lech'] then 'cao' else 'trung_binh' end,
    f.taken_at, f.status = 'pending',
    'Ảnh minh chứng ' || f.code || ' bị gắn cờ',
    'CLB ' || f.club_name || ': ' || (
      select string_agg(case x
        when 'ngoai_khuon_vien' then 'chụp ngoài khuôn viên trường (' || round(f.distance_m) || ' m)'
        when 'khong_co_gps' then 'không có vị trí GPS'
        when 'gio_may_lech' then 'giờ điện thoại lệch giờ máy chủ'
        when 'ngoai_lich' then 'chụp vào ngày CLB không có lịch'
        else 'chụp ngoài khung giờ sinh hoạt' end, ', ')
      from unnest(f.ly_do) x
    ) || '.',
    f.club_id, f.taken_by, null,
    jsonb_strip_nulls(jsonb_build_object('ma_anh', f.code, 'ly_do', to_jsonb(f.ly_do), 'khoang_cach_m', round(f.distance_m), 'ngay', f.session_date, 'trang_thai_duyet', f.status))
  from flagged f
  where cardinality(f.ly_do) > 0
  union all
  select 'clb_chua_co_gv:' || c.id, 'clb_chua_co_gv', 'trung_binh', c.created_date, true,
    'CLB ' || c.name || ' chưa gán tài khoản giáo viên',
    'Chưa có tài khoản giáo viên phụ trách nên chỉ Tổ trưởng chụp được minh chứng' || coalesce(' (trên lịch ghi: ' || c.teacher_name || ')', '') || '.',
    c.id, null, c.teacher_name, jsonb_strip_nulls(jsonb_build_object('ten_tren_lich', c.teacher_name))
  from public.clubs c
  cross join nl
  where c.teacher_id is null and (c.ends_on is null or c.ends_on >= nl.d);
$$;
revoke all on function public.major_os_canh_bao_tat_ca(date) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- API 2: cảnh báo. GET /api/major-os/canh-bao?tu=&den=  hoặc ?trang_thai=dang_mo
-- ---------------------------------------------------------------------------
create or replace function public.major_os_canh_bao(
  tu text default null,
  den text default null,
  trang_thai text default null,
  trang text default null,
  gioi_han integer default 500,
  key text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_open boolean := coalesce(trang_thai, '') = 'dang_mo';
  v_tu timestamptz;
  v_den timestamptz;
  v_off integer;
  v_lim integer := least(greatest(coalesce(gioi_han, 500), 1), 1000);
  v_rows jsonb;
  v_total integer;
begin
  perform public.major_os_xac_thuc(coalesce(nullif(key, ''), public.major_os_key_header()));
  v_tu := coalesce(public.major_os_thoi_gian(tu), now() - interval '1 day');
  v_den := coalesce(public.major_os_thoi_gian(den), now());
  begin
    v_off := greatest(coalesce(nullif(trang, '')::integer, 0), 0);
  exception when others then
    raise exception 'Tham số trang không hợp lệ' using errcode = '22023';
  end;

  with a as (
    select x.*
    from public.major_os_canh_bao_tat_ca(
      case when v_open then (now() at time zone 'Asia/Ho_Chi_Minh')::date - 30 else (v_tu at time zone 'Asia/Ho_Chi_Minh')::date end
    ) x
    where case when v_open then x.con_hieu_luc else x.luc >= v_tu and x.luc < v_den end
  ), counted as (
    select a.*, count(*) over () as total, row_number() over (order by a.luc, a.id) as rn from a
  )
  select
    coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id', k.id,
      'loai', k.loai,
      'muc_do', k.muc_do,
      'luc', public.major_os_iso(k.luc),
      'con_hieu_luc', k.con_hieu_luc,
      'tieu_de', k.tieu_de,
      'noi_dung', k.noi_dung,
      'clb', jsonb_build_object('id', c.id, 'ten', c.name),
      'nguoi', case
        when pr.id is not null then jsonb_build_object('email', pr.email, 'ten', pr.full_name)
        when k.nguoi_ten is not null then jsonb_build_object('ten', k.nguoi_ten)
      end,
      'chi_tiet', k.chi_tiet
    )) order by k.rn) filter (where k.rn > v_off and k.rn <= v_off + v_lim), '[]'::jsonb),
    max(k.total)
  into v_rows, v_total
  from counted k
  left join public.clubs c on c.id = k.club_id
  left join public.profiles pr on pr.id = k.nguoi_id;

  return jsonb_build_object(
    'du_lieu', v_rows,
    'trang_sau', case when coalesce(v_total, 0) > v_off + v_lim then (v_off + v_lim)::text end,
    'tu', case when v_open then null else public.major_os_iso(v_tu) end,
    'den', case when v_open then null else public.major_os_iso(v_den) end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- API 3: danh sách tính năng. GET /api/major-os/tinh-nang
-- ---------------------------------------------------------------------------
create or replace function public.major_os_tinh_nang(key text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  perform public.major_os_xac_thuc(coalesce(nullif(key, ''), public.major_os_key_header()));
  return jsonb_build_object('du_lieu', (
    select coalesce(jsonb_agg(jsonb_build_object('key', f.key, 'ten', f.ten, 'nhom', f.nhom) order by f.nhom, f.key), '[]'::jsonb)
    from public.usage_features f
  ));
end;
$$;

revoke all on function public.major_os_su_dung(text, text, text, integer, text) from public;
revoke all on function public.major_os_canh_bao(text, text, text, text, integer, text) from public;
revoke all on function public.major_os_tinh_nang(text) from public;
grant execute on function public.major_os_su_dung(text, text, text, integer, text) to anon, authenticated;
grant execute on function public.major_os_canh_bao(text, text, text, text, integer, text) to anon, authenticated;
grant execute on function public.major_os_tinh_nang(text) to anon, authenticated;
revoke all on function public.major_os_xac_thuc(text) from public, anon, authenticated;

commit;
