# Bug Report — Restaurant Server Codebase
**Ngày scan:** 07/04/2026  
**Tổng số bug:** 29  
**Phân loại:** 4 CRITICAL · 11 HIGH · 10 MEDIUM · 4 LOW

---

## Mức độ ưu tiên

| ID | Mức | Loại | File |
|---|---|---|---|
| BUG-01 | **CRITICAL** | Race condition / thiếu @Transactional | TableService.java |
| BUG-02 | **CRITICAL** | Auth bypass (X-Internal-Call header) | JwtAuthenticationFilter.java |
| BUG-03 | **CRITICAL** | JWT secret hardcode trong repo | application.yml |
| BUG-04 | **CRITICAL** | DoS — unauthenticated có thể kill session khách | TableKeyController.java |
| BUG-05 | **HIGH** | Gmail App Password hardcode trong repo | application-local.yml |
| BUG-06 | **HIGH** | XSS — tên món/order inject vào innerHTML chưa escape | app.js |
| BUG-07 | **HIGH** | XSS — error.message từ server inject vào innerHTML | app.js |
| BUG-08 | **HIGH** | tableKey lộ trong URL / browser history | TableKeyController.java |
| BUG-09 | **HIGH** | N+1 queries — 2 call/bàn × N bàn mỗi 20 giây | tables/page.tsx |
| BUG-10 | **HIGH** | Duplicate API call — loadBuffetMenu fetch lại menu | app.js |
| BUG-11 | **HIGH** | Tất cả GET endpoint không cần auth — lộ PII | JwtAuthenticationFilter.java |
| BUG-12 | **HIGH** | Hardcode tên DB `paymentdb` trong native SQL | PaymentRepository.java |
| BUG-13 | **HIGH** | CORS wildcard `*` bật mặc định qua all.bat | application-local.yml |
| BUG-14 | **HIGH** | Bỏ qua reservation `pending` trong buffer check | TableReservationRepository.java |
| BUG-15 | **HIGH** | Mật khẩu WiFi hardcode trong in hóa đơn | cashier/page.tsx |
| BUG-16 | **MEDIUM** | Thiếu @Transactional trên createReservation (consistency) | TableService.java |
| BUG-17 | **MEDIUM** | SQL overlap sai trong findByTableIdAndStartTimeBetween | TableReservationRepository.java |
| BUG-18 | **MEDIUM** | isBuffet gửi camelCase — bị bỏ qua khi tạo bàn mới | tables/page.tsx |
| BUG-19 | **MEDIUM** | isBuffet là required param trên updateTableStatus | TableController.java |
| BUG-20 | **MEDIUM** | tableKey truyền qua GET query string (order API) | app.js |
| BUG-21 | **MEDIUM** | Map không giới hạn size — memory leak trên mobile | app.js |
| BUG-22 | **MEDIUM** | WebSocket không có error handler / reconnect / cleanup | app.js |
| BUG-23 | **MEDIUM** | escHtml không an toàn trong JS inline onclick context | menu/index.html |
| BUG-24 | **MEDIUM** | category.name chưa escape trong innerHTML | app.js |
| BUG-25 | **MEDIUM** | Error message từ URL param inject vào innerHTML | app.js |
| BUG-26 | **LOW** | Hai endpoint admin/reservations giống nhau hoàn toàn | TableController.java |
| BUG-27 | **LOW** | Raw JWT header truyền qua service layer | PaymentController.java |
| BUG-28 | **LOW** | TS interface UpcomingReservation dùng camelCase sai | tables/page.tsx |
| BUG-29 | **LOW** | Hardcode port 3011→3000 trong getGatewayUrl() | app.js |

---

## Chi tiết

---

### BUG-01 · CRITICAL — Race condition: `createReservation` không có `@Transactional`

**File:** `table-service/.../service/TableService.java` ~dòng 57  
**Mô tả:** Check-then-act không atomic. Hai request đồng thời đều vượt qua `countOverlappingReservations` trước khi bất kỳ cái nào commit → tạo được 2 đơn đặt trùng giờ cho cùng 1 bàn. Unique constraint ở DB chỉ chặn được trùng tuyệt đối (cùng start/end), không chặn overlap thời gian.

