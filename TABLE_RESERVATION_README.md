# Tài Liệu Chi Tiết Module Bàn Và Đặt Bàn

Tài liệu này mô tả đầy đủ toàn bộ phần liên quan đến quản lý bàn, đặt bàn trước, lịch đặt bàn, QR bàn và các giao diện admin/customer đã được bổ sung trong hệ thống.

Mục tiêu của tài liệu:

- Giúp dev mới hiểu nhanh toàn bộ module bàn và đặt bàn.
- Làm tài liệu tham chiếu khi debug lỗi reservation, QR, lịch đặt bàn.
- Làm tài liệu nghiệp vụ để test luồng customer, cashier, manager, waiter.
- Tổng hợp những gì đã thêm gần đây thay vì phải đọc rải rác trong nhiều file.

---

## 1. Phạm Vi Module

Module này bao gồm 4 phần liên kết chặt với nhau:

1. Quản lý danh sách bàn trong nhà hàng.
2. Đặt bàn trước từ customer web.
3. Quản lý và xác nhận đơn đặt bàn từ admin web.
4. Quản lý QR/key cho khách đang ngồi tại bàn, có tích hợp với lịch đặt bàn sắp tới.

Các thành phần chính:

- Backend chính: `table-service`
- Frontend customer: static HTML trong `table-service/src/main/resources/static/`
- Frontend admin: `Fe-Admin`
- Gateway: `api-gateway`
- Database: `tabledb`

---

## 2. Kiến Trúc Tổng Quan

### 2.1 Vai trò của table-service

`table-service` chịu trách nhiệm cho các nghiệp vụ:

- CRUD bàn.
- Tạo và quản lý lịch đặt bàn.
- Kiểm tra trùng lịch.
- Trả lịch đặt bàn của customer theo JWT.
- Trả danh sách reservation cho staff/admin.
- Trả reservation sắp tới của từng bàn để admin web hiển thị cảnh báo.
- Tạo QR tĩnh/động cho bàn.
- Quản lý table key đang hoạt động.

### 2.2 Giao diện sử dụng module

Customer web trên port `3011`:

- `/menu/`: xem thực đơn.
- `/booking/`: đặt bàn.
- `/my-reservations/`: xem lịch sử đặt bàn của mình.
- `/`: khách tại bàn sau khi quét QR để gọi món.

Admin web trên port `3010`:

- `/tables`: quản lý bàn, tạo QR, xem lịch sắp tới, xem key còn hiệu lực.
- `/reservations`: quản lý toàn bộ đơn đặt bàn online, xác nhận hoặc hủy.

Gateway route:

- `/api/tables/**` -> `http://localhost:3011`

---

## 3. Dữ Liệu Và Schema Database

### 3.1 Bảng `restaurant_tables`

Đây là bảng lưu thông tin bàn vật lý của nhà hàng.

Các thuộc tính quan trọng trong code:

- `id`: ID bàn.
- `name`: tên hiển thị, ví dụ `Bàn 01`, `Bàn VIP 2`.
- `status`: trạng thái hiện tại của bàn.
- `is_buffet`: bàn buffet hay không.
- `capacity`: sức chứa.

Các trạng thái bàn đang được validate trong code:

- `Trống`
- `Đang sử dụng`
- `Đã đặt`
- `Chờ xác nhận`

Lưu ý:

- Trạng thái bàn là trạng thái vận hành tức thời, không phải trạng thái duy nhất để suy ra reservation.
- Lịch đặt bàn sắp tới được tính từ bảng `table_reservations`, không dựa thuần vào `restaurant_tables.status`.

### 3.2 Bảng `table_reservations`

Migration gốc tạo bảng nằm tại:

- `migrations/2026-04-02_add_table_reservations.sql`

Entity mapping nằm tại:

- `table-service/src/main/java/com/restaurant/tableservice/entity/TableReservation.java`

Schema thực tế:

