# FitnessGram – Trường Việt Anh · Mô tả kết nối Major OS

Tài liệu tải lên **Major OS → Kết nối app → Thêm app**. Theo chuẩn "Kết nối app với Major OS — v2".

## 1. App làm gì, ai dùng

FitnessGram (https://fitness.truongvietanh.com) quản lý kết quả kiểm tra thể lực học sinh và hoạt động các câu lạc bộ thể thao của CS Gò Vấp.

| Người dùng | Cách vào app | Định danh gửi cho Major OS |
|---|---|---|
| Nhân viên: quản trị, Tổ trưởng Tổ Thể dục, Phòng Nhân sự, giáo viên | Đăng nhập email/mật khẩu hoặc Google `@truongvietanh.com` | `nguoi.email`, `nguoi.ten`, `nguoi.vai_tro` |
| Phụ huynh / học sinh | Không đăng nhập, tra cứu bằng họ tên học sinh | `hoc_sinh` (xem mục 4) |

App hiện câu: "Ứng dụng ghi nhận thời gian và tính năng sử dụng để cải thiện sản phẩm." ở trang đăng nhập và chân trang.

## 2. Kết nối

- Gốc: `https://fitness.truongvietanh.com/api/major-os`
- Phương thức: **GET**, trả **JSON** (UTF-8).
- Key: header `Authorization: Bearer <key>` (cũng nhận header `X-Major-Key: <key>` hoặc tham số `?key=<key>`). Key dạng `fgmos_…`, chỉ đọc báo cáo, thu hồi được.
- Thời gian: ISO 8601 **có múi giờ**. Trên URL nên mã hoá dấu `+` thành `%2B` (vd `2026-10-04T08:15:00%2B07:00`); nếu quên, dấu `+` bị đổi thành dấu cách và app vẫn tự hiểu đúng. Thiếu múi giờ (vd `2026-10-04T08:15:00` hoặc `2026-10-04`) thì hiểu là giờ Việt Nam. Mọi giá trị `luc` trả về theo giờ Việt Nam `+07:00`.
- Chỉ gửi các tham số có trong bảng của từng endpoint; tham số lạ → HTTP 404.
- Giới hạn: khoảng 60 lần gọi / phút, cho phép dồn 20 lần (vượt quá → HTTP 429).
- Lỗi: key sai hoặc đã thu hồi → HTTP 401 `{"code":"42501","message":"Key Major OS không hợp lệ hoặc đã bị thu hồi"}`; tham số sai → HTTP 400 kèm `message`.

## 3. Endpoint

### 3.1 `GET /su-dung` — sự kiện sử dụng

| Tham số | Bắt buộc | Ý nghĩa |
|---|---|---|
| `tu` | không | Lấy sự kiện có `luc >= tu`. Mặc định: 24 giờ trước |
| `den` | không | Lấy sự kiện có `luc < den`. Mặc định: bây giờ |
| `trang` | không | Giá trị `trang_sau` của lần gọi trước (con trỏ) |
| `gioi_han` | không | Số dòng mỗi trang, 1–1000, mặc định 500 |

Sắp xếp theo `luc` rồi `id` tăng dần. Hết dữ liệu khi `trang_sau` không có. Mỗi `id` cố định, gọi lại không sinh bản trùng.

Phản hồi mẫu (dữ liệu giả):

```json
{
  "du_lieu": [
    {
      "id": "3f2c7a1e-5b6d-4c8e-9f10-2a3b4c5d6e7f",
      "luc": "2026-10-07T17:22:05+07:00",
      "tinh_nang": "chup_minh_chung",
      "ten_tinh_nang": "Chụp ảnh minh chứng CLB",
      "so_lan": 1,
      "nguoi": { "email": "giao.vien@truongvietanh.com", "ten": "Nguyễn Văn A", "vai_tro": "teacher" },
      "chi_tiet": { "club_id": "7d1e…", "ma_anh": "VA-7K2Q-9F3M" }
    },
    {
      "id": "a8b9c0d1-e2f3-4a5b-8c6d-7e8f9a0b1c2d",
      "luc": "2026-10-07T20:05:40+07:00",
      "tinh_nang": "tra_cuu_ket_qua",
      "ten_tinh_nang": "Phụ huynh tra cứu kết quả theo tên học sinh",
      "so_lan": 1,
      "hoc_sinh": {
        "ma_app": "6a1f0c2e9b8d7e6f5a4b3c2d",
        "ho_ten": "Trần Thị B",
        "ngay_sinh": "2014-03-12",
        "gioi_tinh": "female",
        "khoi": "6",
        "lop": "6A1",
        "co_so": "CS GVP",
        "nam_hoc": "2026–2027"
      }
    },
    {
      "id": "c4d5e6f7-0819-4a2b-bc3d-4e5f6a7b8c9d",
      "luc": "2026-10-07T20:11:02+07:00",
      "tinh_nang": "phien_su_dung",
      "ten_tinh_nang": "Thời gian sử dụng app",
      "so_lan": 1,
      "so_phut": 5.4,
      "hoc_sinh": { "ma_app": "6a1f0c2e9b8d7e6f5a4b3c2d", "ho_ten": "Trần Thị B", "ngay_sinh": "2014-03-12" }
    }
  ],
  "trang_sau": "323032362d31302d30372032303a31313a30322b3037",
  "tu": "2026-10-07T00:00:00+07:00",
  "den": "2026-10-08T00:00:00+07:00"
}
```

### 3.2 `GET /canh-bao` — cảnh báo nghiệp vụ

| Tham số | Ý nghĩa |
|---|---|
| `tu`, `den` | Cảnh báo phát sinh trong khoảng (theo `luc`). Mặc định 24 giờ gần nhất |
| `trang_thai=dang_mo` | Bỏ qua `tu`/`den`, trả mọi cảnh báo **còn hiệu lực** (30 ngày gần nhất) — dùng để hiện bảng cảnh báo hiện tại |
| `trang`, `gioi_han` | Phân trang (`trang` = giá trị `trang_sau`) |

Cảnh báo được tính từ dữ liệu hiện có, `id` cố định theo đối tượng (gọi lại không trùng). Khi tình trạng được xử lý (vd đã có ảnh, đã duyệt) cảnh báo biến mất khỏi `dang_mo` hoặc `con_hieu_luc` thành `false`.

| `loai` | Khi nào | `muc_do` |
|---|---|---|
| `thieu_minh_chung` | Buổi sinh hoạt theo lịch đã kết thúc mà CLB chưa có ảnh minh chứng | trung_binh |
| `cho_duyet_qua_3_ngay` | Buổi có minh chứng nhưng Phòng Nhân sự chưa duyệt sau 3 ngày | thap |
| `anh_bi_gan_co` | Ảnh chụp ngoài khuôn viên trường (>150 m), không có GPS, giờ điện thoại lệch giờ máy chủ >5 phút, ngoài khung giờ (±15 phút) hoặc vào ngày không có lịch | cao (ngoài khuôn viên / lệch giờ) · trung_binh |
| `clb_chua_co_gv` | CLB chưa gán tài khoản giáo viên phụ trách | trung_binh |

Phản hồi mẫu:

```json
{
  "du_lieu": [
    {
      "id": "thieu_minh_chung:7d1e2f3a-…:2026-10-06",
      "loai": "thieu_minh_chung",
      "muc_do": "trung_binh",
      "luc": "2026-10-06T17:30:00+07:00",
      "con_hieu_luc": true,
      "tieu_de": "CLB Cầu lông THCS thiếu minh chứng buổi 06/10",
      "noi_dung": "Buổi 06/10/2026 16:15–17:30 tại Lầu 5 chưa có ảnh minh chứng.",
      "clb": { "id": "7d1e2f3a-…", "ten": "Cầu lông THCS" },
      "nguoi": { "ten": "Thầy Kiệt" },
      "chi_tiet": { "ngay": "2026-10-06", "dia_diem": "Lầu 5" }
    },
    {
      "id": "anh_bi_gan_co:5e6f7a8b-…",
      "loai": "anh_bi_gan_co",
      "muc_do": "cao",
      "luc": "2026-10-07T17:40:12+07:00",
      "con_hieu_luc": true,
      "tieu_de": "Ảnh minh chứng VA-7K2Q-9F3M bị gắn cờ",
      "noi_dung": "CLB Bóng đá Tiểu học: chụp ngoài khuôn viên trường (420 m).",
      "clb": { "id": "…", "ten": "Bóng đá Tiểu học" },
      "nguoi": { "email": "giao.vien@truongvietanh.com", "ten": "Nguyễn Văn A" },
      "chi_tiet": { "ma_anh": "VA-7K2Q-9F3M", "ly_do": ["ngoai_khuon_vien"], "khoang_cach_m": 420, "ngay": "2026-10-07", "trang_thai_duyet": "pending" }
    }
  ],
  "trang_sau": null
}
```

### 3.3 `GET /tinh-nang` — danh sách tính năng

Trả `{"du_lieu": [{"key": "...", "ten": "...", "nhom": "can_bo|phu_huynh|chung"}]}`.

## 4. Ý nghĩa các trường

| Trường | Ý nghĩa |
|---|---|
| `id` | Mã sự kiện / cảnh báo, cố định |
| `luc` | Thời điểm (giờ máy chủ, hiển thị `+07:00`) |
| `tinh_nang` | Khoá tính năng cố định (mục 5) |
| `so_lan` | Số lần. Với `nhap_excel_the_luc` = số dòng kết quả đã nhập |
| `so_phut` | Số phút dùng app (chỉ có ở `phien_su_dung`), tính khi tab đang mở, gửi mỗi 5 phút và khi rời trang |
| `nguoi` | Nhân viên: `email`, `ten`, `vai_tro` (`admin`, `lead` = Tổ trưởng, `hr` = Nhân sự, `teacher`) |
| `hoc_sinh` | Học sinh được phụ huynh tra cứu. **Chưa có mã trường** `VA-YYYY-NNNNN`: gửi `ma_app` (mã trong FitnessGram) cùng `ho_ten`, `ngay_sinh`, `gioi_tinh`, `khoi`, `lop`, `co_so`, `nam_hoc` để Major OS đối chiếu. Khi app có mã trường sẽ thêm `ma_truong` |
| `chi_tiet` | Thông tin thêm theo tính năng (vd `club_id`, `ma_anh`, `ly_do`) |

## 5. Danh sách tính năng

| Khoá | Tên hiển thị | Nhóm |
|---|---|---|
| `dang_nhap` | Đăng nhập cán bộ (`chi_tiet.cach`: `mat_khau` / `google`) | Nhân viên |
| `xem_quan_tri` | Xem trang quản trị thể lực | Nhân viên |
| `nhap_excel_the_luc` | Nhập file Excel kết quả thể lực | Nhân viên |
| `nhap_diem_the_luc` | Nhập điểm thể lực một học sinh | Nhân viên |
| `xem_danh_sach_clb` | Xem danh sách / thời khoá biểu CLB | Nhân viên |
| `xem_chi_tiet_clb` | Xem chi tiết CLB | Nhân viên |
| `them_clb` | Thêm CLB phát sinh | Nhân viên |
| `sua_clb` | Sửa CLB | Nhân viên |
| `xoa_clb` | Xoá CLB | Nhân viên |
| `chup_minh_chung` | Chụp ảnh minh chứng CLB | Nhân viên |
| `xem_kho_anh` | Xem kho ảnh minh chứng | Nhân viên |
| `xac_minh_ma_anh` | Xác minh mã ảnh | Nhân viên |
| `xem_duyet_minh_chung` | Mở trang duyệt minh chứng | Nhân viên |
| `duyet_minh_chung` | Phê duyệt buổi sinh hoạt CLB | Nhân viên |
| `tu_choi_minh_chung` | Từ chối minh chứng CLB | Nhân viên |
| `hoan_tac_duyet` | Hoàn tác duyệt minh chứng | Nhân viên |
| `tra_cuu_ket_qua` | Phụ huynh tra cứu kết quả theo tên học sinh | Phụ huynh |
| `xem_tong_quan` | Xem trang tổng quan học sinh | Phụ huynh |
| `xem_ket_qua` | Xem kết quả thể lực chi tiết | Phụ huynh |
| `xem_lich_su` | Xem lịch sử các đợt kiểm tra | Phụ huynh |
| `xem_ho_so` | Xem hồ sơ học sinh | Phụ huynh |
| `xuat_pdf` | Xuất báo cáo PDF | Phụ huynh |
| `phien_su_dung` | Thời gian sử dụng app (`so_phut`) | Chung |

## 6. Báo cáo muốn hiện trên Major OS

- Xếp hạng nhân viên theo số lần dùng / số phút; tính năng ít dùng.
- Số lượt phụ huynh tra cứu theo khối, lớp.
- Bảng cảnh báo đang mở (`/canh-bao?trang_thai=dang_mo`): CLB thiếu minh chứng, minh chứng chờ duyệt quá 3 ngày, ảnh bị gắn cờ, CLB chưa có giáo viên phụ trách.

## 7. Key

- Tạo key: Supabase → SQL Editor → `select public.major_os_tao_key('Major OS');` → key hiện **một lần**, dán ngay vào Major OS → Kết nối app. Không gửi qua chat, Zalo, email.
- Thu hồi: `select public.major_os_thu_hoi_key('<4 ký tự cuối>');`
- Đổi key: tạo key mới, dán vào Major OS, rồi thu hồi key cũ.

## 8. Liên hệ kỹ thuật

Người phụ trách app: _(điền tên, email)_ · Mã nguồn: `supabase/migrations/0003_major_os.sql`, `nginx.conf`, `src/lib/usage.js`.
