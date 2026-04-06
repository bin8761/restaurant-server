// BUG-012: Dùng sessionStorage thay localStorage để giảm nguy cơ XSS đánh cắp token.
// Token sẽ bị xóa khi đóng tab/trình duyệt thay vì tồn tại vĩnh viễn.
const TOKEN_KEY = 'customer_token';
const USER_KEY  = 'customer_user';

function saveAuth(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

// Đăng xuất: gọi backend để blacklist token, sau đó xóa storage
async function logout() {
  const token = getToken();
  if (token) {
    try {
      await fetch(API_BASE + '/api/users/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
    } catch (_) { /* bỏ qua lỗi mạng */ }
  }
  clearAuth();
  window.location.href = '/login/';
}

// Gọi trước khi render trang cần đăng nhập
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login/?redirect=' + encodeURIComponent(window.location.pathname);
  }
}

// Gọi API với token tự động
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login/';
    return;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // Prefer explicit message; fall back to joining all field-level validation errors
    const msg = data.message
      || Object.values(data).filter(v => typeof v === 'string').join(' | ')
      || ('Lỗi ' + res.status);
    throw new Error(msg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