| Cột | Kiểu | Ý nghĩa |
|-----|------|--------|
| `id` | INT | ID reservation |
| `table_id` | INT | Bàn được đặt |
| `customer_name` | VARCHAR(100) | Tên khách |
| `customer_phone` | VARCHAR(30) | Số điện thoại khách |
| `party_size` | INT | Số lượng khách |
| `start_time` | DATETIME | Giờ bắt đầu |
| `end_time` | DATETIME | Giờ kết thúc |
| `status` | VARCHAR(30) | Trạng thái reservation |
| `is_buffet` | TINYINT(1) | Có phải đơn buffet |
| `buffet_package_id` | INT | Gói buffet |
| `buffet_package_name` | VARCHAR(255) | Tên gói buffet |
| `notes` | VARCHAR(500) | Ghi chú của khách |
| `customer_id` | INT, NULL | Link mềm sang `userdb.users.id` |
| `created_at` | DATETIME | Thời điểm tạo |
| `updated_at` | DATETIME | Thời điểm cập nhật |

Index quan trọng:

- `idx_resv_table_time (table_id, start_time, end_time)`
- `idx_resv_status (status)`
- `idx_resv_customer (customer_id)` từ migration customer features

### 3.3 Migration thêm `customer_id`

Migration bổ sung nằm tại:

- `migrations/2026-04-06_add_customer_features.sql`

Ý nghĩa của `customer_id`:

- Có giá trị: reservation gắn với user đã đăng nhập.
- `NULL`: reservation do staff tạo hộ khách vãng lai hoặc dữ liệu cũ.

Lưu ý kỹ thuật:

- Đây là soft link sang `userdb.users`, không có foreign key cứng giữa hai database service.
- API `GET /api/tables/reservations/my` dựa trên `customer_id` để lấy đúng lịch của customer.

### 3.4 Bảng `table_keys`

Tài liệu này tập trung vào reservation, nhưng `table_keys` vẫn liên quan trực tiếp vì QR động bị giới hạn theo lịch đặt bàn sắp tới.

Vai trò:

- Lưu key truy cập cho khách tại bàn.
- Mỗi key có `expires_at`, `is_valid`, `device_session`.
- Khi reset bàn hoặc tạo key mới, key cũ bị vô hiệu hóa.

---

## 4. Trạng Thái Nghiệp Vụ

### 4.1 Trạng thái reservation

Các trạng thái đang được UI và backend hỗ trợ:

- `pending`: mới tạo, chờ staff xác nhận.
- `confirmed`: đã xác nhận, reservation có hiệu lực vận hành.
- `cancelled`: đã hủy.
- `completed`: đã phục vụ xong.
- `no_show`: khách không đến.

Quy ước nghiệp vụ hiện tại:

- Customer đặt bàn online sẽ mặc định đi vào `pending`.
- Reservation chỉ được dùng để hiển thị lịch sắp tới ở trang quản lý bàn khi đã là `confirmed`.
- Reservation `pending` vẫn được tính vào kiểm tra trùng lịch để tránh overbooking.

### 4.2 Trạng thái bàn

Các trạng thái bàn hiện có:

- `Trống`
- `Đang sử dụng`
- `Đã đặt`
- `Chờ xác nhận`

Ý nghĩa thực tế:

- `Đang sử dụng`: đã có key đang hợp lệ hoặc khách đang sử dụng bàn.
- `Trống`: không có phiên active.
- `Đã đặt` và `Chờ xác nhận`: có thể dùng cho vận hành nội bộ, nhưng lịch sắp tới hiển thị dựa trên reservation confirmed.

---

## 5. Phân Quyền Và JWT

Security filter chính nằm tại:

- `table-service/src/main/java/com/restaurant/tableservice/security/JwtAuthenticationFilter.java`

Luật quyền hiện tại:

- Internal call có header `X-Internal-Call: true` được đi qua.
- Một số GET public không cần token.
- `GET /api/tables/reservations/my` bắt buộc có JWT.
- CUSTOMER chỉ được:
  - `POST /api/tables/{id}/reservations`
  - `GET /api/tables/reservations/my`
- STAFF/ADMIN/MANAGER/CASHIER/WAITER có full access cho các endpoint quản trị bàn.

