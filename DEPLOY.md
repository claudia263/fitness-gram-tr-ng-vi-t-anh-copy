# Triển khai: Supabase + Coolify

## 1. Supabase (một lần)

1. **SQL Editor** → dán toàn bộ [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → Run, sau đó làm tương tự với [`0002_clubs.sql`](supabase/migrations/0002_clubs.sql) (module CLB: vai trò cán bộ, CLB theo TKB, kho ảnh minh chứng `evidence`).
2. **Authentication → URL Configuration**
   - Site URL: `https://<domain-của-bạn>`
   - Redirect URLs: thêm `https://<domain-của-bạn>/**`
3. **Authentication → Email Templates → Confirm signup**: nếu muốn xác thực bằng mã 6 số (như trang Đăng ký đang làm), thêm `{{ .Token }}` vào nội dung email.
4. (Tuỳ chọn) **Authentication → Providers → Google**: bật và điền Client ID/Secret nếu dùng nút "Đăng nhập bằng Google".
5. Tạo tài khoản quản trị: đăng ký trên app (hoặc Authentication → Users → Add user), rồi chạy trong SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'email-cua-ban@truongvietanh.com';
   ```
6. Cấp quyền cán bộ cho module CLB (`lead` = Tổ trưởng Tổ Thể dục, `hr` = Phòng Nhân sự, `teacher` = giáo viên). Gán theo email, trước hay sau khi người đó có tài khoản đều được — vai trò tự áp vào:
   ```sql
   insert into public.staff_invites (email, role, full_name) values ('ten@truongvietanh.com', 'hr', 'Phòng Nhân sự')
   on conflict (email) do update set role = excluded.role;
   ```
   Sau đó tạo tài khoản ở **Authentication → Users → Add user → Create new user** (tick *Auto Confirm User*). Toạ độ trường dùng để kiểm tra khuôn viên nằm ở bảng `app_settings` (key `school_location`).

## 2. Coolify

1. **New Resource → Public/Private Repository** → chọn repo này, branch `main`.
2. **Build Pack: Dockerfile**, Port: `80`.
3. **Environment Variables** — đánh dấu **Build Variable** cho cả hai:
   - `VITE_SUPABASE_URL` = `https://rqmritgxlukyzubfduos.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = anon key (Settings → API)
4. **Domains**: `https://<domain-của-bạn>` (Coolify tự cấp SSL).
5. Deploy. Đổi biến môi trường thì phải **Redeploy** vì Vite nhúng giá trị lúc build.

> Không đưa `service_role` key vào Coolify của frontend. Key này chỉ dùng cho script di chuyển dữ liệu chạy trên máy bạn.

## 3. Chạy local

```bash
cp .env.example .env.local   # điền URL + anon key
npm install
npm run dev
```