```java
// Thiếu @Transactional — BUG ở đây
public TableReservation createReservation(Integer tableId, Map<String, Object> payload) {
    Integer overlapCount = tableReservationRepository.countOverlappingReservations(...);
    if (overlapCount != null && overlapCount > 0) throw new RuntimeException(...);
    // ...có thể có concurrent insert ở đây trước khi save
    return tableReservationRepository.save(reservation);
}
```

**Fix:** Thêm `@Transactional(isolation = Isolation.SERIALIZABLE)` vào `createReservation`.

---

### BUG-02 · CRITICAL — Auth bypass qua header `X-Internal-Call`

**File:** `table-service/.../security/JwtAuthenticationFilter.java` ~dòng 27  
**Mô tả:** Bất kỳ client nào gửi `X-Internal-Call: true` đều bypass hoàn toàn JWT auth. API Gateway **không** strip header này trước khi forward. Attacker có thể gọi mọi endpoint admin mà không cần token.

```java
if ("true".equals(request.getHeader("X-Internal-Call"))) {
    filterChain.doFilter(request, response); // bypass tất cả auth
    return;
}
```

**Fix:** Bỏ hoàn toàn cơ chế này, hoặc chỉ cho phép từ IP `127.0.0.1`/`::1`. Thêm `RemoveRequestHeader=X-Internal-Call` vào API Gateway.

---

### BUG-03 · CRITICAL — JWT secret hardcode trong source code

**File:** `*/src/main/resources/application.yml` (nhiều service)  
**Mô tả:** Secret mặc định `restaurant_secret_key_12345678900` commit trong repo. Vì `all.bat` không set `JWT_SECRET`, 100% dev run và mọi deployment clone từ repo này dùng secret này. Bất kỳ ai đọc repo có thể forge JWT hợp lệ với bất kỳ `user_id` và `role_id`.

```yaml
jwt:
  secret: ${JWT_SECRET:restaurant_secret_key_12345678900}  # ← lộ secret
```

**Fix:** Đổi thành `secret: ${JWT_SECRET}` (không có default). Add vào `all.bat`: `set JWT_SECRET=<random-256-bit-value>`.

---

### BUG-04 · CRITICAL — Unauthenticated có thể force-kill session của bất kỳ bàn nào

**File:** `table-service/.../controller/TableKeyController.java` ~dòng 63  
**Mô tả:** `GET /api/tables/{id}/generate-access` không yêu cầu auth (design có chủ ý cho static QR), nhưng endpoint này gọi `invalidateKeysByTableId(id)` ngay đầu. Bất kỳ ai biết ID bàn (số tự nhiên 1–12) có thể liên tục kill tất cả active session của khách đang dùng bữa.

```java
// generate-access không cần auth, nhưng gọi invalidate!
Map<String, Object> result = tableService.generateDynamicQRCode(id);
// generateDynamicQRCode bắt đầu bằng:
tableKeyRepository.invalidateKeysByTableId(id);  // kill session khách đang dùng
```

**Fix:** Rate-limit nghiêm ngặt. Xem xét embed time-based token vào URL của static QR, hoặc kiểm tra bàn không đang "Đang sử dụng" trước khi invalidate.

---

### BUG-05 · HIGH — Gmail App Password hardcode trong source code

**File:** `user-service/src/main/resources/application-local.yml` ~dòng 14  
**Mô tả:** Password Gmail thật commit trong repo. `all.bat` chạy với profile `local` → password này được dùng thực sự.

```yaml
password: "fbikwnsabgfjgorq"  # ← revoke ngay lập tức
```

**Fix:** Thu hồi App Password này tại Google account. Đổi thành `password: ${MAIL_PASSWORD:}`.

---

### BUG-06 · HIGH — XSS: Tên món ăn / đơn hàng inject vào `innerHTML` không escape

**File:** `table-service/.../static/js/app.js`  
**Các vị trí:**
- dòng ~302: `renderMenuItem` — `food.name`, `food.category_name`
- dòng ~346: `renderBuffetPackages` — `pkg.name`, `pkg.description`  
- dòng ~479: `renderOrders` — `item.food_name`
- dòng ~427: `renderCart` — `item.name`
- dòng ~708: `selectBuffetPackage` — `pkg.name`
- dòng ~288: `renderCategories` — `category.name`

