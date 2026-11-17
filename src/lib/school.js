// Nhiều trường dùng chung một hệ thống:
//   fitness.truongvietanh.com        → Trường Việt Anh
//   fitness.truongvietanh.com/mgis   → Mê Kông Xanh (MGIS), dữ liệu và quản trị riêng
// Trường được xác định theo đường dẫn khi mở trang. Dữ liệu tách ở cơ sở dữ liệu (cột `school`, migration 0012).
import { STAFF_ROLES } from "./clubs/model.js";

const onMgis = typeof window !== "undefined" && /^\/mgis(\/|$)/.test(window.location.pathname);

export const SCHOOLS = {
  vietanh: {
    id: "vietanh",
    name: "Trường Việt Anh",
    basename: "",
    defaultCampus: "",
    staffDomain: "truongvietanh.com",
    tagline: "Hành trình khỏe mạnh – Tương lai vững vàng",
    appName: "Fitness Gram",
    fitnessgram: true, // có chương trình Fitness Gram (PACER, Sit & Reach, Push-up, Plank, thể trạng)
    color: "#26275D",
  },
  mgis: {
    id: "mgis",
    name: "Mê Kông Xanh (MGIS)",
    basename: "/mgis",
    defaultCampus: "MGIS",
    staffDomain: "",
    tagline: "Theo dõi phát triển thể chất học sinh",
    appName: "Kiểm tra thể lực QĐ 53",
    fitnessgram: false, // chỉ 6 bài test theo QĐ 53/2008 của Bộ GD&ĐT
    // Màu tạm, thay bằng nhận diện chính thức của MGIS khi có
    color: "#0E5A43",
  },
};

export const SCHOOL = onMgis ? SCHOOLS.mgis : SCHOOLS.vietanh;
export const IS_MAIN_SCHOOL = SCHOOL.id === "vietanh";
export const BASENAME = SCHOOL.basename;

// Đường dẫn / địa chỉ đầy đủ trong trang của trường hiện tại (dùng cho chuyển trang cứng và liên kết đăng nhập)
export const appPath = (p = "/") => (BASENAME ? (p === "/" ? BASENAME : `${BASENAME}${p}`) : p);
export const appUrl = (p = "/") => `${window.location.origin}${appPath(p)}`;

// Bản ghi (học sinh, lớp, đợt kiểm tra) thuộc trường hiện tại? Dữ liệu cũ chưa có cột = Việt Anh.
export const inSchool = (row) => (row?.school || "vietanh") === SCHOOL.id;

// Vai trò người dùng được dùng trên trang này, hoặc null (coi như phụ huynh):
//   admin         : chủ hệ thống, vào được mọi trang
//   school_admin  : chỉ trang của đúng trường mình
//   lead/hr/teacher (CLB) : chỉ trang Việt Anh
export function siteRole(user) {
  const r = user?.role;
  if (!r) return null;
  if (r === "admin") return "admin";
  if (r === "school_admin") return user.school === SCHOOL.id ? "school_admin" : null;
  return IS_MAIN_SCHOOL && STAFF_ROLES.includes(r) ? r : null;
}
