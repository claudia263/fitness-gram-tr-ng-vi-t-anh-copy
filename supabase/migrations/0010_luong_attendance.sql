-- Điểm danh buổi CLB + gửi sang app Lương (luong.truongvietanh.com).
-- Chạy SAU 0009, toàn bộ file trong Supabase Dashboard → SQL Editor.
--
-- Luồng: giáo viên điểm danh (RPC save_attendance) → xếp lô vào luong_outbox → cron mỗi phút gửi
-- POST /api/webhooks/diem-danh bằng pg_net → ghi nhận kết quả, thử lại 1/5/15/60 phút khi lỗi tạm thời.
--
-- AN TOÀN: mặc định TẮT (app_settings.luong.enabled = false). Chưa gửi gì cho đến khi admin bật
-- sau khi đã lưu khoá API vào Vault (xem docs/luong-integration.md). Khoá KHÔNG nằm trong file này.
-- Chỉ gửi đúng các trường tài liệu quy định: date, group, slot_start, student_code, present.

begin;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- Mã học sinh dùng chung (mã gốc của Việt Anh Class, vd VAGV-HS101) và mã CLB gửi sang Lương
-- ---------------------------------------------------------------------------
create unique index if not exists students_student_code_uq on public.students (student_code)
  where student_code is not null and student_code <> '';

alter table public.clubs add column if not exists luong_group text;
comment on column public.clubs.luong_group is
  'Tên/mã nhóm gửi sang app Lương (phải trùng tên nhóm trong lịch tuần bên Lương). Trống = "CLB <tên CLB>".';

-- ---------------------------------------------------------------------------
-- Điểm danh: mỗi (CLB, ngày, giờ bắt đầu) một buổi; mỗi hội viên một dòng có mặt / vắng
-- ---------------------------------------------------------------------------
create table public.club_attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  session_date date not null,
  slot_start time not null,
  revision integer not null default 1,
  marked_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (club_id, session_date, slot_start)
);
create index on public.club_attendance_sessions (session_date);

create table public.club_attendance (
  session_id uuid not null references public.club_attendance_sessions (id) on delete cascade,
  member_id uuid not null references public.club_members (id) on delete cascade,
  present boolean not null,
  primary key (session_id, member_id)
);

create trigger touch_updated_date before update on public.club_attendance_sessions
  for each row execute function public.touch_updated_date();

alter table public.club_attendance_sessions enable row level security;
alter table public.club_attendance enable row level security;
create policy attendance_sessions_read on public.club_attendance_sessions for select to authenticated
  using (public.has_role(array['admin', 'lead', 'hr', 'teacher']));
create policy attendance_read on public.club_attendance for select to authenticated
  using (public.has_role(array['admin', 'lead', 'hr', 'teacher']));
-- Ghi: chỉ qua save_attendance (không có policy insert/update/delete)

-- ---------------------------------------------------------------------------
-- Hàng chờ gửi sang app Lương
-- ---------------------------------------------------------------------------
create table public.luong_outbox (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.club_attendance_sessions (id) on delete set null,
  batch_ref text not null unique,
  payload jsonb not null,
  record_count integer not null,
  skipped_no_code integer not null default 0,        -- hội viên chưa có mã học sinh chung nên không gửi được
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'dead')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  request_id bigint,
  last_status integer,
  last_error text,
  response jsonb,
  sent_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index on public.luong_outbox (status, next_attempt_at);
create index on public.luong_outbox (session_id);

create trigger touch_updated_date before update on public.luong_outbox
  for each row execute function public.touch_updated_date();

alter table public.luong_outbox enable row level security;
create policy luong_outbox_read on public.luong_outbox for select to authenticated
  using (public.has_role(array['admin', 'lead', 'hr']));

