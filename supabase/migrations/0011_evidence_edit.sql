-- Minh chứng CLB: gỡ ảnh chụp sai ngày và bổ sung ảnh cho các ngày còn thiếu.
-- Chạy SAU 0010 (hoặc sau 0009 nếu chưa dùng 0010), toàn bộ file trong Supabase Dashboard → SQL Editor.
--
--   * remove_evidence_photo(ảnh, lý do): gỡ ảnh khỏi buổi. Admin gỡ được mọi ảnh; Tổ trưởng và
--     giáo viên phụ trách CLB chỉ gỡ khi buổi CHƯA được duyệt. Mỗi lần gỡ ghi vào evidence_removals
--     (ai, lúc nào, lý do). Tệp ảnh vẫn nằm trong kho riêng tư để đối chiếu khi cần.
--     Gỡ hết ảnh của một buổi thì buổi đó cũng biến mất (ngày đó lại tính là thiếu minh chứng).
--   * submit_evidence_late(...): bổ sung ảnh cho một ngày ĐÃ QUA (tối đa 30 ngày), đúng ngày CLB có lịch,
--     bắt buộc ghi lý do. Ảnh gắn nhãn "bổ sung" (late_reason) để Phòng Nhân sự thấy khi duyệt.
--     Buổi đã duyệt thì không thêm ảnh được.

begin;

alter table public.evidence_photos add column if not exists late_reason text;

create table if not exists public.evidence_removals (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null,
  code text not null,
  club_id uuid not null references public.clubs (id) on delete cascade,
  session_date date not null,
  storage_path text not null,
  taken_by uuid references public.profiles (id) on delete set null,
  taken_at timestamptz,
  removed_by uuid references public.profiles (id) on delete set null default auth.uid(),
  removed_at timestamptz not null default now(),
  reason text not null
);
create index if not exists evidence_removals_club_idx on public.evidence_removals (club_id, removed_at desc);
alter table public.evidence_removals enable row level security;
drop policy if exists evidence_removals_read on public.evidence_removals;
create policy evidence_removals_read on public.evidence_removals for select to authenticated
  using (public.has_role(array['admin', 'lead', 'hr']));

-- ---------------------------------------------------------------------------
-- Gỡ ảnh
-- ---------------------------------------------------------------------------
create or replace function public.remove_evidence_photo(p_photo uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_photo public.evidence_photos;
  v_session public.evidence_sessions;
  v_club public.clubs;
  v_left integer;
begin
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Cần ghi lý do gỡ ảnh' using errcode = '22023';
  end if;
  select * into v_photo from public.evidence_photos where id = p_photo;
  if not found then
    raise exception 'Không tìm thấy ảnh (có thể đã được gỡ)' using errcode = 'P0002';
  end if;
  select * into v_session from public.evidence_sessions where id = v_photo.session_id;
  select * into v_club from public.clubs where id = v_photo.club_id;

  if public.has_role(array['admin']) then
    null;
  elsif public.has_role(array['lead']) or (public.has_role(array['teacher']) and v_club.teacher_id = auth.uid()) then
    if v_session.status = 'approved' then
      raise exception 'Buổi này đã được duyệt, chỉ quản trị mới gỡ được ảnh' using errcode = '42501';
    end if;
  else
    raise exception 'Bạn không có quyền gỡ ảnh này' using errcode = '42501';
  end if;

  insert into public.evidence_removals (photo_id, code, club_id, session_date, storage_path, taken_by, taken_at, reason)
  values (v_photo.id, v_photo.code, v_photo.club_id, v_session.session_date, v_photo.storage_path, v_photo.taken_by, v_photo.taken_at, btrim(p_reason));

  delete from public.evidence_photos where id = v_photo.id;
  select count(*) into v_left from public.evidence_photos where session_id = v_session.id;
  if v_left = 0 then
    delete from public.evidence_sessions where id = v_session.id;
  end if;
  return jsonb_build_object('removed', true, 'session_deleted', v_left = 0);
end;
$$;

revoke all on function public.remove_evidence_photo(uuid, text) from public;
grant execute on function public.remove_evidence_photo(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Bổ sung ảnh cho ngày còn thiếu
-- ---------------------------------------------------------------------------
create or replace function public.submit_evidence_late(
  p_club uuid,
  p_date date,
  p_reason text,
  p_path text,
  p_code text,
  p_device_time timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club public.clubs;
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_session public.evidence_sessions;
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
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Cần ghi lý do bổ sung ảnh' using errcode = '22023';
  end if;
  if p_date is null or p_date >= v_today then
    raise exception 'Chỉ bổ sung cho các ngày đã qua. Ngày hôm nay hãy chụp trực tiếp' using errcode = '22023';
  end if;
  if p_date < v_today - 30 then
    raise exception 'Chỉ bổ sung trong 30 ngày gần nhất' using errcode = '22023';
  end if;
  if (v_club.starts_on is not null and p_date < v_club.starts_on) or (v_club.ends_on is not null and p_date > v_club.ends_on) then
    raise exception 'Ngày này nằm ngoài thời gian hoạt động của CLB' using errcode = '22023';
  end if;
  if not exists (select 1 from public.club_slots where club_id = p_club and dow = extract(dow from p_date)::smallint) then
    raise exception 'Ngày này CLB không có lịch sinh hoạt' using errcode = '22023';
  end if;

  select * into v_session from public.evidence_sessions where club_id = p_club and session_date = p_date;
  if found and v_session.status = 'approved' then
    raise exception 'Buổi này đã được duyệt, không thêm ảnh được' using errcode = '42501';
  end if;

  insert into public.evidence_sessions as es (club_id, session_date)
  values (p_club, p_date)
  on conflict (club_id, session_date) do update
    set status = case when es.status = 'rejected' then 'pending' else es.status end,
        reason = case when es.status = 'rejected' then null else es.reason end
  returning * into v_session;

  insert into public.evidence_photos (session_id, club_id, taken_by, device_time, storage_path, code, late_reason)
  values (v_session.id, p_club, auth.uid(), p_device_time, p_path, upper(p_code), btrim(p_reason))
  returning * into v_photo;

  return to_jsonb(v_photo) || jsonb_build_object('session_status', v_session.status);
end;
$$;

revoke all on function public.submit_evidence_late(uuid, date, text, text, text, timestamptz) from public;
grant execute on function public.submit_evidence_late(uuid, date, text, text, text, timestamptz) to authenticated;

commit;
