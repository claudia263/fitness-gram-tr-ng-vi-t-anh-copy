-- Đợt kiểm tra theo cơ sở: mỗi cơ sở đo một lần trong mỗi "đợt" chung của năm học.
-- Chạy SAU 0007_teacher_clubs.sql, toàn bộ file trong Supabase Dashboard → SQL Editor.
--
--   test_sessions.campus   : cơ sở của lần đo (khớp students.campus, vd "CS GVP")
--   test_sessions.round_no : đợt số mấy trong năm học (Đợt 1, Đợt 2…) — 2 cơ sở cùng đợt thì cùng số
--   test_sessions.end_date : ngày đo cuối (test_date là ngày bắt đầu)

begin;

alter table public.test_sessions
  add column if not exists campus text,
  add column if not exists round_no integer check (round_no is null or round_no between 1 and 12),
  add column if not exists end_date date;

alter table public.test_sessions drop constraint if exists test_sessions_end_after_start;
alter table public.test_sessions add constraint test_sessions_end_after_start check (end_date is null or end_date >= test_date);

-- Cơ sở của đợt đã có = cơ sở của phần đông học sinh có kết quả trong đợt
update public.test_sessions t
   set campus = (
     select s.campus
       from (select student_id from public.fitness_results where session_id = t.id
             union all
             select student_id from public.anthropometric_results where session_id = t.id) r
       join public.students s on s.id = r.student_id
      where s.campus is not null
      group by s.campus
      order by count(*) desc
      limit 1)
 where t.campus is null;

-- Đợt số: thứ tự theo ngày trong từng năm học và cơ sở
update public.test_sessions t
   set round_no = x.n
  from (select id, row_number() over (partition by school_year, coalesce(campus, '') order by test_date, created_date) as n
          from public.test_sessions) x
 where x.id = t.id and t.round_no is null;

commit;
