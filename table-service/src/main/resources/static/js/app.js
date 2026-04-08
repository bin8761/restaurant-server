const state = {
  tableId: null,
  tableKey: null,
  deviceSession: null,   // lÄ‚â€ Ă‚Â°u Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă†â€™ dĂ„â€Ă‚Â¹ng cho watchdog, khĂ„â€Ă‚Â´ng cÄ‚Â¡Ă‚ÂºĂ‚Â§n gÄ‚Â¡Ă‚Â»Ă‚Âi lÄ‚Â¡Ă‚ÂºĂ‚Â¡i getDeviceSession() nhiÄ‚Â¡Ă‚Â»Ă‚Âu lÄ‚Â¡Ă‚ÂºĂ‚Â§n
  table: null,
  menuCategories: [],
  buffetFoodCategories: [],
  buffetDrinkCategories: [],
  buffetPackages: [],
  cart: [],
  orders: [],
  summary: null,
  selectedCategoryId: 'all',
  selectedBuffetPackage: null,
  isBuffetActive: false,
  currentTab: 'menu',
  orderMode: null,
  modalFood: null,
  modalQuantity: 1,
  socket: null,
  itemStatuses: {},
  paymentMethod: 'cash',
  sepayPollingTimer: null,
  sepayTransactionRef: null,
  imagesEnabled: null,
};

const recentToasts = new Map();
const recentSocketEvents = new Map();
const WATCHDOG_INTERVAL_MS = 15000;
const WATCHDOG_NET_ERR_TOLERANCE = 3;
let _watchdogTimer = null;
let _watchdogNetErrStreak = 0;

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    // Support both formats: QR generates 'tableId'/'tableKey', fallback to 'table_id'/'key'
    tableId: params.get('tableId') || params.get('table_id'),
    tableKey: params.get('tableKey') || params.get('key'),
  };
}

function getDeviceSession() {
  const storageKey = 'aurora_device_session';
  let sessionId = window.localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
}

async function fetchJson(url, options = {}) {
  const fullUrl = url.startsWith('/api') ? getGatewayUrl() + url : url;
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || 'Co loi xay ra';
    throw new Error(message);
  }

  return data;
}

function getGatewayUrl() {
  const fromConfig = typeof window.API_BASE === 'string' ? window.API_BASE.trim() : '';
  if (fromConfig) return fromConfig.replace(/\/+$/, '');

  const fromRuntime = typeof window.GATEWAY_URL === 'string' ? window.GATEWAY_URL.trim() : '';
  if (fromRuntime) return fromRuntime.replace(/\/+$/, '');

  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (isLocal) return `${window.location.protocol}//${window.location.host.replace(':3011', ':3000')}`;

  return 'https://gateway-production-16f9.up.railway.app';
}

function buildImageUrl(imageUrl) {
  if (!imageUrl) return '';
  
  const baseUrl = getGatewayUrl();

  const apiIdx = imageUrl.indexOf('/api/images/');
  if (apiIdx >= 0) return `${baseUrl}${imageUrl.substring(apiIdx)}`;

  const legacyIdx = imageUrl.indexOf('/image-service/uploads/');
  if (legacyIdx >= 0) {
    const suffix = imageUrl.substring(legacyIdx + '/image-service/uploads/'.length);
    return `${baseUrl}/api/images/${suffix}`;
  }

  const uploadsIdx = imageUrl.indexOf('/uploads/');
  if (uploadsIdx >= 0) {
    const suffix = imageUrl.substring(uploadsIdx + '/uploads/'.length);
    return `${baseUrl}/api/images/${suffix}`;
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;

  if (imageUrl.startsWith('/api/images/')) return `${baseUrl}${imageUrl}`;
  if (imageUrl.startsWith('/image-service/uploads/')) {
    return `${baseUrl}${imageUrl.replace('/image-service/uploads/', '/api/images/')}`;
  }
  if (imageUrl.startsWith('/uploads/')) {
    return `${baseUrl}/api/images/${imageUrl.substring('/uploads/'.length)}`;
  }
  if (imageUrl.startsWith('uploads/')) {
    return `${baseUrl}/api/images/${imageUrl.substring('uploads/'.length)}`;
  }
  if (!imageUrl.includes('/') && imageUrl.includes('.')) {
    return `${baseUrl}/api/images/foods/${imageUrl}`;
  }
  return imageUrl;
}

async function detectImageServiceAvailability(foods = []) {
  if (state.imagesEnabled !== null) return state.imagesEnabled;

  const sample = (foods || []).find((food) => food?.image_url);
  if (!sample) {
    state.imagesEnabled = false;
    return false;
  }

  const sampleUrl = buildImageUrl(sample.image_url);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch(sampleUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.ok) {
      state.imagesEnabled = true;
    } else {
      // Some image servers block HEAD; allow images and let <img onerror> handle failures.
      state.imagesEnabled = [401, 403, 405].includes(res.status);
    }
  } catch (_err) {
    // Be optimistic to avoid false negatives when HEAD is blocked or flaky.
    state.imagesEnabled = true;
  } finally {
    clearTimeout(timeoutId);
  }

  return state.imagesEnabled;
}

