# Fitness Gram – Trường Việt Anh

Ứng dụng tra cứu kết quả kiểm tra thể lực (FitnessGram) và thể trạng (BMI theo WHO) của học sinh.

- **Phụ huynh**: nhập đúng họ tên học sinh để xem kết quả, không cần tài khoản.
- **Cán bộ nhà trường**: đăng nhập bằng email/mật khẩu (tài khoản có `role = 'admin'`) để nhập điểm, nhập file Excel và xem thống kê.

## Công nghệ

- Frontend: React + Vite + Tailwind (thư mục `src/`).
- Backend: Supabase (Postgres + Auth). Schema, RLS và các hàm RPC cho phụ huynh nằm trong [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
- Deploy: Docker + nginx trên Coolify.

## Chạy local

```bash
cp .env.example .env.local   # điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Kiểm tra trước khi đẩy code

```bash
npm run lint
npm run build
```

## Nhập dữ liệu từ file Excel

- Trên app: trang Quản trị → tạo đợt kiểm tra → chọn file Excel.
- Từ máy local (dùng service role key, chỉ đặt trong shell, không ghi vào file):

```bash
node scripts/import-excel.mjs "<file.xlsx>" --dry   # chạy thử, không ghi gì
```

Xem đầu file [`scripts/import-excel.mjs`](scripts/import-excel.mjs) để biết các biến môi trường.

## Triển khai

Xem [DEPLOY.md](DEPLOY.md).
