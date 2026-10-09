import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import AdminRoute from '@/components/fg/AdminRoute';
import ProtectedRoute from '@/components/ProtectedRoute';
import { RoleProvider } from '@/lib/RoleContext';
import { StudentProvider } from '@/lib/StudentContext';
import AppLayout from '@/components/fg/AppLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import LookupHome from '@/pages/LookupHome';
import Results from '@/pages/Results';
import History from '@/pages/History';
import Profile from '@/pages/Profile';
import TeacherDashboard from '@/pages/TeacherDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminData from '@/pages/AdminData';
import StaffRoute from '@/components/fg/StaffRoute';
import Clubs from '@/pages/Clubs';
import ClubDetail from '@/pages/ClubDetail';
import EvidenceArchive from '@/pages/EvidenceArchive';
import EvidenceReview from '@/pages/EvidenceReview';
import Staff from '@/pages/Staff';
import { CLUB_MANAGERS, REVIEWERS, STAFF_ROLES } from '@/lib/clubs/model';
import { startUsageClock } from '@/lib/usage';
import { useEffect } from 'react';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<LookupHome />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/teacher" element={<AdminRoute><TeacherDashboard /></AdminRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/du-lieu" element={<AdminRoute><AdminData /></AdminRoute>} />
          <Route path="/clb" element={<StaffRoute roles={STAFF_ROLES}><Clubs /></StaffRoute>} />
          <Route path="/clb/kho-anh" element={<StaffRoute roles={STAFF_ROLES}><EvidenceArchive /></StaffRoute>} />
          <Route path="/clb/duyet" element={<StaffRoute roles={REVIEWERS}><EvidenceReview /></StaffRoute>} />
          <Route path="/clb/:id" element={<StaffRoute roles={STAFF_ROLES}><ClubDetail /></StaffRoute>} />
          <Route path="/can-bo" element={<StaffRoute roles={CLUB_MANAGERS}><Staff /></StaffRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  useEffect(() => startUsageClock(), []);

  return (
    <AuthProvider>
      <RoleProvider>
        <StudentProvider>
          <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          </QueryClientProvider>
        </StudentProvider>
      </RoleProvider>
    </AuthProvider>
  )
}

export default App