-- Cấu hình (không chứa khoá). Mặc định TẮT.
insert into public.app_settings (key, value)
values ('luong', '{"enabled": false, "url": "https://luong.truongvietanh.com/api/webhooks/diem-danh", "unit": "VAGV"}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Xếp lô gửi cho một buổi điểm danh (lô trùng nội dung → cùng batch_ref → không xếp lại)
-- ---------------------------------------------------------------------------
create or replace function public.luong_enqueue_session(p_session uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  cfg jsonb;
  s public.club_attendance_sessions;
  grp text;
  recs jsonb;
  skipped integer;
  ref text;
begin
  select value into cfg from public.app_settings where key = 'luong';
  if not coalesce((cfg ->> 'enabled')::boolean, false) then
    return;
  end if;

  select * into s from public.club_attendance_sessions where id = p_session;
  if not found then
    return;
  end if;
  select coalesce(nullif(trim(c.luong_group), ''), 'CLB ' || c.name) into grp from public.clubs c where c.id = s.club_id;

  -- Chỉ gửi hội viên đã có mã học sinh chung; hội viên nhập tay / chưa có mã được đếm vào skipped
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'date', to_char(s.session_date, 'YYYY-MM-DD'),
          'group', grp,
          'slot_start', to_char(s.slot_start, 'HH24:MI'),
          'student_code', st.student_code,
          'present', a.present
        ) order by st.student_code
      ) filter (where st.student_code is not null and st.student_code <> ''),
      '[]'::jsonb
    ),
    count(*) filter (where st.student_code is null or st.student_code = '')
  into recs, skipped
  from public.club_attendance a
  join public.club_members m on m.id = a.member_id
  left join public.students st on st.id = m.student_id
  where a.session_id = s.id;

  if jsonb_array_length(recs) = 0 then
    return;
  end if;

  ref := 'fitness-' || coalesce(cfg ->> 'unit', 'VAGV') || '-' || to_char(s.session_date, 'YYYY-MM-DD') || '-' || left(md5(recs::text), 10);

  insert into public.luong_outbox (session_id, batch_ref, payload, record_count, skipped_no_code)
  values (s.id, ref, jsonb_build_object('batch_ref', ref, 'records', recs), jsonb_array_length(recs), coalesce(skipped, 0))
  on conflict (batch_ref) do nothing;
end;
$$;