Hành vi quan trọng:

- Nếu customer gửi `customer_id` khác với JWT thì backend sẽ override lại bằng `userId` trong token.
- Nếu request không đăng nhập thì backend xóa `customer_id` để tránh giả mạo.

---

## 6. API Reference Chi Tiết

Controller chính:

- `table-service/src/main/java/com/restaurant/tableservice/controller/TableController.java`

Service xử lý:

- `table-service/src/main/java/com/restaurant/tableservice/service/TableService.java`

Repository reservation:

- `table-service/src/main/java/com/restaurant/tableservice/repository/TableReservationRepository.java`

### 6.1 API quản lý bàn

#### GET `/api/tables`

Mục đích:

- Lấy toàn bộ danh sách bàn.
- Dùng ở customer booking page và admin tables page.

Auth:

- Public GET.

#### GET `/api/tables/{id}`

Mục đích:

- Lấy chi tiết một bàn.

Auth:

- Public GET.

#### POST `/api/tables`

Mục đích:

- Tạo bàn mới.

Auth:

- Staff trở lên.

Payload điển hình:

```json
{
  "name": "Bàn 12",
  "status": "Trống",
  "is_buffet": false,
  "capacity": 4
}
```

#### PUT `/api/tables/{id}`

Mục đích:

- Sửa tên, trạng thái, buffet flag của bàn.

Logic đặc biệt:

- Nếu đổi trạng thái về `Trống` thì backend tự invalidate mọi key active của bàn đó.

#### DELETE `/api/tables/{id}`

Mục đích:

- Xóa bàn.

Logic đặc biệt:

- Xóa cascade thủ công các record `table_keys` và `table_reservations` trước rồi mới xóa bàn.

### 6.2 API đặt bàn trước

#### POST `/api/tables/{id}/reservations`

Mục đích:

- Tạo reservation mới cho bàn.

Auth:

- Cần JWT.
- Customer được phép gọi.
- Staff cũng có thể dùng để đặt hộ khách.

Payload thực tế customer web gửi:

```json
{
  "customer_name": "Nguyen Van A",
  "customer_phone": "0901234567",
  "party_size": 4,
  "start_time": "2026-04-06T18:00:00",
  "end_time": "2026-04-06T20:00:00",
  "notes": "Sinh nhật"
}
```

Validation backend:

- `table_id` phải tồn tại.
- Nếu không có `customer_id` thì bắt buộc có `customer_name` và `customer_phone`.
- `party_size` phải > 0.
- `start_time` và `end_time` phải có.
- `start_time < end_time`.
- Không được trùng khung giờ với reservation `pending` hoặc `confirmed`.

Khi user đã đăng nhập:

- `customer_id` được auto-fill từ JWT.
- Nếu frontend không truyền `customer_name` hoặc `customer_phone`, backend sẽ tự fallback.

Mặc định status:

- Nếu payload không truyền `status`, entity sẽ tự gán `pending`.

#### GET `/api/tables/{id}/reservations/availability?start=&end=`

Mục đích:

- Kiểm tra bàn còn trống trong khoảng thời gian yêu cầu hay không.

Auth:

- Public GET.

Response:

```json
{
  "available": true
}
```

Lưu ý:

- Customer booking page gọi endpoint này trước khi submit reservation thật.
- Dù đã check availability ở frontend, backend vẫn kiểm tra lại để chống race condition.

### 6.3 API lịch sử đặt bàn của customer

#### GET `/api/tables/reservations/my`

Mục đích:

- Trả toàn bộ reservation của customer hiện tại.

Auth:

- JWT bắt buộc.
- Dựa trên `request.userId` từ JWT để query `customer_id`.

Sắp xếp:

- `ORDER BY start_time DESC`

Trạng thái trả về:

- Trả tất cả trạng thái, không chỉ pending/confirmed.

### 6.4 API quản lý reservation cho admin/staff

#### GET `/api/tables/reservations`

Mục đích:

- Lấy danh sách reservation theo trạng thái.

Query param:

- `status=all`
- `status=pending`
- `status=confirmed`
- `status=cancelled`
- `status=completed`

#### GET `/api/tables/admin/reservations`

Mục đích:

- Endpoint dành riêng cho admin web để tránh nhầm route và dùng rõ ràng cho màn hình quản lý đơn đặt bàn.

Ghi chú:

- Hiện logic vẫn dùng cùng service `getAllReservations(status)`.

#### PUT `/api/tables/reservations/{id}/status`

Mục đích:

- Đổi trạng thái reservation.

Payload:

```json
{
  "status": "confirmed"
}
```

Hành vi hiện tại:

- Không khóa transition quá chặt ở backend.
- UI admin hiện hỗ trợ xác nhận và hủy.

### 6.5 API reservation sắp tới của từng bàn

#### GET `/api/tables/{id}/upcoming-reservation`

Mục đích:

- Trả reservation tiếp theo của một bàn để admin FE hiển thị cảnh báo lịch sắp tới.

Auth:

- Staff trở lên.

Hành vi hiện tại rất quan trọng:

- Chỉ lấy reservation `confirmed` gần nhất trong tương lai.
- Không còn hiển thị lịch `pending` ở trang quản lý bàn.

Nếu không có dữ liệu:

- Trả `204 No Content`.

Repository query hiện tại chọn:

- `status = 'confirmed'`
- `start_time > now()`
- `ORDER BY start_time ASC LIMIT 1`

---

## 7. Logic Kiểm Tra Trùng Lịch

Hàm sử dụng:

- `countOverlappingReservations(tableId, startTime, endTime)`

SQL logic:

```sql
SELECT COUNT(*)
FROM table_reservations
WHERE table_id = :tableId
  AND status IN ('pending', 'confirmed')
  AND NOT (end_time <= :startTime OR start_time >= :endTime)
```

Ý nghĩa:

- Nếu reservation cũ kết thúc trước hoặc đúng lúc reservation mới bắt đầu thì không trùng.
- Nếu reservation cũ bắt đầu sau hoặc đúng lúc reservation mới kết thúc thì không trùng.
- Mọi trường hợp còn lại đều được xem là chồng lấn thời gian.

Hệ quả nghiệp vụ:

- Reservation `pending` vẫn khóa slot thời gian.
- Tránh trường hợp nhiều cashier/customer đặt cùng một bàn trong cùng khung giờ.

Lớp bảo vệ thứ hai:

- Khi save có `DataIntegrityViolationException`, backend sẽ trả lỗi xung đột đồng thời.

---

## 8. Smart QR Key Expiry Tích Hợp Reservation

Logic nằm trong:

- `TableService.generateDynamicQRCode()`

### 8.1 Mục tiêu

Khi staff tạo QR động cho khách đang ngồi bàn, hệ thống cần tránh cấp key quá dài nếu bàn sắp có khách đặt trước.

### 8.2 Thuật toán hiện tại

1. Invalidate toàn bộ key cũ của bàn.
2. Lấy reservation `confirmed` gần nhất trong tương lai của bàn đó.
3. Nếu không có reservation gần, key sống 2 giờ.
4. Nếu có reservation gần, key sẽ hết hạn sớm hơn để chừa 15 phút dọn bàn.

### 8.3 Quy tắc chi tiết

Buffer dọn bàn:

- `15 phút`

Các nhánh:

- Không có reservation sắp tới:
  - `expiresAt = now + 2h`
- Có reservation nhưng còn xa hơn 2 giờ:
  - `expiresAt = now + 2h`
- Có reservation trong vòng 15 phút tới:
  - Từ chối cấp key mới.
- Có reservation trong khoảng từ hơn 15 phút đến dưới 2 giờ:
  - `expiresAt = reservationStart - 15 phút`

Response có thể chứa thêm:

- `warning`
- `upcoming_reservation_start`

### 8.4 Tác động tới vận hành

- Staff không thể vô tình cấp một phiên dine-in kéo dài chồng lên giờ bàn đã xác nhận cho khách khác.
- Màn hình admin biết trước giờ cần thu dọn bàn.