```js
grid.innerHTML = filtered.map(item => `
  <h3>${item.name}</h3>          // ← XSS nếu admin nhập <script>
  <p>${item.description}</p>     // ← XSS
`).join('');
```

**Fix:** Dùng hàm `escHtml()` (đã có trong my-reservations) cho tất cả string từ server trước khi đưa vào `innerHTML`.

---

### BUG-07 · HIGH — XSS: `error.message` từ server inject vào `innerHTML`

**File:** `table-service/.../static/js/app.js` ~dòng 256, ~1000  
**Mô tả:** `showToast` và error handler trong `initApp` inject `error.message` trực tiếp vào `innerHTML`. Message đến từ response body server có thể chứa HTML.

```js
toast.innerHTML = `<span>${message}</span>`;  // message từ server — XSS
loadingContent.innerHTML = `...${error.message}...`;  // XSS
```

**Fix:** Dùng `textContent` thay vì `innerHTML` cho error message, hoặc escape bằng `escHtml()`.

---

### BUG-08 · HIGH — `tableKey` (UUID) lộ trong URL sau redirect `generate-access`

**File:** `table-service/.../controller/TableKeyController.java` ~dòng 68  
**Mô tả:** Key bị lộ trong URL bar, browser history, server log, và `Referer` header.

```java
response.sendRedirect("/index.html?tableId=" + id + "&tableKey=" + key);
// tableKey xuất hiện trong:
// 1. URL bar (có thể nhìn thấy)
// 2. Server/proxy access log
// 3. Browser history
```

**Fix:** Dùng URL fragment: `response.sendRedirect("/index.html#access/" + id + "/" + key)` — fragment không được gửi đến server.

---

### BUG-09 · HIGH — N+1 queries: 2 API call × N bàn mỗi 20 giây

**File:** `Fe-Admin/app/tables/page.tsx` ~dòng 130  
**Mô tả:** `fetchEnrichments` loop qua từng bàn, gọi 2 endpoint riêng biệt cho mỗi bàn. Với 13 bàn hiện tại: **26 concurrent HTTP request mỗi 20 giây**.

```tsx
tableList.map(async (table) => {
  await api.get(`/tables/${table.id}/upcoming-reservation`);  // × N
  await api.get(`/tables/${table.id}/active-key`);            // × N
});
```

**Fix:** Thêm bulk endpoint `GET /api/tables/enrichments` trả về data của tất cả bàn trong 1 call.

---

### BUG-10 · HIGH — `loadBuffetMenu` fetch lại menu đã có (duplicate API call)

**File:** `table-service/.../static/js/app.js` ~dòng 800  
**Mô tả:** `initApp` gọi cả `loadMenu()` và `loadBuffetMenu()` trong `Promise.all`. Cả 2 đều fetch `/api/menu/foods` và `/api/menu/categories`. Gọi 2 lần không cần thiết. Thêm vào đó, bên trong `loadBuffetMenu` dùng `await...await` tuần tự thay vì `Promise.all`.

**Fix:** `loadBuffetMenu` nên dùng lại `state.menuCategories` đã có từ `loadMenu`.

---

### BUG-11 · HIGH — Tất cả GET endpoint không yêu cầu auth — lộ thông tin khách

**File:** `table-service/.../security/JwtAuthenticationFilter.java` ~dòng 56  
**Mô tả:** Mọi GET request đều pass qua không cần token. Bao gồm:
- `GET /api/tables/admin/reservations` — tên + SĐT của tất cả khách
- `GET /api/tables/{id}/upcoming-reservation` — tên + SĐT khách sắp đến
- `GET /api/tables/{id}/active-key` — thông tin phiên đang active

**Fix:** Chỉ allow anonymous GET cho `/api/tables` (list) và `/api/tables/{id}` (detail). Tất cả endpoint reservation/admin yêu cầu JWT.

---

### BUG-12 · HIGH — Tên database `paymentdb` hardcode trong native SQL

**File:** `payment-service/.../repository/PaymentRepository.java` ~dòng 12  

```java
"FROM paymentdb.payments p " +
"LEFT JOIN paymentdb.payment_requests r ..."
```