-- Quét lại các buổi gần đây (cron 22:00 mỗi ngày): bù những buổi chưa được xếp lô
create or replace function public.luong_enqueue_recent(p_days integer default 7)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
begin
  for r in select id from public.club_attendance_sessions where session_date >= (now() at time zone 'Asia/Ho_Chi_Minh')::date - p_days loop
    perform public.luong_enqueue_session(r.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Giáo viên điểm danh. p_marks: [{"member_id": "<uuid>", "present": true|false}, …] — phải đủ MỌI hội viên
-- (tài liệu yêu cầu gửi cả người vắng).
-- ---------------------------------------------------------------------------
create or replace function public.save_attendance(p_club uuid, p_date date, p_slot time, p_marks jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  rev integer;
  total integer;
  marked integer;
  n_present integer;
  changed boolean;
begin
  if auth.uid() is null or not public.can_manage_club(p_club) then
    raise exception 'Bạn không có quyền điểm danh CLB này' using errcode = '42501';
  end if;
  if p_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'Không điểm danh trước cho buổi chưa diễn ra' using errcode = '22023';
  end if;
  if jsonb_typeof(p_marks) <> 'array' then
    raise exception 'Dữ liệu điểm danh không hợp lệ' using errcode = '22023';
  end if;

  select count(*) into total from public.club_members where club_id = p_club;
  select count(distinct (e ->> 'member_id')) into marked
    from jsonb_array_elements(p_marks) e
    where exists (select 1 from public.club_members m where m.id = (e ->> 'member_id')::uuid and m.club_id = p_club);
  if total = 0 then
    raise exception 'CLB chưa có học viên để điểm danh' using errcode = '22023';
  end if;
  if marked <> total or jsonb_array_length(p_marks) <> total then
    raise exception 'Cần đánh dấu có mặt hoặc vắng cho tất cả % học viên', total using errcode = '22023';
  end if;

  select id, revision into sid, rev from public.club_attendance_sessions where club_id = p_club and session_date = p_date and slot_start = p_slot;
  if sid is null then
    insert into public.club_attendance_sessions (club_id, session_date, slot_start) values (p_club, p_date, p_slot) returning id into sid;
    rev := 1;
    insert into public.club_attendance (session_id, member_id, present)
      select sid, (e ->> 'member_id')::uuid, (e ->> 'present')::boolean from jsonb_array_elements(p_marks) e;
  else
    select exists (
      select 1 from jsonb_array_elements(p_marks) e
      left join public.club_attendance a on a.session_id = sid and a.member_id = (e ->> 'member_id')::uuid
      where a.present is distinct from (e ->> 'present')::boolean
    ) into changed;
    if changed then
      delete from public.club_attendance where session_id = sid;
      insert into public.club_attendance (session_id, member_id, present)
        select sid, (e ->> 'member_id')::uuid, (e ->> 'present')::boolean from jsonb_array_elements(p_marks) e;
      rev := rev + 1;
      update public.club_attendance_sessions set revision = rev, marked_by = auth.uid() where id = sid;
    end if;
  end if;

  select count(*) into n_present from public.club_attendance where session_id = sid and present;
  perform public.luong_enqueue_session(sid);
  return jsonb_build_object('session_id', sid, 'revision', rev, 'present', n_present, 'absent', total - n_present);
end;
$$;

-- ---------------------------------------------------------------------------
-- Bộ gửi: lấy khoá từ Vault, gọi webhook bằng pg_net (bất đồng bộ), thu kết quả ở lượt sau
-- ---------------------------------------------------------------------------
create or replace function public.luong_send_due()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  cfg jsonb;
  k text;
  r record;
  rid bigint;
  n integer := 0;
begin
  select value into cfg from public.app_settings where key = 'luong';
  if not coalesce((cfg ->> 'enabled')::boolean, false) then
    return 0;
  end if;
  select decrypted_secret into k from vault.decrypted_secrets where name = 'luong_api_key' limit 1;
  if k is null or k = '' then
    return 0;
  end if;

  for r in
    select * from public.luong_outbox
     where status in ('pending', 'failed') and next_attempt_at <= now() and attempts < 5
     order by created_date
     limit 20
     for update skip locked
  loop
    rid := net.http_post(
      url := cfg ->> 'url',
      body := r.payload,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || k),
      timeout_milliseconds := 20000
    );
    update public.luong_outbox set status = 'sending', attempts = attempts + 1, request_id = rid where id = r.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Thu kết quả: 200/201 → đã gửi; 401 → dừng và tắt; 400/413/422 → lỗi dữ liệu (không tự thử lại);
-- 429/5xx/hết giờ → thử lại 1, 5, 15, 60 phút (tối đa 5 lần).
create or replace function public.luong_collect()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  resp record;
  body jsonb;
  backoff integer[] := array[1, 5, 15, 60, 60]; -- phút chờ sau lần gửi thứ 1, 2, 3, 4, 5
  n integer := 0;
begin
  for r in select * from public.luong_outbox where status = 'sending' loop
    select * into resp from net._http_response where id = r.request_id;
    if not found then
      if r.updated_date < now() - interval '10 minutes' then
        update public.luong_outbox
           set status = case when attempts >= 5 then 'dead' else 'failed' end,
               last_error = 'Không nhận được phản hồi', next_attempt_at = now() + make_interval(mins => backoff[least(attempts, 5)])
         where id = r.id;
        n := n + 1;
      end if;
      continue;
    end if;

    begin
      body := resp.content::jsonb;
    exception when others then
      body := null;
    end;

    if resp.status_code in (200, 201) then
      update public.luong_outbox
         set status = 'sent', sent_at = now(), last_status = resp.status_code, last_error = null,
             response = jsonb_strip_nulls(jsonb_build_object(
               'duplicate', body -> 'duplicate', 'accepted', body -> 'accepted', 'matched_students', body -> 'matched_students',
               'unknown_students', body -> 'unknown_students', 'reconciliation', body -> 'reconciliation'))
       where id = r.id;
    elsif resp.status_code = 401 then
      update public.luong_outbox set status = 'dead', last_status = 401, last_error = 'Khoá API bị từ chối (401)' where id = r.id;
      update public.app_settings set value = value || '{"enabled": false, "disabled_reason": "401: khoá API sai hoặc đã thu hồi"}'::jsonb where key = 'luong';
    elsif resp.status_code in (400, 413, 422) then
      update public.luong_outbox set status = 'dead', last_status = resp.status_code, last_error = left(coalesce(resp.content, ''), 2000) where id = r.id;
    else
      update public.luong_outbox
         set status = case when attempts >= 5 then 'dead' else 'failed' end,
             last_status = resp.status_code,
             last_error = left(coalesce(resp.error_msg, resp.content, 'Lỗi tạm thời'), 500),
             next_attempt_at = now() + make_interval(mins => backoff[least(attempts, 5)])
       where id = r.id;
    end if;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Quản trị: bật/tắt gửi, đặt mã đơn vị. Chỉ bật được khi đã có khoá trong Vault.
create or replace function public.luong_cau_hinh(p_enabled boolean, p_unit text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  has_key boolean;
begin
  if not public.is_admin() then
    raise exception 'Chỉ quản trị viên được đổi cấu hình này' using errcode = '42501';
  end if;
  select exists (select 1 from vault.decrypted_secrets where name = 'luong_api_key' and decrypted_secret <> '') into has_key;
  if p_enabled and not has_key then
    raise exception 'Chưa có khoá API trong Vault (luong_api_key)' using errcode = '22023';
  end if;
  update public.app_settings
     set value = (value - 'disabled_reason') || jsonb_build_object('enabled', p_enabled)
                 || case when p_unit is not null then jsonb_build_object('unit', p_unit) else '{}'::jsonb end
   where key = 'luong';
  return (select value || jsonb_build_object('has_key', has_key) from public.app_settings where key = 'luong');
end;
$$;

-- Trạng thái cho màn hình (không lộ khoá): cấu hình, có khoá hay chưa, số lô theo trạng thái
create or replace function public.luong_trang_thai()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when not public.has_role(array['admin', 'lead', 'hr']) then null else
    (select value from public.app_settings where key = 'luong')
    || jsonb_build_object(
         'has_key', exists (select 1 from vault.decrypted_secrets where name = 'luong_api_key' and decrypted_secret <> ''),
         'counts', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from public.luong_outbox group by status) t), '{}'::jsonb))
  end;
