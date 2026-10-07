// Lớp tương thích: giữ nguyên API `base44.entities / auth` mà các trang đang dùng,
// nhưng chạy trên Supabase. Nhờ vậy không phải sửa từng trang.
import { createClient } from '@supabase/supabase-js';
import { createEntities } from './entities';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY (xem .env.example).');
}

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseAnonKey || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const entities = createEntities(supabase);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const authError = (message, status = 401) => Object.assign(new Error(message), { status });

const auth = {
  async me() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) throw authError('Not authenticated');
    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      role: profile?.role || 'user',
    };
  },
  async isAuthenticated() {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw authError(error.message);
    return { access_token: data.session?.access_token };
  },
  async register({ email, password }) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw authError(error.message, 400);
  },
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
    if (error) throw authError(error.message, 400);
    return { access_token: data.session?.access_token };
  },
  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw authError(error.message, 400);
  },
  setToken() {
    // Supabase tự lưu session; giữ hàm này để tương thích.
  },
  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw authError(error.message, 400);
  },
  // Link khôi phục của Supabase tự tạo session tạm; chỉ cần đặt mật khẩu mới.
  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw authError(error.message, 400);
  },
  async loginWithProvider(provider, redirectTo, queryParams) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: new URL(redirectTo || '/', window.location.origin).href, queryParams },
    });
    if (error) throw authError(error.message, 400);
  },
  // Các nhà cung cấp đăng nhập đang bật trên Supabase, vd { email: true, google: false }
  async providers() {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseAnonKey } });
      const data = await res.json();
      return data.external || {};
    } catch (e) {
      return {};
    }
  },
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    sessionStorage.removeItem('fg_entered');
    sessionStorage.removeItem('fg_student_ids');
    if (redirectUrl) window.location.href = '/login';
  },
  redirectToLogin() {
    window.location.href = '/login';
  },
};

// ---------------------------------------------------------------------------
// RPC cho phụ huynh (không cần đăng nhập) — xem supabase/migrations/0001_init.sql
// ---------------------------------------------------------------------------
const fail = (error) => {
  throw Object.assign(new Error(error.message), { status: error.status, code: error.code, data: error });
};

const rpc = async (fn, args) => {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) fail(error);
  return data;
};

export const base44 = { entities, auth, rpc };
