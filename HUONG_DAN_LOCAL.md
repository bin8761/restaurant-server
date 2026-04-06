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


### Bước 2 — Tự động khởi tạo database (không cần chạy migration thủ công)

**Server sẽ tự động tạo database schema khi start:**
- Hibernate `ddl-auto: update` sẽ tạo các table từ JPA entities
- Class `DataInitializer` sẽ insert default roles: CUSTOMER, ADMIN, STAFF, KITCHEN
- OTP columns + revoked_tokens table sẽ được tạo tự động

> **Nếu muốn chạy migration SQL thủ công** (option):
> ```sql
> source migrations/2026-04-06_add_email_otp.sql;
> SELECT * FROM roles WHERE name = 'CUSTOMER';
> ```
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

## Cấu hình email (xác thực tài khoản customer qua OTP)

### Sử dụng Gmail + App Password

1. **Bật 2-Step Verification trên Gmail:**
   - Vào https://myaccount.google.com/security
   - Bật "2-Step Verification"

2. **Tạo App Password:**
   - Vào https://myaccount.google.com/apppasswords
   - Chọn "Mail" và "Windows Computer"
   - Copy 16 ký tự password (dạng `xxxx xxxx xxxx xxxx`)

3. **Cấu hình trong `user-service/src/main/resources/application-local.yml`:**

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: "your-email@gmail.com"  # Thay bằng email Gmail của bạn
    password: "uammsdmlfpsqddj"        # Xóa dấu cách từ App Password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
```

### Không gửi email (chỉ in OTP ra console)

Nếu để trống `username`, hệ thống sẽ in OTP 6 chữ số ra console:

```yaml
spring:
  mail:
    username: ""  # Trống → in OTP ra console
```

Output:
```
=== [DEV MODE] Email Verification OTP ===
To: user@gmail.com
OTP: 123456
==========================================
```

**Để xác thực email:** Dùng API `/api/users/verify-otp?email=user@gmail.com&otp=123456`

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
