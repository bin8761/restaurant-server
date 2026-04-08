# Thiết kế UI SePay (FE Admin)

## Mục tiêu
- Ẩn các thành phần không dùng: Transaction Ref, hoàn tiền thủ công, thao tác, ghi chú, dòng mô tả theo dõi giao dịch.
- Mapping trạng thái sang văn nói dễ hiểu.
- Hiển thị thời gian đúng múi giờ Việt Nam theo format `HH:mm:ss dd/MM/yyyy`.
- Thanh tìm kiếm chỉ lọc theo Order ID, hỗ trợ cả `#123` và `123`, bỏ placeholder.

## Phạm vi
- Chỉ thay đổi FE Admin ở trang SePay (`Fe-Admin/app/payments/page.tsx`).
- Không thay đổi API/backend.

## Thiết kế UI
- **Ẩn cột**: Transaction Ref, Hoàn tiền thủ công, Thao tác.
- **Ẩn phần**: input ghi chú hoàn tiền thủ công, mô tả “Theo dõi giao dịch...”.
- **Tabs trạng thái**: hiển thị nhãn thân thiện:
  - ALL → Tất cả
  - PENDING → Chờ thanh toán
  - PAID → Đã thanh toán
  - FAILED → Thất bại
  - EXPIRED → Hết hạn
  - PAID_PENDING_SYNC → Đã thanh toán (đang đồng bộ)
- **Bảng**: cột còn lại: Order, Số tiền, Trạng thái, Thời gian.
- **Trạng thái**: mapping văn nói như trên (dùng chung cho tab và cell).
- **Tìm kiếm**: input không placeholder; chỉ lọc theo Order ID. Accept cả `#123` và `123`.

## Logic dữ liệu
- **Mapping status**: map giá trị status sang nhãn hiển thị. Nếu status lạ, hiển thị “Không xác định”.
- **Thời gian**: format bằng `Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })` và ghép theo thứ tự `HH:mm:ss dd/MM/yyyy`.
- **Thiếu dữ liệu**: nếu timestamp rỗng thì hiển thị `—`.

## Rủi ro/Edge cases
- Dữ liệu status không nằm trong map → “Không xác định”.
- `order_id` trống → search không match; hiển thị bình thường.
- Timestamp dạng ISO/epoch: parse trước khi format; nếu parse lỗi → `—`.

## Kiểm thử thủ công
- Tab status hiển thị đúng nhãn văn nói.
- Search: nhập `#158` hoặc `158` lọc đúng order.
- Các cột/khối bị ẩn không còn xuất hiện.
- Thời gian hiển thị đúng giờ Việt Nam và format `HH:mm:ss dd/MM/yyyy`.
