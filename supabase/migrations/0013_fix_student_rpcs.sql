-- SỬA LỖI sau 0012: hàm get_student báo "return type mismatch ... Final statement returns too few columns"
-- vì bảng students vừa có thêm cột `school` mà hàm (viết bằng `select *`) chưa được tạo lại.
-- Hậu quả: phụ huynh không mở được kết quả học sinh (cả Việt Anh lẫn MGIS). Chạy ngay file này.
-- An toàn: chỉ tạo lại hai hàm đọc, giữ nguyên quyền và dữ liệu.

begin;

create or replace function public.get_student(p_id text)
returns public.students
language sql
stable
security definer
set search_path = public
as $$
  select s.* from public.students s where s.id = p_id and public.can_view_student(p_id);
$$;

create or replace function public.my_students()
returns setof public.students
language sql
stable
security definer
set search_path = public
as $$
  select s.* from public.students s where s.email is not null and s.email = public.current_student_email();
$$;

revoke all on function public.get_student(text) from public;
revoke all on function public.my_students() from public;
grant execute on function public.get_student(text) to anon, authenticated;
grant execute on function public.my_students() to authenticated;

commit;

-- Kiểm tra: dán dòng sau, kết quả phải ra 1 dòng (không báo lỗi):
--   select id, full_name, school from public.get_student((select id from public.students limit 1));
