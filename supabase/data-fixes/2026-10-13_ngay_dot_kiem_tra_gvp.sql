-- Sửa ngày đợt "Kiểm tra Fitness CS GVP": đo từ 17/08 đến 24/08/2026 (trước nhập nhầm 01/06/2026, Học kỳ II).
-- Chạy SAU 0008_campus_rounds.sql (cần cột end_date), 1 lần trong Supabase Dashboard → SQL Editor.
--
-- Tuổi (tháng) tính lại theo ngày mới. Z-score BMI và tình trạng dinh dưỡng để trống:
-- app tự tính lại theo WHO 2007 từ ngày sinh + ngày kiểm tra khi hiển thị (lib/studentData.js → enrichAnthro).

begin;

with dot as (
  update public.test_sessions
     set test_date = '2026-08-17',
         end_date = '2026-08-24',
         semester = 'Học kỳ I',
         round_no = 1,
         notes = 'Đo từ 17/08 đến 24/08/2026'
   where name ilike 'Kiểm tra Fitness CS GVP%'
     and test_date = '2026-06-01'
  returning id
)
update public.anthropometric_results a
   set age_months = (extract(year from age(date '2026-08-17', s.birth_date)) * 12
                     + extract(month from age(date '2026-08-17', s.birth_date)))::int,
       bmi_for_age_zscore = null,
       nutritional_status = null
  from public.students s
 where a.session_id in (select id from dot)
   and s.id = a.student_id;

commit;

-- Kiểm tra: mỗi đợt, cơ sở, ngày đo và số học sinh có số đo
select t.name, t.campus, t.round_no as dot, t.test_date, t.end_date, t.semester, count(distinct a.student_id) as so_hoc_sinh_co_so_do
  from public.test_sessions t
  left join public.anthropometric_results a on a.session_id = t.id
 group by t.id
 order by t.school_year, t.round_no, t.campus;