---

## 9. Customer Web Flow

Thư mục chính:

- `table-service/src/main/resources/static/`

### 9.1 Trang `/booking/`

File:

- `table-service/src/main/resources/static/booking/index.html`

Chức năng:

- Bắt buộc đăng nhập bằng `requireAuth()`.
- Lấy danh sách bàn từ `GET /api/tables`.
- Cho nhập ngày, giờ, thời lượng, số khách, ghi chú.
- Gọi check availability trước khi submit.
- Nếu thành công, hiện success card và nút đi tới `/my-reservations/`.

Các bước submit thực tế:

1. User chọn bàn.
2. User chọn ngày và giờ.
3. Frontend tính `end_time` dựa trên duration.
4. Frontend gọi `GET /api/tables/{id}/reservations/availability`.
5. Nếu available -> gọi `POST /api/tables/{id}/reservations`.
6. Backend tạo reservation với status mặc định `pending`.
7. Frontend hiện thông báo thành công.

Điểm quan trọng:

- Frontend dùng tên và số điện thoại từ user đang đăng nhập nếu có.
- Validation giao diện chỉ là lớp ngoài; backend vẫn là nguồn kiểm tra cuối cùng.

### 9.2 Trang `/my-reservations/`

File:

- `table-service/src/main/resources/static/my-reservations/index.html`

Chức năng:

- Bắt buộc đăng nhập.
- Gọi `GET /api/tables/reservations/my`.
- Hiển thị list reservation theo thứ tự mới nhất trước.
- Có badge màu theo trạng thái.
- Có empty state và CTA để đặt tiếp.

Thông tin hiển thị:

- Mã bàn.
- Khung thời gian.
- Số khách.
- Cờ buffet nếu có.
- Ghi chú nếu có.
- Trạng thái reservation.

### 9.3 Navbar customer

File:

- `table-service/src/main/resources/static/js/navbar.js`

Link liên quan đến module:

- `Thực đơn`
- `Đặt bàn`
- `Đặt bàn của tôi`

---

## 10. Admin Web Flow

### 10.1 Trang `/reservations`

File:

- `Fe-Admin/app/reservations/page.tsx`

Mục đích:

- Cho cashier/staff xử lý đơn đặt bàn online.

Tính năng hiện tại:

- Lọc theo trạng thái.
- Refresh định kỳ mỗi 20 giây.
- Hiển thị tên bàn, tên khách, số điện thoại, số khách, thời gian, ghi chú.
- Cho phép:
  - `Xác nhận`
  - `Hủy`

Chi tiết mới đã thêm:

- Filter mặc định là `pending` để staff thấy ngay đơn chờ xử lý.
- Sau khi xác nhận/hủy, UI tự chuyển filter sang `all` để đơn vừa đổi trạng thái không bị hiểu nhầm là biến mất.

Endpoint sử dụng:

- `GET /tables/admin/reservations`
- `GET /tables`
- `PUT /tables/reservations/{id}/status`

### 10.2 Trang `/tables`

File:

- `Fe-Admin/app/tables/page.tsx`

Mục đích:

- Quản lý trạng thái bàn tại chỗ.
- Cấp QR cho khách ngồi bàn.
- Theo dõi key còn hạn.
- Cảnh báo lịch confirmed sắp tới.

Tính năng chính:

- Danh sách bàn dạng card.
- Tìm kiếm theo tên bàn.
- Tạo bàn mới.
- Sửa bàn, xóa bàn.
- Hiển thị countdown key active.
- Hiển thị reservation sắp tới trong 30 phút.
- Toggle xem chi tiết lịch.

Luồng enrich dữ liệu cho mỗi bàn:

1. Gọi `GET /tables`.
2. Với mỗi bàn:
   - Gọi `GET /tables/{id}/upcoming-reservation`
   - Nếu bàn đang dùng, gọi `GET /tables/{id}/active-key`
3. Gom dữ liệu vào `enrichments` map.

Quy tắc hiển thị lịch tại card bàn:

- Reservation phải tồn tại.
- `startTime` phải parse được.
- Chỉ hiển thị nếu còn từ `0` đến `30` phút nữa.
- Chỉ là reservation `confirmed` vì backend đã lọc sẵn.

Thông tin hiển thị trên card:

- Ngày/giờ bắt đầu.
- Số phút còn lại.
- Số khách.
- Có thể mở rộng để xem tên khách, điện thoại, ghi chú, khung giờ đầy đủ.

---

## 11. File Map Quan Trọng

### 11.1 Backend

- `table-service/src/main/java/com/restaurant/tableservice/controller/TableController.java`
- `table-service/src/main/java/com/restaurant/tableservice/service/TableService.java`
- `table-service/src/main/java/com/restaurant/tableservice/repository/TableReservationRepository.java`
- `table-service/src/main/java/com/restaurant/tableservice/repository/TableKeyRepository.java`
- `table-service/src/main/java/com/restaurant/tableservice/repository/TableRepository.java`
- `table-service/src/main/java/com/restaurant/tableservice/entity/TableReservation.java`
- `table-service/src/main/java/com/restaurant/tableservice/security/JwtAuthenticationFilter.java`
- `table-service/src/main/java/com/restaurant/tableservice/config/WebConfig.java`

### 11.2 Customer web

- `table-service/src/main/resources/static/booking/index.html`
- `table-service/src/main/resources/static/my-reservations/index.html`
- `table-service/src/main/resources/static/menu/index.html`
- `table-service/src/main/resources/static/js/auth.js`
- `table-service/src/main/resources/static/js/navbar.js`
- `table-service/src/main/resources/static/js/config.js`

### 11.3 Admin web

- `Fe-Admin/app/tables/page.tsx`
- `Fe-Admin/app/reservations/page.tsx`
- `Fe-Admin/components/admin-layout.tsx`
- `Fe-Admin/lib/axios.ts`

### 11.4 Migration

- `migrations/2026-04-02_add_table_reservations.sql`
- `migrations/2026-04-06_add_customer_features.sql`

---

## 12. Luồng Nghiệp Vụ End-to-End

### 12.1 Customer đặt bàn online

1. Customer đăng nhập.
2. Customer vào `/booking/`.
3. Chọn bàn, giờ, thời lượng, số khách.
4. Frontend gọi check availability.
5. Backend kiểm tra overlap với reservation `pending` và `confirmed`.
6. Nếu hợp lệ, backend tạo reservation `pending`.
7. Customer thấy reservation đó ở `/my-reservations/`.
8. Staff/cashier thấy đơn đó ở `/reservations`.
9. Staff xác nhận -> reservation chuyển `confirmed`.
10. Khi gần giờ vào bàn, trang `/tables` mới hiển thị lịch đó trên card bàn.

### 12.2 Staff xử lý đơn online

1. Vào `/reservations`.
2. Mặc định thấy danh sách `pending`.
3. Kiểm tra khách, bàn, giờ, số khách.
4. Bấm `Xác nhận` hoặc `Hủy`.
5. UI tự chuyển sang `all` để staff thấy kết quả vừa xử lý.

### 12.3 Staff vận hành bàn có reservation sắp tới

1. Vào `/tables`.
2. Thấy card bàn nào có lịch `confirmed` trong 30 phút tới.
3. Nếu cần cấp QR cho khách hiện tại, hệ thống tính thời gian hết hạn key dựa trên reservation kế tiếp.
4. Nếu quá sát giờ reservation, backend từ chối cấp key mới.

---

## 13. Quy Tắc Quan Trọng Cần Nhớ

1. Customer online luôn tạo reservation ở trạng thái `pending` nếu không truyền status riêng.
2. Kiểm tra trùng lịch tính cả `pending` lẫn `confirmed`.
3. Trang `/my-reservations/` lấy dữ liệu theo `customer_id` gắn với JWT.
4. Trang `/tables` chỉ hiển thị lịch `confirmed`, không hiển thị `pending`.
5. Trang `/tables` chỉ show lịch trong khoảng 30 phút tới để tránh rối giao diện.
6. QR động bị giới hạn bởi lịch confirmed sắp tới của cùng bàn.
7. Reset bàn về `Trống` sẽ invalidate toàn bộ key active.
8. Xóa bàn sẽ xóa luôn reservations và keys liên quan.