**Fix:** Bỏ prefix `paymentdb.` — JPA tự biết schema từ datasource URL.

---

### BUG-13 · HIGH — CORS wildcard `*` active trong profile local (dùng bởi `all.bat`)

**File:** `api-gateway/src/main/resources/application-local.yml`  
**Mô tả:** `all.bat` chạy với profile `local` → CORS config production bị override bởi `allowedOriginPatterns: "*"` kết hợp `allowCredentials: true`. Bất kỳ website nào cũng có thể gọi API với credential của user đang đăng nhập.

**Fix:** Chỉ định pattern cụ thể như `http://localhost:3010` ngay cả trong local profile.

---

### BUG-14 · HIGH — Buffer 15 phút bỏ qua reservation đang `pending`

**File:** `table-service/.../repository/TableReservationRepository.java` ~dòng 43  

```sql
AND status = 'confirmed'  -- bỏ qua 'pending' → buffer bypass
```

**Mô tả:** Nếu có reservation `pending` trong 10 phút tới, `generateDynamicQRCode` không biết và vẫn cấp key đầy đủ 2 giờ. Khi admin confirm reservation thì bàn đang có khách ngồi.

**Fix:** Đổi thành `AND status IN ('pending', 'confirmed')`.

---

### BUG-15 · HIGH — Mật khẩu WiFi hardcode trong template in hóa đơn

**File:** `Fe-Admin/app/cashier/page.tsx` ~dòng 242  

```tsx
<p>Password Wifi: aurora123</p>  // ← hardcode, không bao giờ thay đổi được
```

**Fix:** Load từ config API hoặc biến môi trường.

---

### BUG-16 · MEDIUM — `createReservation` thiếu `@Transactional` (data consistency)

**File:** `table-service/.../service/TableService.java` ~dòng 57  
**Mô tả:** Ngoài race condition (BUG-01), nếu `save()` fail sau khi overlap check pass, không có rollback. Nên thêm `@Transactional` riêng biệt ít nhất ở mức `REQUIRED`.

---

### BUG-17 · MEDIUM — SQL overlap sai trong `findByTableIdAndStartTimeBetween`

**File:** `table-service/.../repository/TableReservationRepository.java` ~dòng 23  

```sql
AND start_time >= :fromTime AND start_time <= :toTime
-- Bỏ qua reservation bắt đầu trước fromTime nhưng kết thúc trong range
```

**Fix:** Dùng logic overlap đúng: `NOT (end_time <= :fromTime OR start_time >= :toTime)`.

---

### BUG-18 · MEDIUM — `handleCreateTable` gửi `isBuffet` (camelCase) → bị Spring bỏ qua

**File:** `Fe-Admin/app/tables/page.tsx` ~dòng 188  

```tsx
// handleCreateTable — SAI
await api.post('/tables', { isBuffet: formData.isBuffet });  // ignored!

// handleUpdateTable — ĐÚNG  
await api.put(`/tables/${id}`, { is_buffet: formData.isBuffet }); // works
```

**Mô tả:** Spring dùng SNAKE_CASE → `isBuffet` bị bỏ qua → tất cả bàn tạo mới đều có `is_buffet = false`.

**Fix:** Đổi `isBuffet:` thành `is_buffet:` trong `handleCreateTable`.

---

### BUG-19 · MEDIUM — `isBuffet` là required param trong `PUT /{id}/status`

**File:** `table-service/.../controller/TableController.java` ~dòng 147  

```java
@RequestParam Boolean isBuffet  // required=true, không có default
```

**Fix:** `@RequestParam(required = false) Boolean isBuffet` và xử lý null trong service.

---

### BUG-20 · MEDIUM — `tableKey` truyền qua GET query string trong order API

**File:** `table-service/.../static/js/app.js` ~dòng 826  

```js
fetchJson(`/api/orders/table/${state.tableId}?tableKey=${state.tableKey}&t=${Date.now()}`);
```

**Fix:** Chuyển `tableKey` vào POST body hoặc custom header `X-Table-Key`.

---

### BUG-21 · MEDIUM — `recentToasts` / `recentSocketEvents` Map không giới hạn size

