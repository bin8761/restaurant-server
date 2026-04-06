# Hướng Dẫn Chạy Local

## Môi trường yêu cầu

| Phần mềm | Ghi chú |
|----------|---------|
| **Java 21** | Bắt buộc cho Spring Boot 3.2.4 |
| **Maven** | `all.bat` tự tải Maven 3.9.6 portable nếu chưa có trong PATH |
| **MySQL** | Chạy qua **Laragon** — user `root`, password trống |
| **Node.js / npm** | Cần có để chạy Fe-Admin |

---

## Khởi động hệ thống

### Bước 1 — Chuẩn bị MySQL

1. Bật **Laragon** → Start MySQL
2. Import SQL nếu chưa có data (dùng HeidiSQL hoặc phpMyAdmin):
   - Import file `restaurant_full2.sql` (tạo đầy đủ schema + dữ liệu mẫu)

### Bước 2 — Chạy migration (chỉ lần đầu setup)

Chạy theo thứ tự trong MySQL:

```sql
-- 1. Thêm role CUSTOMER vào userdb
source migrations/2026-04-06_add_customer_role.sql

-- 2. Thêm cột email_verified, customer_id v.v.
source migrations/2026-04-06_add_customer_features.sql
```

> Nếu đã import `restaurant_full2.sql` mới thì có thể các migration này đã được tích hợp sẵn. Kiểm tra trong HeidiSQL trước khi chạy lại.

### Bước 3 — Khởi động tất cả backend services

```bat
all.bat
```

Script sẽ:
- Dọn các port cũ của project (3000, 3002–3008, 3011)
- Tự tải Maven portable nếu chưa có trong PATH
- Mở 9 cửa sổ cmd, mỗi cửa sổ chạy 1 service với profile `local`

### Bước 4 — Khởi động Fe-Admin

```bat
cd Fe-Admin
npm run dev -- -p 3010
```

> **Lưu ý:** Chỉ định port `-p 3010` để đúng với CORS config của API Gateway. Nếu không chỉ định, Next.js có thể chạy trên port 3001 (vì port 3000 đã bị API Gateway dùng) → gây lỗi CORS.

Fe-Admin chạy tại: **http://localhost:3010**

> **Customer web KHÔNG cần bước build riêng** — đã là plain HTML/JS, serve trực tiếp bởi `table-service` tại `:3011`.

---

## Port đang dùng

| Port | Service | URL |
|------|---------|-----|
| **3000** | API Gateway | http://localhost:3000 |
| **3002** | menu-service | — |
| **3003** | order-service | — |
| **3004** | kitchen-service | — |
| **3005** | user-service | — |
| **3006** | inventory-service | — |
| **3007** | image-service | — |
| **3008** | payment-service | — |
| **3010** | Fe-Admin (Next.js) | http://localhost:3010 |
| **3011** | table-service + **Customer Web** | http://localhost:3011 |

> Customer web và table-service API cùng chạy trên port `3011` — đây là thiết kế có chủ ý, không nhầm.

### Customer Web — các trang dành cho khách hàng

| Trang | URL |
|-------|-----|
| Đặt món tại bàn (scan QR) | http://localhost:3011/ |
| Đăng ký tài khoản | http://localhost:3011/register/ |
| Đăng nhập | http://localhost:3011/login/ |
| Đặt bàn trước | http://localhost:3011/booking/ |
| Lịch đặt bàn của tôi | http://localhost:3011/my-reservations/ |
| Xem menu | http://localhost:3011/menu/ |

---

## Dừng hệ thống

```bat
stop-all.bat
```

Dừng riêng Fe-Admin: nhấn `Ctrl+C` trong cửa sổ terminal đang chạy `npm run dev`.

---

## Cấu hình email (xác thực tài khoản customer)

Chỉnh trong `user-service/src/main/resources/application-local.yml`:

```yaml
spring:
  mail:
    host: sandbox.smtp.mailtrap.io
    port: 587
    username: "YOUR_MAILTRAP_USERNAME"
    password: "YOUR_MAILTRAP_PASSWORD"
```

**Nếu để trống `username`:** Hệ thống in link xác thực ra console thay vì gửi email. Tiện cho dev — tìm dòng như:

```
[DEV] Email verification link: http://localhost:3000/api/users/verify-email?token=xxxxxxxx
```

Dùng [Mailtrap](https://mailtrap.io) (miễn phí) để nhận email test thật.

---

## Profile Spring Boot

Tất cả service dùng profile `local` khi chạy qua `all.bat`:

```bat
mvn -Dspring-boot.run.profiles=local spring-boot:run
```

Mỗi service có file `src/main/resources/application-local.yml` để override cấu hình (DB URL, mail, v.v.) mà không ảnh hưởng production.

---

## Lưu ý

- Nếu máy bạn có ứng dụng khác dùng trùng các port trên, `all.bat` và `stop-all.bat` sẽ **kill toàn bộ process đang dùng port đó** (không phân biệt ứng dụng nào).
- Nếu cần chạy riêng 1 service để debug trong IDE, không cần dùng `all.bat` — chạy trực tiếp qua IntelliJ IDEA với profile `local`.