function getImageUrl(imageUrl) {
  if (state.imagesEnabled === false) return '';
  return buildImageUrl(imageUrl);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSepayQrImageUrl(result) {
  const fromProvider = (result?.qr_image_url || '').trim();
  if (fromProvider) return fromProvider;

  const qrText = (result?.qr_content || result?.pay_url || '').trim();
  if (!qrText) return '';

  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrText)}`;
}

function getAllMenuFoods() {
  return state.menuCategories.flatMap((category) =>
    (category.foods || []).map((food) => ({ ...food, category_name: category.name })),
  );
}

function getAllBuffetFoods() {
  return state.buffetFoodCategories.flatMap((category) =>
    (category.foods || []).map((food) => ({ ...food, category_name: category.name })),
  );
}

function findFoodById(foodId) {
  return getAllMenuFoods().find((food) => String(food.id) === String(foodId));
}

function findBuffetFoodById(foodId) {
  return getAllBuffetFoods().find((food) => String(food.id) === String(foodId));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase();
}

function getPaymentStatusText(status) {
  switch (status) {
    case 'paid':
      return 'Đã thanh toán';
    case 'pending':
    case 'waiting':
      return 'Đang chờ thanh toán';
    default:
      return 'Chưa thanh toán';
  }
}

function getPaymentStatusClass(status) {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'pending':
    case 'waiting':
      return 'pending';
    default:
      return 'unpaid';
  }
}

function getCurrentSessionPaymentStatus() {
  const unpaidOrders = state.orders.filter((order) => order.payment_status !== 'paid');
  if (unpaidOrders.some((order) => ['waiting', 'pending'].includes(order.payment_status))) {
    return 'waiting';
  }
  if (unpaidOrders.length > 0) {
    return 'unpaid';
  }
  if (state.orders.length > 0) {
    return 'paid';
  }
  return 'unpaid';
}

function getRequestPaymentOrderId() {
  const unpaidOrder = state.orders.find((order) => order.payment_status !== 'paid');
  return unpaidOrder?.id || null;
}

function normalizeOrderStatus(status) {
  const s = normalizeText(status);
  if (s.includes('thanh toan') || s.includes('da thanh toan')) return 'hoan thanh';
  if (s.includes('dang nau') || s.includes('che bien')) return 'dang che bien';
  if (s.includes('huy')) return 'da huy';
  if (s.includes('cho xac nhan')) return 'cho xac nhan';
  if (s.includes('cho che bien')) return 'cho che bien';
  if (s.includes('yeu cau thanh toan')) return 'yeu cau thanh toan';
  return s;
}

function getOrderStatusClass(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  switch (normalizedStatus) {
    case 'hoan thanh':
      return 'served';
    case 'dang che bien':
      return 'preparing';
    case 'yeu cau thanh toan':
    case 'cho xac nhan':
    case 'cho che bien':
      return 'pending';
    case 'da huy':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function getItemStatusText(status) {
  const s = normalizeOrderStatus(status);
  switch (s) {
    case 'dang che bien':
      return 'Đang nấu';
    case 'hoan thanh':
      return 'Đã xong';
    case 'cho che bien':
      return 'Chờ bếp';
    default:
      return status || '';
  }
}

function updateHeader() {
  document.getElementById('table-name').textContent = state.table?.name || '--';
  const statusText = document.querySelector('#session-status .status-text');

  if (!statusText) return;

  if (state.isBuffetActive && state.selectedBuffetPackage?.name) {
    statusText.textContent = 'Buffet đang hoạt động';
  } else if (state.summary?.total_orders > 0) {
    statusText.textContent = getPaymentStatusText(getCurrentSessionPaymentStatus());
  } else {
    statusText.textContent = state.table?.status || 'Sẵn sàng';
  }
}

function updateBuffetBanner() {
  const banner = document.getElementById('buffet-banner');
  const packageName = document.getElementById('buffet-package-name');

  if (state.isBuffetActive) {
    packageName.textContent = state.selectedBuffetPackage?.name || state.orders.find((o) => o.is_buffet)?.buffet_package_name || 'Buffet đang hoạt động';
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastKey = `${type}:${message}`;
  const now = Date.now();
  const lastShownAt = recentToasts.get(toastKey) || 0;
  if (now - lastShownAt < 2500) return;
  recentToasts.set(toastKey, now);

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

function shouldProcessSocketEvent(eventName, uniqueParts = []) {
  const eventKey = `${eventName}:${uniqueParts.filter(Boolean).join(':')}`;
  const now = Date.now();
  const lastSeenAt = recentSocketEvents.get(eventKey) || 0;
  if (now - lastSeenAt < 1500) {
    return false;
  }
  recentSocketEvents.set(eventKey, now);
  return true;
}

function renderCategories() {
  const container = document.getElementById('categories-list');
  if (!container) return;

  const categories = [{ id: 'all', name: 'Tat ca' }, ...state.menuCategories.map((category) => ({
    id: String(category.id),
    name: category.name,
  }))];

  container.innerHTML = categories.map((category) => `
    <button class="category-btn ${state.selectedCategoryId === category.id ? 'active' : ''}" onclick="selectCategory('${category.id.replace(/'/g, "\'")}')">
      ${category.name}
    </button>
  `).join('');
}

function renderMenuItem(food, isBuffet = false) {
  const imageUrl = getImageUrl(food.image_url);
  const imageHtml = imageUrl
    ? `<img src="${imageUrl}" alt="${food.name}" onerror="this.parentElement.innerHTML='<div class=\'menu-item-image-placeholder\'>No Image</div>'">`
    : `<div class="menu-item-image-placeholder">No Image</div>`;

  return `
    <div class="menu-item-card" onclick="openFoodModal('${String(food.id)}', ${isBuffet})">
      <div class="menu-item-image">${imageHtml}</div>
      <div class="menu-item-info">
        <h4 class="menu-item-name">${food.name}</h4>
        ${food.category_name ? `<p class="menu-item-desc">${food.category_name}</p>` : ''}
        <p class="menu-item-price">${isBuffet && state.isBuffetActive ? 'MIEN PHI' : formatCurrency(food.price)}</p>
      </div>
    </div>
  `;
}

function renderMenuItems() {
  const container = document.getElementById('menu-items');
  if (!container) return;

  const searchQuery = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
  const categories = state.menuCategories.map((category) => ({
    ...category,
    foods: (category.foods || []).filter((food) => {
      const matchesSearch = !searchQuery || food.name.toLowerCase().includes(searchQuery);
      const matchesCategory = state.selectedCategoryId === 'all' || String(category.id) === String(state.selectedCategoryId);
      return matchesSearch && matchesCategory;
    }),
  })).filter((category) => category.foods.length > 0);

  if (categories.length === 0) {
    container.innerHTML = '<div class="empty-state"><p class="empty-title">Không tìm thấy món</p><p class="empty-desc">Thử từ khóa khác</p></div>';
    return;
  }

  container.innerHTML = categories.map((category) => `
    <div class="category-section">
      <h3 class="category-section-title">${category.name}</h3>
      <div class="menu-items">
        ${category.foods.map((food) => renderMenuItem(food, false)).join('')}
      </div>
    </div>
  `).join('');
}

function renderBuffetPackages() {
  const container = document.getElementById('buffet-packages');
  if (!container) return;

  container.innerHTML = state.buffetPackages.map((pkg) => `
    <div class="buffet-package-card ${pkg.popular ? 'popular' : ''}">
      ${pkg.popular ? '<span class="buffet-package-badge">Pho bien</span>' : ''}
      <div class="buffet-package-header">
        <h3 class="buffet-package-name">${pkg.name}</h3>
        <p class="buffet-package-desc">${pkg.description}</p>
      </div>
      <div class="buffet-package-price">
        <span class="buffet-package-amount">${formatCurrency(pkg.price)}</span>
        <span class="buffet-package-unit">/ nguoi</span>
      </div>
      <ul class="buffet-package-features">
        ${(pkg.features || []).map((feature) => `<li>${feature}</li>`).join('')}
      </ul>
      <button class="btn btn-primary btn-full buffet-package-cta" onclick="selectBuffetPackage('${String(pkg.id)}')">Chon goi nay</button>
    </div>
  `).join('');
}

function renderBuffetMenu() {
  const container = document.getElementById('buffet-menu-items');
  if (!container) return;

  const searchQuery = (document.getElementById('buffet-search-input')?.value || '').trim().toLowerCase();
  const categories = state.buffetFoodCategories.map((category) => ({
    ...category,
    foods: (category.foods || []).filter((food) => !searchQuery || food.name.toLowerCase().includes(searchQuery)),
  })).filter((category) => category.foods.length > 0);

  if (categories.length === 0) {
    container.innerHTML = '<div class="empty-state"><p class="empty-title">Không tìm thấy món buffet</p><p class="empty-desc">Thử từ khóa khác</p></div>';
    return;
  }

  container.innerHTML = categories.map((category) => `
    <div class="category-section">
      <h3 class="category-section-title">${category.name}</h3>
      <div class="menu-items">
        ${category.foods.map((food) => renderMenuItem(food, true)).join('')}
      </div>
    </div>
  `).join('');
}

function renderCart() {
  const emptyEl = document.getElementById('cart-empty');
  const contentEl = document.getElementById('cart-content');
  const itemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total-amount');
  const ctaEl = document.getElementById('cart-cta');
  const ctaTotalEl = document.getElementById('cart-cta-total');
  const badgeEl = document.getElementById('cart-badge');

  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (totalItems > 0) {
    badgeEl.textContent = totalItems;
    badgeEl.classList.remove('hidden');
  } else {
    badgeEl.classList.add('hidden');
  }

  if (state.currentTab === 'cart' && state.cart.length > 0) {
    ctaEl.classList.remove('hidden');
    ctaTotalEl.textContent = formatCurrency(totalAmount);
  } else {
    ctaEl.classList.add('hidden');
  }

  if (state.cart.length === 0) {
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  contentEl.classList.remove('hidden');

  itemsEl.innerHTML = state.cart.map((item, index) => {
    const cartImageUrl = getImageUrl(item.image_url);
    const imageHtml = cartImageUrl
      ? `<img src="${cartImageUrl}" alt="" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\\'cart-item-image-placeholder\\'>No Image</div>'">`
      : `<div class="cart-item-image-placeholder">No Image</div>`;

    return `
      <div class="cart-item">
        <div class="cart-item-image">${imageHtml}</div>
        <div class="cart-item-info">
          <h4 class="cart-item-name">${item.name}</h4>
          <p class="cart-item-price">${formatCurrency(item.price * item.quantity)}</p>
        </div>
        <div class="cart-item-actions">
          <button class="cart-item-remove" onclick="removeFromCart(${index})">Xoa</button>
          <div class="quantity-selector">
            <button class="quantity-btn" onclick="updateCartQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" onclick="updateCartQuantity(${index}, 1)">+</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  totalEl.textContent = formatCurrency(totalAmount);
}

function renderOrders() {
  const emptyEl = document.getElementById('orders-empty');
  const contentEl = document.getElementById('orders-content');
  const listEl = document.getElementById('orders-list');
  const paymentCtaEl = document.getElementById('payment-cta');
  const paymentStatusEl = document.getElementById('session-payment-status');

  const totalOrders = state.summary?.total_orders || 0;
  const totalItems = state.summary?.total_items || 0;
  const totalAmount = state.summary?.total_amount || 0;
  const paymentStatus = getCurrentSessionPaymentStatus();

  document.getElementById('total-orders-count').textContent = totalOrders;
  document.getElementById('total-items-count').textContent = totalItems;
  document.getElementById('session-total-amount').textContent = formatCurrency(totalAmount);
  paymentStatusEl.textContent = getPaymentStatusText(paymentStatus);
  paymentStatusEl.className = `payment-status ${getPaymentStatusClass(paymentStatus)}`;

  if (state.currentTab === 'orders' && state.orders.length > 0 && !['waiting', 'pending', 'paid'].includes(paymentStatus)) {
    paymentCtaEl.classList.remove('hidden');
  } else {
    paymentCtaEl.classList.add('hidden');
  }

  if (state.orders.length === 0) {
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  contentEl.classList.remove('hidden');

  listEl.innerHTML = state.orders.map((order) => {
    const displayStatus = normalizeOrderStatus(order.status);
    return `
    <div class="order-card">
      <div class="order-card-header">
        <div class="order-card-info">
          <span class="order-id">Don #${order.id}</span>
          <span class="order-time">${formatDateTime(order.order_time)}</span>
        </div>
        <span class="order-status ${getOrderStatusClass(displayStatus)}">${displayStatus || 'Đang xử lý'}</span>
      </div>
      <div class="order-items-list">
        ${(order.details || []).map((item) => `
          <div class="order-item-row">
            <div class="order-item-left">
              <span class="order-item-qty">${item.quantity}x</span>
              <div class="order-item-meta">
                <span class="order-item-name">${item.food_name || 'N/A'}</span>
                ${state.itemStatuses[item.id]?.status ? `<span class="order-item-status ${normalizeOrderStatus(state.itemStatuses[item.id].status) === 'hoan thanh' ? 'delivered' : ''}">${getItemStatusText(state.itemStatuses[item.id].status)}</span>` : ''}
              </div>
            </div>
            <span class="order-item-price">${formatCurrency((item.price || 0) * (item.quantity || 0))}</span>
          </div>
        `).join('')}
      </div>
      <div class="order-card-footer">
        <span class="order-total-label">Thanh tien</span>
        <span class="order-total-amount">${formatCurrency(order.total)}</span>
      </div>
    </div>
  `;
  }).join('');
}

function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.tab === tab));
  document.querySelectorAll('.section').forEach((section) => section.classList.add('hidden'));
  document.getElementById('cart-cta').classList.add('hidden');
  document.getElementById('payment-cta').classList.add('hidden');

  if (tab === 'menu') {
    if (state.isBuffetActive) {
      document.getElementById('buffet-menu-section').classList.remove('hidden');
      renderBuffetMenu();
    } else if (state.orderMode === 'buffet') {
      document.getElementById('buffet-section').classList.remove('hidden');
      renderBuffetPackages();
    } else if (state.orderMode === 'regular') {
      document.getElementById('menu-section').classList.remove('hidden');
      renderCategories();
      renderMenuItems();
    } else {
      document.getElementById('order-type-section').classList.remove('hidden');
    }
  }

  if (tab === 'cart') {
    document.getElementById('cart-section').classList.remove('hidden');
    renderCart();
  }

  if (tab === 'orders') {
    document.getElementById('orders-section').classList.remove('hidden');
    renderOrders();
  }
}

function selectOrderType(type) {
  state.orderMode = type;
  switchTab('menu');
}

function goBack() {
  if (state.isBuffetActive) {
    switchTab('menu');
    return;
  }
  state.orderMode = null;
  switchTab('menu');
}

function goBackFromBuffetMenu() {
  if (state.isBuffetActive) {
    switchTab('menu');
    return;
  }
  state.orderMode = 'buffet';
  switchTab('menu');
}

function selectCategory(categoryId) {
  state.selectedCategoryId = categoryId;
  renderCategories();
  renderMenuItems();
}

function openFoodModal(foodId, isBuffet = false) {
  const food = isBuffet ? findBuffetFoodById(foodId) : findFoodById(foodId);
  if (!food) return;

  state.modalFood = { ...food, isBuffet };
  state.modalQuantity = 1;

  const imageUrl = getImageUrl(food.image_url);
  const imageContainer = document.getElementById('food-modal-image');
  imageContainer.innerHTML = imageUrl ? `<img src="${imageUrl}" alt="${food.name}">` : '';
  imageContainer.style.display = imageUrl ? 'block' : 'none';

  document.getElementById('food-modal-name').textContent = food.name;
  document.getElementById('food-modal-desc').textContent = food.category_name || (isBuffet ? 'Món buffet' : 'Món ăn');
  document.getElementById('food-modal-price').textContent = isBuffet && state.isBuffetActive ? 'MIEN PHI' : formatCurrency(food.price);
  document.getElementById('food-modal-quantity').textContent = '1';
  document.getElementById('add-to-cart-btn').textContent = state.isBuffetActive ? 'Gọi món' : 'Thêm món';

  document.getElementById('food-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeFoodModal() {
  document.getElementById('food-modal').classList.add('hidden');
  document.body.style.overflow = '';
  state.modalFood = null;
  state.modalQuantity = 1;
}

function increaseModalQuantity() {
  state.modalQuantity += 1;
  document.getElementById('food-modal-quantity').textContent = String(state.modalQuantity);
}

function decreaseModalQuantity() {
  if (state.modalQuantity > 1) {
    state.modalQuantity -= 1;
    document.getElementById('food-modal-quantity').textContent = String(state.modalQuantity);
  }
}

function addToCart(food, quantity) {
  const existing = state.cart.find((item) => String(item.food_id) === String(food.id));
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({
      food_id: food.id,
      name: food.name,
      price: food.price,
      image_url: food.image_url,
      quantity,
    });
  }
  renderCart();
  showToast('Đã thêm món thành công');
}

function removeFromCart(index) {
  const item = state.cart[index];
  state.cart.splice(index, 1);
  renderCart();
  showToast(`Đã xóa ${item.name} khỏi món ăn`, 'info');
}

function updateCartQuantity(index, delta) {
  state.cart[index].quantity += delta;
  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }
  renderCart();
}

async function addToCartFromModal() {
  if (!state.modalFood) return;

  if (state.isBuffetActive) {
    try {
      await fetchJson('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          table_id: state.tableId,
          table_key: state.tableKey,
          items: [{ food_id: state.modalFood.id, quantity: state.modalQuantity }],
          is_buffet: true,
          buffet_session_id: state.selectedBuffetPackage?.buffet_session_id || null,
          buffet_package_id: state.selectedBuffetPackage?.id || null,
          buffet_package_name: state.selectedBuffetPackage?.name || null,
        }),
      });
      showToast(`Đã gọi ${state.modalFood.name}`);
      closeFoodModal();
      await refreshOrders();
    } catch (error) {
      showToast(error.message || 'Không thể gọi món buffet', 'error');
    }
    return;
  }

  addToCart(state.modalFood, state.modalQuantity);
  closeFoodModal();
}
async function placeOrder() {
  if (state.cart.length === 0) {
    showToast('Gio hang trong', 'error');
    return;
  }

  try {
    await fetchJson('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        table_id: state.tableId,
        table_key: state.tableKey,
        items: state.cart.map((item) => ({ food_id: item.food_id, quantity: item.quantity })),
      }),
    });
    state.cart = [];
    renderCart();
    await refreshOrders();
    showToast('Đặt món thành công');
    switchTab('orders');
  } catch (error) {
    showToast(error.message || 'Đặt món thất bại', 'error');
  }
}

function selectBuffetPackage(packageId) {
  const pkg = state.buffetPackages.find((item) => String(item.id) === String(packageId));
  if (!pkg) return;
  state.selectedBuffetPackage = pkg;
  document.getElementById('buffet-confirm-details').innerHTML = `
    <div class="buffet-confirm-row"><span class="buffet-confirm-label">Goi buffet</span><span class="buffet-confirm-value">${pkg.name}</span></div>
    <div class="buffet-confirm-row"><span class="buffet-confirm-label">Gia / nguoi</span><span class="buffet-confirm-value">${formatCurrency(pkg.price)}</span></div>
  `;
  document.getElementById('buffet-confirm-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeBuffetConfirmModal() {
  document.getElementById('buffet-confirm-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function confirmBuffetOrder() {
  if (!state.selectedBuffetPackage) return;

  try {
    await fetchJson('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        table_id: state.tableId,
        table_key: state.tableKey,
        is_buffet: true,
        items: [],
        buffet_price: state.selectedBuffetPackage.price,
        buffet_package_id: state.selectedBuffetPackage.id,
        buffet_package_name: state.selectedBuffetPackage.name,
      }),
    });

    state.orderMode = 'buffet';
    state.isBuffetActive = false;
    closeBuffetConfirmModal();
    await refreshOrders();
    showToast('Đã gửi yêu cầu buffet, chờ nhà hàng xác nhận.');
    switchTab('orders');
  } catch (error) {
    showToast(error.message || 'Không thể đặt buffet', 'error');
  }
}

async function loadTable() {
  state.table = await fetchJson(`/api/tables/${state.tableId}`);
}

async function loadMenuData() {
  const [categories, foods] = await Promise.all([
    fetchJson('/api/menu/categories'),
    fetchJson('/api/menu/foods')
  ]);
  await detectImageServiceAvailability(foods);
  const mappedCategories = categories.map(c => ({
    ...c, 
    foods: foods.filter(f => String(f.category_id) === String(c.id))
  }));
  state.menuCategories = mappedCategories;
  state.buffetFoodCategories = mappedCategories.filter(c => c.foods.length > 0);
  state.buffetDrinkCategories = [];

  const categoryIds = new Set(state.menuCategories.map((category) => String(category.id)));
  if (state.selectedCategoryId !== 'all' && !categoryIds.has(String(state.selectedCategoryId))) {
    state.selectedCategoryId = 'all';
  }
}

async function loadBuffetPackages() {
  // Buffet packages endpoint not migrated to microservices yet
  try {
    const res = await fetchJson('/api/menu/buffet-packages');
    state.buffetPackages = res?.length ? res : [{ id: 1, name: 'Buffet Tiêu Chuẩn (Chưa cấu hình CSDL)', price: 299000 }];
  } catch (e) {
    state.buffetPackages = [{ id: 1, name: 'Buffet Tiêu Chuẩn (Lỗi mạng)', price: 299000 }];
  }
}

async function refreshOrders() {
  const [orders, summary] = await Promise.all([
    fetchJson(`/api/orders/table/${state.tableId}?tableKey=${encodeURIComponent(state.tableKey || '')}&t=${Date.now()}`),
    fetchJson(`/api/orders/table/${state.tableId}/session-summary?tableKey=${encodeURIComponent(state.tableKey || '')}&t=${Date.now()}`),
  ]);

  state.orders = orders || [];
  state.summary = summary && summary.total_orders > 0 ? summary : null;

  const buffetOrder = state.orders.find(
    (order) => order.is_buffet && order.payment_status !== 'paid'
  );
  state.isBuffetActive = Boolean(summary?.buffet_active || buffetOrder);

  const pendingBuffetOrder = state.orders.find(
    (order) => order.is_buffet && order.payment_status !== 'paid'
  );
  const buffetPackageSource = buffetOrder || pendingBuffetOrder || null;
  if (buffetPackageSource && !state.selectedBuffetPackage) {
    state.selectedBuffetPackage = {
      id: buffetPackageSource.buffet_package_id,
      name: buffetPackageSource.buffet_package_name,
      price: buffetPackageSource.total,
      buffet_session_id: buffetPackageSource.buffet_session_id,
    };
  }
  if (buffetPackageSource && state.selectedBuffetPackage) {
    state.selectedBuffetPackage = {
      ...state.selectedBuffetPackage,
      id: buffetPackageSource.buffet_package_id || state.selectedBuffetPackage.id,
      name: buffetPackageSource.buffet_package_name || state.selectedBuffetPackage.name,
      price: buffetPackageSource.total || state.selectedBuffetPackage.price,
      buffet_session_id: buffetPackageSource.buffet_session_id || state.selectedBuffetPackage.buffet_session_id,
    };
  }
  if (state.isBuffetActive) {
    state.orderMode = 'buffet';
  }

  updateHeader();
  updateBuffetBanner();
  renderOrders();
}

function initializeSocket() {
  const gatewayUrl = getGatewayUrl();
  if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') return;

  const orderSocket = new SockJS(`${gatewayUrl}/ws/order`);
  const orderStomp = Stomp.over(orderSocket);
  orderStomp.debug = null;
  orderStomp.connect({}, () => {
    orderStomp.subscribe(`/topic/table.${state.tableId}`, async (message) => {
      try {
        const payload = JSON.parse(message.body);
        const event = payload.event;
        const data = payload.data || {};

        if (event === 'order_created') {
          showToast('Hóa đơn đã được tạo', 'info');
          await refreshOrders();
        } else if (event === 'buffet_order_created') {
          showToast('Đặt buffet thành công', 'success');
          await refreshOrders();
        } else if (event === 'buffet_food_added') {
          showToast('Đã thêm món buffet', 'info');
          await refreshOrders();
        } else if (event === 'order_status_updated') {
          if (!shouldProcessSocketEvent('order_status_updated', [data.order_id, data.status, data.payment_status])) return;
          const normalizedStatus = normalizeOrderStatus(data.status);
          if (normalizedStatus === 'hoan thanh') {
            showToast('Món ăn đã được phục vụ', 'success');
          } else if (data.payment_status === 'waiting') {
            showToast('Thu ngân đã nhận yêu cầu thanh toán', 'info');
          }
          await refreshOrders();
        } else if (event === 'payment_completed') {
          if (!shouldProcessSocketEvent('payment_completed', [data.request_id, data.order_id, data.table_id, data.amount])) return;
          showToast('Thanh toán hoàn tất. Cảm ơn quý khách!', 'success');
          await refreshOrders();
        }
      } catch (e) {
        console.error('Loi khi parse message order:', e);
      }
    });
  });

  const kitchenSocket = new SockJS(`${gatewayUrl}/ws/kitchen`);
  const kitchenStomp = Stomp.over(kitchenSocket);
  kitchenStomp.debug = null;
  kitchenStomp.connect({}, () => {
    kitchenStomp.subscribe(`/topic/order.item-status.${state.tableId}`, async (message) => {
      try {
        const data = JSON.parse(message.body);
        if (!data?.order_detail_id) return;

        state.itemStatuses[data.order_detail_id] = {
          status: data.status,
          food_name: data.food_name,
          updated_at: data.updated_at,
        };

        if (!shouldProcessSocketEvent('order_item_status', [data.order_detail_id, data.status, data.updated_at])) return;

        const s = normalizeOrderStatus(data.status);
        if (s === 'dang che bien') {
          showToast(`${data.food_name || 'Món ăn'} đang được bếp chuẩn bị`, 'info');
        } else if (s === 'hoan thanh') {
          showToast(`${data.food_name || 'Món ăn'} đã sẵn sàng phục vụ`, 'success');
        }

        if (state.currentTab === 'orders') {
          renderOrders();
        }
      } catch (e) {
        console.error('Loi khi parse message kitchen item status:', e);
      }
    });
  });
}

async function initApp() {
  const params = getUrlParams();
  state.tableId = params.tableId;
  state.tableKey = params.tableKey;

  const accessError = new URLSearchParams(window.location.search).get('qr_access_error');
  if (accessError) {
    showInitError('access_blocked', decodeURIComponent(accessError));
    return;
  }

  if (!state.tableId || !state.tableKey) {
    showInitError('not_found');
    console.error('Missing tableId or tableKey in URL', params);
    return;
  }

  state.deviceSession = getDeviceSession();

  try {
    const sessionResult = await fetchJson(`/api/tables/${state.tableId}/validate-key`, {
      method: 'POST',
      body: JSON.stringify({
        tableKey: state.tableKey,
        deviceSession: state.deviceSession,
      }),
    });

    if (!sessionResult.valid) {
      showInitError(sessionResult.reason);
      return;
    }

    await Promise.all([
      loadTable(),
      loadMenuData(),
      loadBuffetPackages(),
      refreshOrders(),
    ]);

    initializeSocket();

    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    startSessionWatchdog(sessionResult.seconds_remaining);

    console.log('App initialized successfully for table', state.tableId);
  } catch (error) {
    console.error('Initialization error:', error);
    const loadingContent = document.querySelector('.loading-content');
    if (loadingContent) {
      loadingContent.innerHTML = `<div class="loading-logo">Aurora</div><p style="color:#e57373;margin-top:16px;font-size:14px;">Không thể kết nối.<br>${error.message || 'Vui lòng thử lại.'}</p>`;
    }
  }
}

function showInitError(reason, detail) {
  const messages = {
    expired: 'Link QR đã hết hạn.<br>Vui lòng yêu cầu mã QR mới từ nhân viên.',
    taken: 'Mã QR này đang được sử dụng trên thiết bị khác.<br>Vui lòng liên hệ nhân viên.',
    not_found: 'Link QR không hợp lệ.<br>Vui lòng quét lại mã QR.',
    missing_key: 'Link QR thiếu thông tin.<br>Vui lòng quét lại mã QR.',
    access_blocked: detail || 'Không thể mở phiên gọi món.<br>Vui lòng liên hệ nhân viên.',
  };
  const text = messages[reason] || messages.not_found;
  const loadingContent = document.querySelector('.loading-content');
  if (loadingContent) {
    loadingContent.innerHTML = `<div class="loading-logo">Aurora</div><p style="color:#e57373;margin-top:16px;font-size:14px;">${text}</p>`;
  }
}

function startSessionWatchdog(initialSeconds) {
  if (_watchdogTimer) clearInterval(_watchdogTimer);
  _watchdogNetErrStreak = 0;

  _watchdogTimer = setInterval(async () => {
    try {
      const result = await fetchJson(`/api/tables/${state.tableId}/validate-key`, {
        method: 'POST',
        body: JSON.stringify({
          tableKey: state.tableKey,
          deviceSession: state.deviceSession,
        }),
      });

      _watchdogNetErrStreak = 0;  // reset khi thĂ„â€Ă‚Â nh cĂ„â€Ă‚Â´ng

      if (!result.valid) {
        clearInterval(_watchdogTimer);
        _watchdogTimer = null;
        showSessionEnded(result.reason);
      }
    } catch (e) {
      // LÄ‚Â¡Ă‚Â»Ă¢â‚¬â€i mÄ‚Â¡Ă‚ÂºĂ‚Â¡ng (wifi mÄ‚Â¡Ă‚ÂºĂ‚Â¥t tÄ‚Â¡Ă‚ÂºĂ‚Â¡m, server restart...) Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Â khĂ„â€Ă‚Â´ng kill session ngay
      _watchdogNetErrStreak++;
      console.warn(`[Watchdog] Network error (${_watchdogNetErrStreak}/${WATCHDOG_NET_ERR_TOLERANCE}):`, e.message);

      if (_watchdogNetErrStreak >= WATCHDOG_NET_ERR_TOLERANCE) {
        clearInterval(_watchdogTimer);
        _watchdogTimer = null;
        showSessionEnded('network_error');
      }
    }
  }, WATCHDOG_INTERVAL_MS);
}

/**
 * showSessionEnded Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Â hiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n overlay toĂ„â€Ă‚Â n mĂ„â€Ă‚Â n hĂ„â€Ă‚Â¬nh khi phiĂ„â€Ă‚Âªn kÄ‚Â¡Ă‚ÂºĂ‚Â¿t thĂ„â€Ă‚Âºc giÄ‚Â¡Ă‚Â»Ă‚Â¯a chÄ‚Â¡Ă‚Â»Ă‚Â«ng.
 * KhĂ„â€Ă‚Â¡c vÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi showInitError vĂ„â€Ă‚Â¬ app Ä‚â€Ă¢â‚¬ËœĂ„â€Ă‚Â£ hiÄ‚Â¡Ă‚Â»Ă†â€™n thÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹ rÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“i.
 * @param {string} reason Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Å“ "expired" | "taken" | "not_found" | "network_error"
 */
function showSessionEnded(reason) {
  if (_watchdogTimer) {
    clearInterval(_watchdogTimer);
    _watchdogTimer = null;
  }

  const messages = {
    expired: { title: 'Phiên đã kết thúc', desc: 'Thời gian sử dụng bàn đã hết. Cảm ơn quý khách đã đến Aurora!' },
    taken: { title: 'Phiên bị thay thế', desc: 'Phiên mới vừa được mở trên thiết bị khác. Vui lòng quét lại QR để tiếp tục.' },
    not_found: { title: 'Phiên không hợp lệ', desc: 'Phiên gọi món đã đóng. Vui lòng liên hệ nhân viên nếu cần hỗ trợ.' },
    network_error: { title: 'Mất kết nối', desc: 'Không thể xác minh phiên sau nhiều lần thử. Vui lòng kiểm tra wifi và tải lại trang.' },
  };
  const msg = messages[reason] || messages.not_found;

  document.getElementById('session-ended-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'session-ended-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:rgba(10,10,10,0.93)',
    'z-index:9999',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'padding:32px',
    'text-align:center',
    'backdrop-filter:blur(4px)',
  ].join(';');
  overlay.innerHTML = `
    <div style="font-size:52px;margin-bottom:20px;">!</div>
    <h2 style="color:#fff;font-size:20px;font-weight:600;margin-bottom:12px;">${msg.title}</h2>
    <p style="color:#999;font-size:15px;line-height:1.7;max-width:320px;">${msg.desc}</p>
  `;
  document.body.appendChild(overlay);
}

function openPaymentModal() {
  const totalAmount = state.summary?.total_amount || 0;
  document.getElementById('payment-total').textContent = formatCurrency(totalAmount);
  state.paymentMethod = 'cash';
  updatePaymentMethodUI();
  document.getElementById('payment-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
  document.body.style.overflow = '';
  if (state.sepayPollingTimer) {
    clearInterval(state.sepayPollingTimer);
    state.sepayPollingTimer = null;
  }
  state.sepayTransactionRef = null;
}

function setPaymentMethod(method) {
  state.paymentMethod = method === 'sepay' ? 'sepay' : 'cash';
  updatePaymentMethodUI();
}

function updatePaymentMethodUI() {
  const qrSection = document.getElementById('sepay-qr-section');
  const submitBtn = document.getElementById('payment-submit-btn');
  const statusText = document.getElementById('sepay-status-text');
  const qrContent = document.getElementById('sepay-qr-content');
  const note = document.querySelector('.payment-modal-note');

  if (!submitBtn || !note || !qrSection) return;

  if (state.paymentMethod === 'sepay') {
    submitBtn.textContent = 'Tạo mã SePay';
    note.textContent = 'Khach co the chuyen khoan truc tiep bang SePay va he thong se tu cap nhat trang thai.';
    qrSection.classList.remove('hidden');
    if (statusText && !statusText.textContent) {
      statusText.textContent = 'Đang chờ tạo mã...';
    }
    if (qrContent && !qrContent.textContent) {
      qrContent.textContent = 'Chưa có mã';
    }
  } else {
    submitBtn.textContent = 'Gửi yêu cầu thanh toán';
    note.textContent = 'Yêu cầu thanh toán sẽ được gửi đến thu ngân. Nhân viên sẽ đến bàn để hỗ trợ thanh toán.';
    qrSection.classList.add('hidden');
  }
}

function renderSepayQrContent(result) {
  const qrContentEl = document.getElementById('sepay-qr-content');
  if (!qrContentEl) return;

  const qrImageUrl = buildSepayQrImageUrl(result);
  const rawQrText = (result?.qr_content || result?.pay_url || '').trim();
  const payUrl = (result?.pay_url || '').trim();

  if (!qrImageUrl && !rawQrText) {
    qrContentEl.textContent = 'Đã tạo mã thanh toán. Vui lòng thử lại sau.';
    return;
  }

  const safeRaw = escapeHtml(rawQrText);
  const safePay = escapeHtml(payUrl);
  const safeImage = escapeHtml(qrImageUrl);

  qrContentEl.innerHTML = `
    ${qrImageUrl ? `<img class="sepay-qr-image" src="${safeImage}" alt="SePay QR" onerror="this.remove()">` : ''}
    ${payUrl ? `<a class="sepay-pay-link" href="${safePay}" target="_blank" rel="noopener noreferrer">Mở link thanh toán</a>` : ''}
    ${rawQrText ? `<div class="sepay-qr-raw">${safeRaw}</div>` : ''}
  `;
}

async function submitPaymentRequest() {
  const requestOrderId = getRequestPaymentOrderId();
  if (!requestOrderId) {
    showToast('Chưa có hóa đơn để thanh toán', 'error');
    return;
  }

  if (state.paymentMethod === 'sepay') {
    await submitSepayPayment(requestOrderId);
    return;
  }

  try {
    await fetchJson(`/api/orders/${requestOrderId}/request-payment`, {
      method: 'POST',
      body: JSON.stringify({ table_key: state.tableKey }),
    });
    closePaymentModal();
    await refreshOrders();
    showToast('Đã gửi yêu cầu thanh toán');
  } catch (error) {
    showToast(error.message || 'Không thể gửi yêu cầu thanh toán', 'error');
  }
}

async function submitSepayPayment(orderId) {
  const statusText = document.getElementById('sepay-status-text');
  const totalAmount = state.summary?.total_amount || 0;

  try {
    if (statusText) statusText.textContent = 'Đang tạo mã SePay...';
    const result = await fetchJson('/api/payments/sepay/create', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        table_id: Number(state.tableId),
        table_key: state.tableKey,
        amount: totalAmount,
      }),
    });

    state.sepayTransactionRef = result.transaction_ref;
    renderSepayQrContent(result);

    if (statusText) {
      statusText.textContent = `Mã đã tạo - trạng thái: ${result.status || 'PENDING'}`;
    }

    if (state.sepayPollingTimer) {
      clearInterval(state.sepayPollingTimer);
      state.sepayPollingTimer = null;
    }

    state.sepayPollingTimer = setInterval(async () => {
      if (!state.sepayTransactionRef) return;
      try {
        const statusRes = await fetchJson(`/api/payments/sepay/${encodeURIComponent(state.sepayTransactionRef)}/status`);
        const status = (statusRes.status || '').toUpperCase();
        if (statusText) statusText.textContent = `Trang thai: ${status || 'PENDING'}`;

        if (status === 'PAID') {
          clearInterval(state.sepayPollingTimer);
          state.sepayPollingTimer = null;
          closePaymentModal();
          await refreshOrders();
          showToast('Thanh toán SePay thành công', 'success');
        } else if (status === 'FAILED' || status === 'EXPIRED') {
          clearInterval(state.sepayPollingTimer);
          state.sepayPollingTimer = null;
          showToast(`Thanh toán SePay ${status === 'FAILED' ? 'thất bại' : 'hết hạn'}`, 'error');
        }
      } catch (err) {
        console.error('SePay status polling error', err);
      }
    }, 3000);
  } catch (error) {
    if (statusText) statusText.textContent = 'Không thể tạo mã SePay';
    showToast(error.message || 'Không thể tạo thanh toán SePay', 'error');
  }
}
function bindUiEvents() {
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const buffetSearchInput = document.getElementById('buffet-search-input');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const hasValue = Boolean(searchInput.value.trim());
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('hidden', !hasValue);
      }
      renderMenuItems();
    });
  }

  if (clearSearchBtn && searchInput) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      renderMenuItems();
    });
  }

  if (buffetSearchInput) {
    buffetSearchInput.addEventListener('input', () => {
      renderBuffetMenu();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindUiEvents();
  initApp();
});