**File:** `table-service/.../static/js/app.js` ~dòng 22  
**Mô tả:** Map tích lũy entries suốt session, không bao giờ xóa. Phiên buffet 3 giờ với nhiều update bếp → hàng nghìn entries → memory leak trên mobile browser.

**Fix:** Giới hạn max 50 entries hoặc xóa entries cũ hơn 10 giây.

---

### BUG-22 · MEDIUM — WebSocket không có error handler / reconnect / cleanup

**File:** `table-service/.../static/js/app.js` ~dòng 856  
**Mô tả:**
1. STOMP client không được lưu vào `state` → không disconnect/reconnect được
2. Không có error callback → mất live update mà không có thông báo
3. Không có guard chống double-subscribe

**Fix:** Lưu STOMP clients vào `state.orderStomp`, `state.kitchenStomp`. Thêm error callback để reconnect.

---

### BUG-23 · MEDIUM — `escHtml` trong `onclick` attribute không đủ an toàn

**File:** `table-service/.../static/menu/index.html` ~dòng 76  

```js
`<button onclick="setCategory('${escHtml(cat)}')">`
// Nếu cat chứa "); evil();// → XSS trong JS context
```

**Fix:** Dùng `addEventListener` + `data-cat` thay vì inline onclick.

---

### BUG-24 · MEDIUM — `category.name` chưa escape trong `renderCategories`

**File:** `table-service/.../static/js/app.js` ~dòng 288  

```js
container.innerHTML = categories.map(c => `<button>${c.name}</button>`).join('');
// category.name chưa qua escHtml()
```

**Fix:** `escHtml(c.name)`.

---

### BUG-25 · MEDIUM — Error message từ URL param inject vào `innerHTML`

**File:** `table-service/.../static/js/app.js` ~dòng 1025  

```js
loadingContent.innerHTML = `...<p>${error.message}</p>`;
// error.message đến từ decodeURIComponent(accessError) — có thể chứa HTML
```

**Fix:** `element.textContent = text` thay vì `innerHTML`.

---

### BUG-26 · LOW — Hai endpoint `/reservations` và `/admin/reservations` giống hệt nhau

**File:** `table-service/.../controller/TableController.java`  
**Mô tả:** Cùng logic, cùng service method, chỉ khác path. "admin" trong path tạo cảm giác có auth nhưng thực ra không (BUG-11).

**Fix:** Xóa một trong hai. Nếu cần phân biệt, thêm auth check thực sự trên endpoint admin.

---

### BUG-27 · LOW — Raw JWT header truyền qua service layer

**File:** `payment-service/.../controller/PaymentController.java`  

```java
paymentService.processCashPayment(orderId, tableId, tableKey, authHeader); // header truyền vào service
```

**Fix:** Extract claims từ JWT trong controller, truyền `userId`/`roleId` đã parse thay vì raw header.

---

### BUG-28 · LOW — `UpcomingReservation` TypeScript interface dùng camelCase sai

**File:** `Fe-Admin/app/tables/page.tsx` ~dòng 44  

```ts
interface UpcomingReservation {
  startTime: string;    // API trả về start_time
  customerName: string; // API trả về customer_name
  // → chỉ hoạt động nhờ normalizeUpcoming() fallback
}
```

**Fix:** Đổi interface thành snake_case để match đúng API contract.

---

### BUG-29 · LOW — `getGatewayUrl()` hardcode logic thay port 3011→3000

**File:** `table-service/.../static/js/app.js` ~dòng 96  

```js
return `${window.location.protocol}//${window.location.host.replace(':3011', ':3000')}`;
// Fail silently nếu không có :3011 trong host (reverse proxy, production)
```

**Fix:** Dùng biến có thể config: `window.GATEWAY_URL` set trong `config.js` theo môi trường.

---

## Thống kê theo loại

| Loại | Số lượng |
|---|---|
| Security (auth bypass, XSS, secret lộ) | 9 |
| Business logic (race condition, sai logic) | 5 |
| Performance (N+1, duplicate call, memory leak) | 4 |
| Data integrity (missing transaction, wrong SQL) | 3 |
| API contract (snake_case mismatch) | 3 |
| Reliability (WebSocket, error handling) | 3 |
| Code quality | 2 |

---

*Scan thực hiện bởi GitHub Copilot — April 07, 2026*
