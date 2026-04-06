# Restaurant Management System

Hệ thống quản lý nhà hàng đầy đủ chức năng — microservices Spring Boot + Next.js admin + customer web tĩnh.

---

## Mục lục

Tài liệu chuyên sâu cho module bàn và đặt bàn: [TABLE_RESERVATION_README.md](TABLE_RESERVATION_README.md)

1. [Tổng quan](#1-tổng-quan)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Yêu cầu & Khởi động](#3-yêu-cầu--khởi-động)
4. [Port & Service Map](#4-port--service-map)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [WebSocket](#7-websocket)
8. [Phân quyền & JWT](#8-phân-quyền--jwt)
9. [Luồng nghiệp vụ](#9-luồng-nghiệp-vụ)
10. [Frontend — Customer Web](#10-frontend--customer-web)
11. [Frontend — Fe-Admin](#11-frontend--fe-admin)
12. [Cấu hình](#12-cấu-hình)
13. [Known Issues](#13-known-issues)

---

## 1. Tổng quan

| Thông tin | Chi tiết |
|-----------|---------|
| **Backend** | Java 21 + Spring Boot 3.2.4 |
| **Số microservices** | 9 service (8 Spring Boot + 1 Next.js) |
| **Database** | MySQL 8 (8 schema riêng biệt, tự tạo qua JPA `ddl-auto: update`) |
| **Auth** | JWT HS512, 24 giờ, dùng chung secret |
| **Build tool** | Maven (multi-module) |
| **Frontend Admin** | Next.js 14 (React + Radix UI + Tailwind) |
| **Frontend Customer** | Plain HTML/JS tĩnh nhúng trong table-service |
| **Real-time** | STOMP/WebSocket (order, kitchen, payment) |
| **Email** | SMTP optional (Mailtrap dev) |
| **Thanh toán** | Tiền mặt (có thể mở rộng) |

### Các loại người dùng

| Người dùng | Giao diện | Chức năng chính |
|-----------|-----------|----------------|
| **ADMIN** | Fe-Admin `:3010` | Quản lý toàn bộ: user, menu, bàn, đặt bàn, inventory, sơ đồ |
| **MANAGER** | Fe-Admin `:3010` | Xem/xác nhận đơn, quản lý bàn |
| **CASHIER** | Fe-Admin `:3010` | Xử lý thanh toán tiền mặt |
| **WAITER** | Fe-Admin `:3010` | Theo dõi orders, xem bàn |
| **CUSTOMER** | Web `:3011` | Đăng ký, đặt bàn trước, xem menu |
| **Khách tại bàn** | `/:3011` (scan QR) | Gọi món, yêu cầu thanh toán |

### Tài liệu chuyên sâu theo module

- Module bàn, đặt bàn, lịch sử đặt bàn, QR bàn: [TABLE_RESERVATION_README.md](TABLE_RESERVATION_README.md)

---

## 2. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                     │
│                                                                     │
│  Fe-Admin :3010     Customer Web :3011     Dine-in (QR) :3011      │
│   (Next.js)          (Static HTML)         (Static HTML)            │
└──────────────┬──────────────┬─────────────────┬─────────────────────┘
               │              │                  │
               └──────────────▼──────────────────┘
                              │
               ┌──────────────▼──────────────────────┐
               │        API GATEWAY :3000             │
               │   Spring Cloud Gateway               │
               │   CORS: Allow *                      │
               └──┬──────┬──────┬──────┬──────┬──────┘
                  │      │      │      │      │
          ┌───────┘  ┌───┘  ┌───┘  ┌───┘  ┌───┘
          ▼          ▼      ▼      ▼      ▼
      user-service  menu  order kitchen  table  inventory  image  payment
         :3005      :3002  :3003  :3004   :3011    :3006   :3007   :3008
         userdb     menudb orderdb kitchendb tabledb inventorydb   paymentdb
```

### Gateway routing

| Pattern | Target |
|---------|--------|
| `/api/users/**` | `http://localhost:3005` |
| `/api/menu/**` | `http://localhost:3002` |
| `/api/orders/**` | `http://localhost:3003` |
| `/api/tables/**` | `http://localhost:3011` |
| `/api/kitchen/**` | `http://localhost:3004` |
| `/api/inventory/**` | `http://localhost:3006` |
| `/api/images/**` | `http://localhost:3007` |
| `/api/payments/**` | `http://localhost:3008` |
| `/ws/order/**` | `http://localhost:3003` |
| `/ws/kitchen/**` | `http://localhost:3004` |
| `/ws/payment/**` | `http://localhost:3008` |

### Service-to-service calls (nội bộ, không qua Gateway)

```
order-service  ──POST /api/kitchen/notify──►  kitchen-service :3004
order-service  ──POST /api/payments/request►  payment-service :3008
kitchen-service──PUT order status──────────►  order-service   :3003
payment-service──PUT order payment_status──►  order-service   :3003
menu-service   ──GET foods/ingredients──────►  (self-contained)
```

---

## 3. Yêu cầu & Khởi động

### Yêu cầu phần mềm

| Phần mềm | Phiên bản | Ghi chú |
|----------|-----------|---------|
| Java | 21+ | Bắt buộc |
| Maven | 3.9+ | `all.bat` tự tải portable nếu chưa có |
| MySQL | 8.0 | Chạy qua Laragon — user `root`, password trống |
| Node.js | 18+ | Chỉ cần để chạy Fe-Admin |

### Bước 1 — Chuẩn bị Database

1. Bật **Laragon** → Start MySQL
2. Import dữ liệu ban đầu:
   ```
   HeidiSQL → Open file → restaurant_full2.sql → Execute
   ```
3. Chạy migration (chỉ lần đầu):
   ```sql
   -- userdb: thêm role CUSTOMER
   source migrations/2026-04-06_add_customer_role.sql

   -- userdb + tabledb: thêm email verification + customer_id
   source migrations/2026-04-06_add_customer_features.sql
   ```
   > Kiểm tra trước trong HeidiSQL — nếu `restaurant_full2.sql` đã chứa các cột này thì bỏ qua.

### Bước 2 — Khởi động backend

```bat
all.bat
```

Script tự động:
- Dọn port cũ: 3000, 3002–3008, 3011
- Tải Maven 3.9.6 portable nếu chưa có trong PATH
- Mở 9 cửa sổ cmd, mỗi cửa sổ 1 service với profile `local`

Thứ tự khởi động: api-gateway → user-service → menu/order/kitchen/inventory/image/payment → table-service

### Bước 3 — Khởi động Fe-Admin

```bat
cd Fe-Admin
npm install      # chỉ lần đầu
npm run dev      # http://localhost:3010
```

### Dừng hệ thống

```bat
stop-all.bat
```

> Customer web **không cần build riêng** — plain HTML/JS, serve trực tiếp từ `table-service/src/main/resources/static/`.

---

## 4. Port & Service Map

| Port | Service | Database | Ghi chú |
|------|---------|----------|---------|
| **3000** | api-gateway | — | Entry point, CORS, routing |
| **3002** | menu-service | menudb | Foods, categories, buffet packages |
| **3003** | order-service | orderdb | Orders, order details, sessions + WebSocket |
| **3004** | kitchen-service | kitchendb | Queue chế biến + WebSocket |
| **3005** | user-service | userdb | Auth, user CRUD, email verification |
| **3006** | inventory-service | inventorydb | Ingredients, stock |
| **3007** | image-service | — | Upload/serve ảnh |
| **3008** | payment-service | paymentdb | Thanh toán tiền mặt + WebSocket |
| **3010** | Fe-Admin (Next.js) | — | Admin dashboard, chạy riêng |
| **3011** | table-service | tabledb | Tables, reservations, QR keys + serve customer web |

### Customer Web — URL các trang

| Trang | URL |
|-------|-----|
| Đặt món tại bàn (scan QR) | http://localhost:3011/ |
| Đăng ký tài khoản | http://localhost:3011/register/ |
| Đăng nhập | http://localhost:3011/login/ |
| Đặt bàn trước | http://localhost:3011/booking/ |
| Lịch đặt bàn của tôi | http://localhost:3011/my-reservations/ |
| Xem menu | http://localhost:3011/menu/ |
| Thanh toán return | http://localhost:3011/payment-return.html |

---

## 5. Database Schema

### `userdb`

```sql
CREATE TABLE roles (
  id   INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE  -- ADMIN(1), MANAGER(2), CASHIER(3), WAITER(4), CUSTOMER(5)
);

CREATE TABLE users (
  id                             INT PRIMARY KEY AUTO_INCREMENT,
  username                       VARCHAR(50) UNIQUE NOT NULL,
  password                       VARCHAR(100) NOT NULL,       -- BCrypt hashed
  role_id                        INT REFERENCES roles(id),
  full_name                      VARCHAR(100),
  phone_number                   VARCHAR(20),
  age                            INT,
  email                          VARCHAR(100),
  address                        VARCHAR(255),
  email_verified                 TINYINT(1) DEFAULT 0,
  email_verification_token       VARCHAR(255),
  email_verification_expires_at  DATETIME,
  created_at                     DATETIME,
  updated_at                     DATETIME
);
```

### `tabledb`

```sql
CREATE TABLE tables (
  id        INT PRIMARY KEY AUTO_INCREMENT,
  name      VARCHAR(100),
  status    VARCHAR(50),    -- 'Trống' | 'Đang sử dụng' | 'Đã đặt'
  is_buffet TINYINT(1)
);

CREATE TABLE table_reservations (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  table_id            INT NOT NULL,
  customer_id         INT,            -- nullable; soft-link → userdb.users.id
  customer_name       VARCHAR(100) NOT NULL,
  customer_phone      VARCHAR(30) NOT NULL,
  party_size          INT NOT NULL,
  start_time          DATETIME NOT NULL,
  end_time            DATETIME NOT NULL,
  status              VARCHAR(30) DEFAULT 'pending',
  -- 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  is_buffet           TINYINT(1) DEFAULT 0,
  buffet_package_id   INT,
  buffet_package_name VARCHAR(255),
  notes               VARCHAR(500),
  created_at          DATETIME,
  updated_at          DATETIME
  -- INDEX: (table_id, start_time, end_time), (customer_id)
);

CREATE TABLE table_keys (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  table_id       INT NOT NULL,
  key_value      VARCHAR(100) UNIQUE,  -- UUID
  created_at     DATETIME NOT NULL,
  expires_at     DATETIME NOT NULL,    -- now + 2h (hoặc ngắn hơn nếu có reservation)
  is_valid       TINYINT(1) DEFAULT 1,
  device_session VARCHAR(100)          -- tracking thiết bị đầu tiên validate key
);

CREATE TABLE restaurant_layouts (
  id          VARCHAR(50) PRIMARY KEY,  -- 'main'
  layout_data LONGTEXT                  -- JSON Konva.js
);
```

### `menudb`

```sql
CREATE TABLE categories (
  id       INT PRIMARY KEY AUTO_INCREMENT,
  name     VARCHAR(100),
  is_drink TINYINT(1)
);

CREATE TABLE foods (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(200),
  price       DECIMAL(10,2),
  image_url   VARCHAR(500),
  category_id INT REFERENCES categories(id)
);

CREATE TABLE buffet_packages (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100),
  price       DECIMAL(18,2),
  description TEXT
);

CREATE TABLE food_ingredients (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  food_id       INT REFERENCES foods(id),
  ingredient_id INT REFERENCES inventorydb.ingredients(id),
  amount        DECIMAL(10,2)
);
```

### `orderdb`

```sql
CREATE TABLE orders (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  table_id            INT NOT NULL,
  table_key           VARCHAR(255),      -- FK → table_keys.key_value (soft)
  user_id             INT,
  order_time          DATETIME,
  status              VARCHAR(50),
  -- 'Chờ xác nhận' | 'Đang nấu' | 'Hoàn thành'
  total               DECIMAL(18,2),
  is_buffet           TINYINT(1),
  buffet_session_id   VARCHAR(255),      -- UUID nhóm buffet orders
  buffet_package_id   INT,
  buffet_package_name VARCHAR(255),
  payment_status      VARCHAR(50) DEFAULT 'unpaid',
  -- 'unpaid' | 'waiting' | 'paid'
  updated_at          DATETIME
);

CREATE TABLE order_details (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  order_id     INT REFERENCES orders(id),
  food_id      INT,                      -- nullable (buffet placeholder)
  quantity     INT,
  price        DECIMAL(10,2),
  custom_name  VARCHAR(255),             -- tên buffet hoặc đồ uống miễn phí
  is_free_drink TINYINT(1)
);
```

### `kitchendb`

```sql
CREATE TABLE kitchen_queue (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  order_detail_id INT,                   -- FK → orderdb.order_details.id (soft)
  status          VARCHAR(50),
  -- 'Chờ chế biến' | 'Đang chế biến' | 'Hoàn thành'
  updated_at      DATETIME
);
```

### `paymentdb`

```sql
CREATE TABLE payments (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  order_id      INT,
  amount        DECIMAL(18,2),
  method        VARCHAR(20),   -- 'cash'
  cash_received DECIMAL(18,2),
  cash_change   DECIMAL(18,2),
  created_at    DATETIME,
  paid_at       DATETIME
);

CREATE TABLE payment_requests (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  order_id     INT,
  table_id     INT,
  total        DECIMAL(18,2),
  request_time DATETIME,
  status       VARCHAR(20)    -- 'waiting' | 'paid'
);
```

### `inventorydb`

```sql
CREATE TABLE ingredients (
  id       INT PRIMARY KEY AUTO_INCREMENT,
  name     VARCHAR(200),
  unit     VARCHAR(50),   -- 'kg', 'g', 'gói', 'hạt', ...
  quantity DECIMAL(10,2)
);
```

---

## 6. API Endpoints

### user-service — `/api/users/**`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/users/login` | ❌ | Đăng nhập (email / SĐT / username) |
| POST | `/api/users/register` | ❌ | Đăng ký tài khoản CUSTOMER |
| GET | `/api/users/verify-email?token=` | ❌ | Xác thực email từ link |
| GET | `/api/users/me` | ✅ | Thông tin user hiện tại |
| GET | `/api/users` | ✅ ADMIN | Danh sách tất cả user |
| GET | `/api/users/{id}` | ✅ ADMIN | Lấy user theo ID |
| POST | `/api/users` | ✅ ADMIN | Tạo user mới (staff) |
| PUT | `/api/users/{id}` | ✅ | Cập nhật user |
| DELETE | `/api/users/{id}` | ✅ ADMIN | Xóa user |
| GET | `/api/roles` | ❌ | Danh sách roles |

**Login request/response:**
```json
// Request
{ "identifier": "0912345678", "password": "..." }
// identifier có thể là: email / SĐT / username

// Response
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "user": { "id": 42, "username": "staff_huy", "fullName": "Huy", "role": { "id": 2, "name": "MANAGER" } }
}
```

**Register request:**
```json
{ "identifier": "0912345678", "password": "matkhau123", "fullName": "Nguyễn Văn A" }
// identifier là email hoặc SĐT
```

---

### table-service — `/api/tables/**`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/tables` | ❌ | Danh sách bàn |
| GET | `/api/tables/{id}` | ❌ | Chi tiết bàn |
| POST | `/api/tables` | ✅ STAFF | Tạo bàn |
| PUT | `/api/tables/{id}` | ✅ STAFF | Cập nhật bàn |
| DELETE | `/api/tables/{id}` | ✅ STAFF | Xóa bàn |
| POST | `/api/tables/{id}/reservations` | ✅ JWT | Tạo đặt bàn (customer_id tự fill nếu role=CUSTOMER) |
| GET | `/api/tables/reservations/my` | ✅ CUSTOMER | Đặt bàn của tôi |
| GET | `/api/tables/{id}/reservations` | ✅ STAFF | Tất cả đặt bàn của 1 bàn |
| GET | `/api/tables/{id}/reservations/availability` | ❌ | Kiểm tra còn trống `?start=&end=` |
| PUT | `/api/tables/reservations/{id}/status` | ✅ STAFF | Đổi trạng thái đặt bàn |
| GET | `/api/tables/{id}/upcoming-reservation` | ✅ STAFF | Đặt bàn tiếp theo (200 hoặc 204) |
| GET | `/api/tables/{id}/active-key` | ✅ STAFF | Key đang hoạt động + seconds_remaining (200 hoặc 204) |
| POST | `/api/tables/{id}/qr/dynamic` | ✅ STAFF | Tạo QR key động (smart expiry dựa vào reservation) |
| POST | `/api/tables/{id}/qr/static` | ✅ STAFF | Tạo QR key tĩnh |
| POST | `/api/tables/{id}/keys/invalidate` | ✅ STAFF | Vô hiệu tất cả key, reset status bàn → "Trống" |
| GET | `/api/tables/{id}/validate-key?key=` | ❌ | Validate key từ trang đặt món (khách) |

**Dynamic QR response:**
```json
{
  "qrCodeBase64": "data:image/png;base64,...",
  "key": "uuid-string",
  "expiresAt": "2026-04-06T20:45:00",
  "warning": "Bàn đã được đặt lúc 21:00. Key sẽ tự hết hạn lúc 20:45.",
  "upcoming_reservation_start": "2026-04-06T21:00:00"
}
// warning chỉ có khi có reservation trong 2 giờ tới
```

**active-key response:**
```json
{ "expiresAt": "2026-04-06T20:45:00", "secondsRemaining": 3241 }
```

---

### menu-service — `/api/menu/**`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/menu/categories` | ❌ | Danh sách danh mục |
| POST | `/api/menu/categories` | ✅ ADMIN | Tạo danh mục |
| PUT | `/api/menu/categories/{id}` | ✅ ADMIN | Cập nhật danh mục |
| DELETE | `/api/menu/categories/{id}` | ✅ ADMIN | Xóa danh mục |
| GET | `/api/menu/foods` | ❌ | Danh sách món ăn (`?category_id=` optional) |
| GET | `/api/menu/foods/{id}` | ❌ | Chi tiết món ăn |
| POST | `/api/menu/foods` | ✅ ADMIN | Tạo món ăn |
| PUT | `/api/menu/foods/{id}` | ✅ ADMIN | Cập nhật món ăn |
| DELETE | `/api/menu/foods/{id}` | ✅ ADMIN | Xóa món ăn |
| GET | `/api/menu/buffet-packages` | ❌ | Danh sách gói buffet |

---

### order-service — `/api/orders/**`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/orders` | ❌ | Tạo order (gọi món hoặc kích hoạt buffet) |
| GET | `/api/orders` | ✅ STAFF | Tất cả orders |
| GET | `/api/orders/{id}` | ❌ | Chi tiết order |
| GET | `/api/orders/table/{tableId}?tableKey=` | ❌ | Orders của phiên bàn |
| GET | `/api/orders/table/{tableId}/session-summary` | ❌ | Tóm tắt phiên bàn |
| GET | `/api/orders/sessions` | ✅ STAFF | Tất cả sessions |
| GET | `/api/orders/sessions/detail?tableId=&tableKey=` | ❌ | Chi tiết session |
| PUT | `/api/orders/{id}/status` | ✅ STAFF | Cập nhật status order |
| POST | `/api/orders/{id}/confirm` | ✅ ADMIN/MANAGER | Xác nhận lên bếp |
| POST | `/api/orders/sessions/confirm` | ✅ ADMIN/MANAGER | Xác nhận tất cả pending trong session |
| POST | `/api/orders/{id}/request-payment` | ❌ | Yêu cầu thanh toán |
| POST | `/api/orders/complete-payment` | ❌ | Hoàn thành thanh toán |

**Create order request:**
```json
{
  "table_id": 1,
  "table_key": "uuid",
  "items": [
    { "food_id": 39, "quantity": 2, "price": 350000 }
  ]
}

// Buffet activation (không có items):
{
  "table_id": 1,
  "table_key": "uuid",
  "is_buffet": true,
  "buffet_package_id": 1,
  "buffet_package_name": "Buffet Cơ Bản",
  "buffet_session_id": "buffet_1_1234567890"
}
```

---

### kitchen-service — `/api/kitchen/**`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/kitchen/queue?status=` | ❌ | Hàng đợi bếp (lọc theo status) |
| GET | `/api/kitchen/stats` | ❌ | Thống kê bếp |
| PUT | `/api/kitchen/queue/{id}/status` | ✅ STAFF | Cập nhật trạng thái món |
| DELETE | `/api/kitchen/queue/{id}` | ✅ STAFF | Xóa item trong queue |
| DELETE | `/api/kitchen/queue/completed` | ✅ STAFF | Xóa tất cả item đã hoàn thành |
| POST | `/api/kitchen/notify` | internal | Order-service gọi khi có order mới |

---

### payment-service — `/api/payments/**`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/payments/waiting` | ✅ CASHIER | Danh sách yêu cầu thanh toán đang chờ |
| POST | `/api/payments/request` | ❌ | Tạo yêu cầu thanh toán |
| POST | `/api/payments/process/cash` | ✅ CASHIER | Xử lý thanh toán tiền mặt |

---

### inventory-service — `/api/inventory/**`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/inventory/ingredients` | ✅ STAFF | Danh sách nguyên liệu |
| GET | `/api/inventory/ingredients/{id}` | ✅ STAFF | Chi tiết nguyên liệu |
| POST | `/api/inventory/ingredients` | ✅ ADMIN | Thêm nguyên liệu |
| PUT | `/api/inventory/ingredients/{id}` | ✅ ADMIN | Cập nhật nguyên liệu |
| DELETE | `/api/inventory/ingredients/{id}` | ✅ ADMIN | Xóa nguyên liệu |

---

### image-service — `/api/images/**`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/images/upload/food` | ✅ ADMIN | Upload ảnh món ăn |
| POST | `/api/images/upload/user` | ✅ | Upload ảnh user |
| GET | `/api/images/foods/{filename}` | ❌ | Lấy ảnh món ăn |
| GET | `/api/images/users/{filename}` | ❌ | Lấy ảnh user |

---

## 7. WebSocket

FE kết nối qua STOMP/SockJS. Tất cả endpoint đều đi qua Gateway.

### order-service — `/ws/order`

| Topic | Hướng | Payload |
|-------|-------|---------|
| `/topic/order.status.updated` | Server→Client | `{ orderId, status, tableId }` |
| `/topic/order.status.{tableId}` | Server→Client | Update theo từng bàn |
| `/topic/order.item-status.{tableId}` | Server→Client | Item được bếp hoàn thành |

### kitchen-service — `/ws/kitchen`

| Topic | Hướng | Payload |
|-------|-------|---------|
| `/topic/kitchen.new-order` | Server→Client | `{ orderDetailIds, items }` |
| `/topic/kitchen.queue-updated` | Server→Client | `{ id, status, orderDetailId }` |
| `/topic/kitchen.item-delivered` | Server→Client | `{ id, status: "Hoàn thành" }` |
| `/topic/kitchen.cleared` | Server→Client | `{}` |

### payment-service — `/ws/payment`

| Topic | Hướng | Payload |
|-------|-------|---------|
| `/topic/payment.requested` | Server→Client | `{ paymentRequestId, tableId, amount }` |
| `/topic/payment.completed` | Server→Client | `{ paymentIds, orderIds }` |

---

## 8. Phân quyền & JWT

### JWT Configuration

```
Secret:     ${JWT_SECRET} — biến môi trường bắt buộc trong production
            (fallback dev: restaurant_secret_key_12345678900)
Algorithm:  HS512
Expiration: 86400000ms = 24 giờ
Header:     Authorization: Bearer <token>
```

> ⚠️ **Bảo mật:** Phải đặt biến môi trường `JWT_SECRET` (tối thiểu 32 ký tự) khi deploy production. Fallback chỉ dùng cho môi trường dev local.

**Claims:**
```json
{
  "id": 42,
  "username": "staff_huy",
  "role_id": 2,
  "iat": 1744137600,
  "exp": 1744224000
}
```

### Roles

| ID | Name | Ghi chú |
|----|------|---------|
| 1 | ADMIN | Toàn quyền |
| 2 | MANAGER | Quản lý vận hành |
| 3 | CASHIER | Thu ngân |
| 4 | WAITER | Phục vụ bàn |
| 5 | CUSTOMER | Khách hàng tự đăng ký |

### Endpoints public (không cần JWT)

```
POST  /api/users/login
POST  /api/users/register
GET   /api/users/verify-email
GET   /api/tables
GET   /api/tables/{id}
GET   /api/tables/{id}/reservations/availability
GET   /api/menu/foods
GET   /api/menu/categories
GET   /api/menu/buffet-packages
POST  /api/orders          (xác thực qua table_key, không JWT)
GET   /api/orders/{id}
GET   /api/orders/table/**
POST  /api/orders/*/request-payment
GET   /api/images/**
```

### Phân quyền chi tiết

| Endpoint | PUBLIC | CUSTOMER(5) | WAITER(4) | CASHIER(3) | MANAGER(2) | ADMIN(1) |
|----------|--------|-------------|-----------|------------|------------|----------|
| GET `/api/tables` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST `/api/tables/{id}/reservations` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET `/api/tables/reservations/my` | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| POST `/api/tables/{id}/qr/dynamic` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| PUT `/api/tables/{id}` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| POST `/api/orders/{id}/confirm` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| GET `/api/users` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| POST `/api/payments/process/cash` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

> CUSTOMER (role_id=5) không thể truy cập bất kỳ endpoint quản trị nào của table-service.

---

## 9. Luồng nghiệp vụ

### 9.1 Đăng ký & Xác thực email (Customer)

```
Customer Browser                  user-service                    Email/Console
     │                                 │                               │
     ├─POST /register──────────────────►                               │
     │ { identifier: email,            │                               │
     │   password, fullName }          ├─ Hash BCrypt(10)             │
     │                                 ├─ Save (email_verified=0)     │
     │                                 ├─ Generate UUID token         │
     │                                 ├─ Send email ─────────────────►
     │◄─{ message: "check email" }─────┤   (hoặc in ra console nếu   │
     │                                 │    MAIL_USERNAME trống)      │
     │                                 │                               │
     │ Click link trong email          │                               │
     ├─GET /verify-email?token=UUID────►                               │
     │                                 ├─ Tìm user by token           │
     │                                 ├─ Kiểm tra expires_at (24h)   │
     │                                 ├─ email_verified = 1          │
     │                                 ├─ Xóa token                   │
     │◄─redirect /login?verified=true──┤                               │
     │                                 │                               │
     ├─POST /login ────────────────────►                               │
     │◄─{ token, user }────────────────┤                               │
     │ Lưu localStorage                │                               │
```

> Đăng ký bằng SĐT: bỏ qua bước email, `email_verified = 1` ngay lập tức.

### 9.2 Đặt bàn trước (Customer Web)

```
Customer Web                      table-service
     │                                │
     ├─GET /api/tables────────────────►
     │◄─[{ id, name, status }]─────────┤
     │
     ├─Chọn bàn, ngày, giờ, số người
     │
     ├─POST /api/tables/{id}/reservations──►
     │ {                               │
     │   customer_name, customer_phone,├─ Check overlap (SQL)
     │   party_size,                   ├─ Nếu trùng → 400 "Đã có đặt bàn"
     │   start_time, end_time,         ├─ Save (status = 'pending')
     │   notes,                        ├─ customer_id từ JWT (nếu có)
     │   customer_id: 42 (từ JWT)      │
     │ }                               │
     │◄─{ id, status: "pending", ... }─┤
     │ Hiện "Đặt bàn thành công"       │
```

**Kiểm tra overlap SQL:**
```sql
SELECT COUNT(*) FROM table_reservations
WHERE table_id = ? AND status IN ('pending', 'confirmed')
  AND NOT (end_time <= :start OR start_time >= :end)
```

### 9.3 Tạo QR Key thông minh (Admin)

```
Fe-Admin                          table-service
   │                                   │
   ├─POST /api/tables/{id}/qr/dynamic──►
   │                                   ├─ Tìm reservation tiếp theo
   │                                   │
   │                              Không có reservation trong 2h:
   │                                   ├─ expiresAt = now + 2 giờ
   │                                   │
   │                              Reservation ≤ 15 phút:
   │                                   ├─ HTTP 400 "Không thể tạo key"
   │                                   │
   │                              Reservation 15phút → 2h:
   │                                   ├─ expiresAt = resStart - 15 phút
   │                                   ├─ thêm field "warning" trong response
   │                                   │
   │◄─{ qrCodeBase64, key,             │
   │    expiresAt, warning? }──────────┤
   │ Hiện QR + cảnh báo (nếu có)      │
```

### 9.4 Gọi món tại bàn (Dine-in / QR)

```
Khách scan QR → mở http://localhost:3011/?tableId=1&tableKey=uuid

Browser (index.html)              Backend
     │
     ├─GET /api/tables/1────────────────► Lấy tên bàn
     ├─GET /api/menu/foods───────────────► Lấy menu
     ├─GET /api/orders/table/1?tableKey=► Lấy orders cũ
     │
     │ Chọn món → bấm "Đặt"
     ├─POST /api/orders──────────────────►
     │ { table_id, table_key, items: [...] }
     │                                   ├─ Validate table_key
     │                                   ├─ Tạo orders + order_details
     │                                   ├─ status = "Chờ xác nhận"
     │◄─{ id, status, total }────────────┤
     │
     │ (Staff xác nhận qua Fe-Admin)
     │   POST /api/orders/{id}/confirm───►
     │                                   ├─ status → "Đang nấu"
     │                                   ├─ POST /api/kitchen/notify (nội bộ)
     │                                   ├─ Thêm vào kitchen_queue
     │                                   ├─ WebSocket: /topic/kitchen.new-order
     │
     │ Khách bấm "Yêu cầu thanh toán"
     ├─POST /api/orders/{id}/request-payment──►
     │                                   ├─ Tạo payment_request (status='waiting')
     │                                   ├─ WebSocket: /topic/payment.requested
     │
     │ (Thu ngân xử lý tại Fe-Admin)
     │   POST /api/payments/process/cash─►
     │                                   ├─ Tạo Payment record
     │                                   ├─ order.payment_status = 'paid'
     │                                   ├─ WebSocket: /topic/payment.completed
     │ Nhận thông báo đã thanh toán      │
```

### 9.5 Luồng bếp (Kitchen Display)

```
Fe-Admin (Kitchen view)           kitchen-service + WebSocket
     │                                 │
     ├─Subscribe /topic/kitchen.*──────►
     │
     │ [Khi có order xác nhận]         │ POST /api/kitchen/notify (từ order-service)
     │                                 ├─ Insert kitchen_queue (status='Chờ chế biến')
     │                                 ├─ Broadcast /topic/kitchen.new-order
     │◄─ Hiện item mới trên màn────────┤
     │
     ├─PUT /api/kitchen/queue/{id}/status───►
     │ { status: "Đang chế biến" }     ├─ Update status
     │                                 ├─ Broadcast /topic/kitchen.queue-updated
     │◄─ Badge đổi màu────────────────┤
     │
     ├─PUT /api/kitchen/queue/{id}/status───►
     │ { status: "Hoàn thành" }        ├─ Update status
     │                                 ├─ Broadcast /topic/kitchen.item-delivered
     │                                 ├─ Gọi order-service cập nhật order.status
     │◄─ Item chuyển sang "Xong"───────┤
```

---

## 10. Frontend — Customer Web

**Vị trí:** `table-service/src/main/resources/static/`
**Serve bởi:** Spring Boot `SpaResourceConfig` — `/**` → exact file → `{path}/index.html` → 404

### Cấu trúc file

```
static/
├── index.html                  ← App chính (gọi món, scan QR)
├── payment-return.html         ← Trang sau thanh toán
├── js/
│   ├── config.js               ← const API_BASE = 'http://localhost:3000'
│   ├── auth.js                 ← getToken(), apiFetch(), requireAuth(), saveAuth()
│   └── navbar.js               ← renderNavbar(), logout(), escHtml()
├── css/
├── images/
├── login/index.html
├── register/index.html
├── verify-email/index.html
├── booking/index.html
├── my-reservations/index.html
└── menu/index.html
```

### Auth state (localStorage)

```js
localStorage.customer_token  // JWT string
localStorage.customer_user   // JSON: { id, fullName, email, phoneNumber, role }
```

`apiFetch(path, options)` tự động:
- Thêm `Authorization: Bearer <token>` header
- Nếu nhận 401 → xóa localStorage → redirect `/login/`

### Trang và chức năng

| Trang | Auth | API chính | Ghi chú |
|-------|------|-----------|---------|
| `/` (index.html) | ❌ | GET /api/tables/{id}, POST /api/orders | App gọi món dine-in, đọc tableId+tableKey từ URL |
| `/login/` | ❌ | POST /api/users/login | Redirect `?redirect=` sau login |
| `/register/` | ❌ | POST /api/users/register | Email → "check email"; SĐT → link login |
| `/verify-email/` | ❌ | GET /api/users/verify-email?token= | Tự gọi khi load, đọc `?token=` từ URL |
| `/booking/` | ✅ | GET /api/tables, POST /api/tables/{id}/reservations | requireAuth() redirect login |
| `/my-reservations/` | ✅ | GET /api/tables/reservations/my | Read-only, DESC by start_time |
| `/menu/` | ❌ | GET /api/menu/items, GET /api/menu/categories | Lọc available != false |

---

## 11. Frontend — Fe-Admin

**Vị trí:** `Fe-Admin/`
**Port:** `3010` (Next.js dev)
**Base URL:** `http://localhost:3000/api`

### Các trang

| Route | Roles | Chức năng |
|-------|-------|-----------|
| `/login` | public | Đăng nhập |
| `/dashboard` | ADMIN/MANAGER | Thống kê tổng quan, biểu đồ doanh thu |
| `/tables` | STAFF+ | Quản lý bàn, tạo QR, xem đặt bàn, countdown phiên |
| `/orders` | STAFF+ | Xem/xác nhận/quản lý orders |
| `/kitchen` | STAFF+ | Màn hình bếp, cập nhật trạng thái chế biến |
| `/menu` | ADMIN | CRUD món ăn, danh mục, gói buffet |
| `/inventory` | ADMIN | Quản lý nguyên liệu |
| `/staff` | ADMIN | Quản lý tài khoản nhân viên |
| `/cashier` | CASHIER+ | Xử lý thanh toán |
| `/floor-plan` | ADMIN | Sơ đồ bàn (kéo thả Konva.js) |
| `/portioning` | ADMIN | Định lượng nguyên liệu theo món |

### Tính năng bàn (trang `/tables`) — nổi bật

**Countdown phiên đang dùng:**
- State `tick` tăng 1 giây/lần (setInterval 1000ms)
- Gọi `GET /api/tables/{id}/active-key` khi load và mỗi 20 giây
- Hiển thị: `⏱️ {h}g {mm}p {ss}s còn lại trong phiên` (nền đỏ nhạt)

**Lịch đặt bàn sắp tới:**
- Gọi `GET /api/tables/{id}/upcoming-reservation` khi load và mỗi 20 giây
- Hiển thị: `📅 Hôm nay/Ngày mai HH:mm · Tên khách · N khách` (nền xanh nhạt)

**QR Dialog cảnh báo:**
- Nếu tạo QR khi có reservation sắp tới → hiện hộp cảnh báo `⚠️` màu vàng + giờ hết hạn key

### Dependencies chính

```json
{
  "@radix-ui/*":          "UI components",
  "recharts":             "Biểu đồ dashboard",
  "konva + react-konva":  "Sơ đồ bàn canvas",
  "axios":                "HTTP client",
  "@stomp/stompjs":       "WebSocket STOMP",
  "sockjs-client":        "SockJS fallback",
  "@hookform/resolvers":  "Form validation",
  "zod":                  "Schema validation"
}
```

---

## 12. Cấu hình

### application-local.yml (chung)

```yaml
spring:
  datasource:
    url: "jdbc:mysql://localhost:3306/{service}db?createDatabaseIfNotExist=true"
    username: root
    password: ""              # Laragon default

  jpa:
    hibernate:
      ddl-auto: update        # Tự tạo/cập nhật bảng khi start

jwt:
  secret: ${JWT_SECRET:restaurant_secret_key_12345678900}  # Dùng env var trong production!
  expiration: 86400000        # 24 giờ (ms)
```

### Biến môi trường

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `JWT_SECRET` | `restaurant_secret_key_12345678900` | **Bắt buộc đổi trong production** |
| `MAIL_HOST` | `sandbox.smtp.mailtrap.io` | SMTP host |
| `MAIL_PORT` | `587` | SMTP port |
| `MAIL_USERNAME` | _(trống)_ | SMTP user — để trống để dùng dev mode (in link ra console) |
| `MAIL_PASSWORD` | _(trống)_ | SMTP password |
| `APP_FRONTEND_URL` | `http://localhost:3011` | URL customer web (dùng trong email verify) |

### user-service — cấu hình email

```yaml
spring:
  mail:
    host: ${MAIL_HOST:sandbox.smtp.mailtrap.io}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME:}   # Để trống = DEV mode (in link ra console)
    password: ${MAIL_PASSWORD:}

app:
  base-url: http://localhost:3000
  frontend-url: http://localhost:3011  # Customer web URL sau verify-email
```

**DEV mode** (khi `MAIL_USERNAME` trống):
```
[DEV] Email verification link: http://localhost:3000/api/users/verify-email?token=xxxxxxxx
```
Dùng [Mailtrap](https://mailtrap.io) để test email thật.

### Giao tiếp nội bộ service-to-service

Các service gọi nhau trực tiếp (không qua Gateway):

```yaml
# order-service
services:
  kitchen: http://localhost:3004
  payment: http://localhost:3008
  menu:    http://localhost:3002
  table:   http://localhost:3011

# kitchen-service
services:
  order: http://localhost:3003

# payment-service
services:
  order: http://localhost:3003
```

### Maven build

```bat
# Chạy từng service riêng (để debug):
cd table-service
mvn -Dspring-boot.run.profiles=local spring-boot:run

# Build JAR:
mvn clean package -DskipTests
```

---

## 13. Known Issues

✅ **Tất cả 32/32 bugs đã được sửa.** Xem chi tiết đầy đủ trong [`BUG_REPORT.md`](BUG_REPORT.md).

### ✅ Đã sửa (32 bugs)

| # | Vấn đề | Vị trí | Mức độ |
|---|--------|--------|--------|
| BUG-001 | JWT secret hardcode trong tất cả 8 service | `application.yml` (tất cả service) | CRITICAL |
| BUG-002 | Race condition double-booking reservation (thiếu UNIQUE constraint) | `TableService.java`, migration | CRITICAL |
| BUG-003 | Thanh toán đúp — `completePayment()` không kiểm tra status "paid" | `OrderService.java` | CRITICAL |
| BUG-004 | XSS qua `innerHTML` khi load danh sách bàn trong trang booking | `booking/index.html` | CRITICAL |
| BUG-005 | Race condition table key claim — không atomic | `TableKeyRepository.java`, `TableService.java` | CRITICAL |
| BUG-006 | NPE khi `roleId` null trong `UserController` (4 endpoint) | `UserController.java` | CRITICAL |
| BUG-031 | Path Traversal trong `ImageUploadController` — `/{category}/{filename}` không sanitize | `ImageUploadController.java` | CRITICAL |
| BUG-007 | JWT token blacklist khi logout (DB-backed, bền vững qua restart) | `TokenBlacklistService.java`, `RevokedToken.java` | HIGH |
| BUG-008 | Không validate format email khi đăng ký (dùng `contains("@")`) | `AuthService.java` | HIGH |
| BUG-009 | Chính sách mật khẩu yếu (không yêu cầu chữ hoa, số, ≥8 ký tự) | `RegisterRequest.java` | HIGH |
| BUG-010 | `requestPayment()` không lọc order đã paid — có thể tạo payment request trùng | `OrderService.java` | HIGH |
| BUG-011 | `escHtml()` thiếu escape dấu nháy đơn `'` → XSS tiềm ẩn | `navbar.js` | HIGH |
| BUG-012 | JWT lưu trong `localStorage` → chuyển sang `sessionStorage` + logout gọi backend | `auth.js` (customer web) | HIGH |
| BUG-013 | Payment không validate order tồn tại và chưa thanh toán trước khi process | `PaymentService.java` | HIGH |
| BUG-014 | Payment không kiểm tra payment_status "waiting" trước khi process | `PaymentService.java` | HIGH |
| BUG-018 | Email verify redirect về port 3001 (sai) thay vì 3011 | `user-service application.yml` | HIGH |
| BUG-032 | Dead code mojibake gây compile error trong `OrderService` | `OrderService.java` | HIGH |
| BUG-015 | Xóa bàn không cascade — orphan records trong `table_keys`, `table_reservations` | `TableService.java` | MEDIUM |
| BUG-016 | `updateTable()` không whitelist status hợp lệ — có thể set giá trị tùy ý | `TableService.java` | MEDIUM |
| BUG-017 | `invalidateTableKey()` reset `is_buffet = false` (thuộc tính vĩnh viễn của bàn) | `TableService.java` | MEDIUM |
| BUG-019 | Booking page không gọi availability check trước khi POST reservation | `booking/index.html` | MEDIUM |
| BUG-020 | Unauthenticated request có thể inject `customer_id` giả vào reservation | `TableController.java` | MEDIUM |
| BUG-021 | `createOrder()` không có transaction timeout — deadlock có thể treo mãi | `OrderService.java` | MEDIUM |
| BUG-022 | `buffet_session_id` do FE tự sinh — server không kiểm soát | `OrderService.java` | MEDIUM |
| BUG-023 | Không có rate limiting trên register / login / verify-email | `RateLimitInterceptor.java` | MEDIUM |
| BUG-024 | Kitchen notification gọi SAU khi update order status — nếu lỗi thì không rollback | `OrderService.java` | MEDIUM |
| BUG-025 | Log `[TRU KHO]` ghi thông tin nhạy cảm ở level INFO | `KitchenService.java` | MEDIUM |
| BUG-026 | `API_BASE` hardcode `localhost:3000` trong config.js frontend | `config.js` | LOW |
| BUG-027 | Thiếu index trên các cột thường query — hiệu năng kém khi scale | Schema DB | LOW |
| BUG-028 | `verifyPassword()` còn fallback so sánh plaintext password | `AuthService.java` | LOW |
| BUG-029 | CORS không restrict origin — tất cả domain đều được phép | `WebConfig.java` (8 service) | LOW |
| BUG-030 | Inventory không auto-deduct khi confirm order | `OrderService.java`, `InternalMenuController.java` | LOW |

---

## Migrations

| File | Schema | Nội dung |
|------|--------|---------|
| `migrations/2026-04-02_add_table_reservations.sql` | tabledb | Tạo bảng `table_reservations`, indexes |
| `migrations/2026-04-06_add_customer_role.sql` | userdb | INSERT role CUSTOMER (ID=5) |
| `migrations/2026-04-06_add_customer_features.sql` | userdb + tabledb | Thêm `email_verified`, `email_verification_token`, `email_verification_expires_at` vào `users`; thêm `customer_id` vào `table_reservations` |
| `migrations/2026-04-06_add_revoked_tokens.sql` | userdb | Tạo bảng `revoked_tokens` cho JWT token blacklist (DB-backed) |