$$;

-- Thử gửi lại một lô lỗi (admin)
create or replace function public.luong_thu_lai(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Chỉ quản trị viên được thử lại' using errcode = '42501';
  end if;
  update public.luong_outbox set status = 'pending', attempts = 0, next_attempt_at = now(), last_error = null where id = p_id and status in ('dead', 'failed');
end;
$$;

-- Hội viên nào của CLB đã có mã học sinh chung (giáo viên không đọc trực tiếp bảng students)
create or replace function public.club_member_codes(p_club uuid)
returns table (member_id uuid, has_code boolean)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, (st.student_code is not null and st.student_code <> '')
    from public.club_members m
    left join public.students st on st.id = m.student_id
   where m.club_id = p_club
     and public.has_role(array['admin', 'lead', 'hr', 'teacher']);
$$;

revoke all on function public.luong_enqueue_session(uuid) from public, anon, authenticated;
revoke all on function public.luong_enqueue_recent(integer) from public, anon, authenticated;
revoke all on function public.luong_send_due() from public, anon, authenticated;
revoke all on function public.luong_collect() from public, anon, authenticated;
revoke all on function public.save_attendance(uuid, date, time, jsonb) from public, anon;
revoke all on function public.luong_cau_hinh(boolean, text) from public, anon;
revoke all on function public.luong_trang_thai() from public, anon;
revoke all on function public.luong_thu_lai(uuid) from public, anon;
revoke all on function public.club_member_codes(uuid) from public, anon;
grant execute on function public.club_member_codes(uuid) to authenticated;
grant execute on function public.save_attendance(uuid, date, time, jsonb) to authenticated;
grant execute on function public.luong_cau_hinh(boolean, text) to authenticated;
grant execute on function public.luong_trang_thai() to authenticated;
grant execute on function public.luong_thu_lai(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Lịch chạy (pg_cron, giờ UTC): mỗi phút gửi + thu kết quả; 22:00 giờ VN (15:00 UTC) quét lại 7 ngày
-- ---------------------------------------------------------------------------
do $$
begin
  perform cron.unschedule('luong-tick');
exception when others then null;
end $$;
do $$
begin
  perform cron.unschedule('luong-quet-lai');
exception when others then null;
end $$;
select cron.schedule('luong-tick', '* * * * *', $cron$select public.luong_collect(); select public.luong_send_due();$cron$);
select cron.schedule('luong-quet-lai', '0 15 * * *', $cron$select public.luong_enqueue_recent(7);$cron$);

commit;
