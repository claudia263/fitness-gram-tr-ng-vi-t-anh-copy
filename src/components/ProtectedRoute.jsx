import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { STAFF_ROLES } from '@/lib/clubs/model';

// Cổng vào app, có 2 đường:
// 1. Phụ huynh/học sinh: đã tra cứu đúng tên học sinh (cờ sessionStorage "fg_entered")
// 2. Cán bộ nhà trường (quản trị, tổ trưởng, nhân sự, giáo viên): đã đăng nhập
export default function ProtectedRoute() {
  const { user, isAuthenticated } = useAuth();
  const entered = sessionStorage.getItem("fg_entered") === "true";
  const isStaff = isAuthenticated && STAFF_ROLES.includes(user?.role);

  if (entered || isStaff) {
    return <Outlet />;
  }
  return <Navigate to="/login" replace />;
}