---

## 14. Checklist Test Sau Khi Chạy Hệ Thống

### 14.1 Customer flow

- Đăng nhập customer thành công.
- Vào `/booking/` tải được danh sách bàn.
- Chọn giờ trống -> đặt thành công.
- Chọn giờ trùng -> nhận lỗi đúng.
- Reservation mới xuất hiện ở `/my-reservations/`.

### 14.2 Admin reservation flow

- Vào `/reservations` thấy đơn mới ở `pending`.
- Bấm `Xác nhận` -> badge đổi sang `confirmed`.
- Sau update đơn vẫn thấy được do filter auto chuyển `all`.
- Bấm `Hủy` -> badge đổi `cancelled`.

### 14.3 Admin tables flow

- Vào `/tables` thấy danh sách bàn.
- Nếu có reservation confirmed trong 30 phút tới, card bàn hiện block lịch màu xanh.
- Nếu reservation vẫn là `pending`, không hiển thị ở block lịch.
- Tạo QR động khi bàn có confirmed reservation gần -> warning và expiry rút ngắn.
- Tạo QR quá sát giờ confirmed reservation -> backend chặn cấp key.

---

## 15. Các Lỗi Thường Gặp Và Cách Hiểu

### 15.1 Đơn xác nhận xong bị biến mất ở trang `/reservations`

Nguyên nhân cũ:

- Filter mặc định là `pending`, nên sau khi đổi sang `confirmed` đơn không còn thuộc danh sách đang lọc.

Hành vi hiện tại:

- UI tự chuyển sang `all` sau khi update status.

### 15.2 Trang quản lý bàn hiện lịch ngay cả khi chưa xác nhận

Nguyên nhân cũ:

- Endpoint `upcoming-reservation` từng lấy cả `pending` và `confirmed`.

Hành vi hiện tại:

- Chỉ lấy `confirmed`.

### 15.3 Customer không thấy lịch sử đặt bàn của mình

Các điểm cần kiểm tra:

- JWT có hợp lệ không.
- `customer_id` của reservation có được gán đúng từ token không.
- Request `GET /api/tables/reservations/my` có bị 401 không.
- Migration thêm `customer_id` đã chạy chưa.

### 15.4 Đặt bàn báo trùng dù staff chưa xác nhận

Đây là hành vi đúng theo thiết kế hiện tại vì:

- `pending` vẫn chiếm slot để tránh overbooking.

---

## 16. Gợi Ý Mở Rộng Sau Này

Nếu tiếp tục nâng cấp module này, các hướng hợp lý là:

1. Thêm state machine cho reservation status để tránh update status tùy ý.
2. Thêm bộ lọc theo ngày trên trang `/reservations`.
3. Thêm search theo tên khách hoặc số điện thoại.
4. Thêm tự động đổi reservation `confirmed` sang `completed` sau giờ kết thúc nếu staff xác nhận phục vụ xong.
5. Thêm cảnh báo nếu customer có nhiều reservation pending trùng nhau ở nhiều bàn.
6. Thêm foreign key mềm được validate qua user-service khi tạo reservation có `customer_id`.

---

## 17. Tóm Tắt Ngắn

Module bàn và đặt bàn hiện tại đã có đủ các phần sau:

- Customer xem menu, đặt bàn, xem lịch sử đặt bàn của mình.
- Admin quản lý bàn, tạo QR, theo dõi lịch sắp tới, theo dõi key đang hoạt động.
- Cashier/staff xác nhận hoặc hủy đơn đặt bàn online.
- Backend kiểm tra trùng lịch, liên kết reservation với customer qua JWT, và đồng bộ QR expiry với lịch confirmed sắp tới.

Đây là một module tương đối hoàn chỉnh cho nhu cầu nhà hàng có cả khách walk-in lẫn khách đặt trước.