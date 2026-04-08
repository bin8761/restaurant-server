# Thiết kế xuất XLSX cho Kho (FE Admin)

## Mục tiêu
- Thêm nút xuất file XLSX cho kho với 2 lựa chọn: **Toàn kho** và **Sắp hết hàng**.
- Cột xuất theo đúng bảng Kho hiện tại.
- Tên file theo mẫu: `kho-YYYYMMDD.xlsx` và `kho-sap-het-YYYYMMDD.xlsx`.

## Phạm vi
- Chỉ thay đổi FE Admin trang Kho (`Fe-Admin/app/inventory/page.tsx`).
- Không thay đổi backend/API.

## UI/Trải nghiệm
- Thêm nút `Xuất Excel` cạnh khu vực tìm kiếm/Thêm mới.
- Khi bấm mở menu chọn:
  - `Toàn kho`
  - `Sắp hết hàng`

## Dữ liệu & Cột xuất
- Nguồn dữ liệu: danh sách kho đang render ở UI.
- Cột xuất (theo bảng hiện tại):
  - ID
  - Tên nguyên liệu
  - Đơn vị
  - Số lượng tồn
- Không xuất các cột thao tác.

## Logic kỹ thuật
- Dùng thư viện `xlsx` để tạo workbook và trigger download.
- Dữ liệu sẽ được map thành mảng object, mỗi row ứng với 1 nguyên liệu.
- Nếu danh sách trống, hiển thị toast báo “Không có dữ liệu để xuất”.

## Naming file
- Toàn kho: `kho-YYYYMMDD.xlsx`
- Sắp hết hàng: `kho-sap-het-YYYYMMDD.xlsx`

## Kiểm thử thủ công
- Xuất Toàn kho → file có đầy đủ dòng.
- Xuất Sắp hết hàng → file chỉ có nguyên liệu sắp hết.
- Tên file đúng mẫu.
