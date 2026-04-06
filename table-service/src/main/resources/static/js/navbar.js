// Render navbar vào element có id="navbar"
function renderNavbar() {
  const user = getUser();
  const el = document.getElementById('navbar');
  if (!el) return;

  el.innerHTML = `
    <nav class="bg-white border-b shadow-sm sticky top-0 z-50">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" class="font-bold text-orange-600 text-lg">🍽️ Nhà hàng</a>
        <div class="flex items-center gap-5 text-sm">
          <a href="/menu/" class="text-gray-600 hover:text-orange-600 transition">Thực đơn</a>
          <a href="/booking/" class="text-gray-600 hover:text-orange-600 transition">Đặt bàn</a>
          ${user ? `
            <a href="/my-reservations/" class="text-gray-600 hover:text-orange-600 transition">Đặt bàn của tôi</a>
            <span class="text-gray-400">|</span>
            <span class="text-gray-700 font-medium">${escHtml(user.fullName || user.username)}</span>
            <button onclick="logout()" class="text-red-500 hover:text-red-700 transition">Đăng xuất</button>
          ` : `
            <a href="/login/" class="text-gray-600 hover:text-orange-600 transition">Đăng nhập</a>
            <a href="/register/" class="bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700 transition">Đăng ký</a>
          `}
        </div>
      </div>
    </nav>`;
}

function logout() {
  clearAuth();
  window.location.href = '/login/';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
