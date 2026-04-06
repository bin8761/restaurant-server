-- BUG-002: Thêm unique index để ngăn race condition đặt bàn trùng giờ
-- Chạy trên schema: tabledb (hoặc schema chứa bảng table_reservations)

ALTER TABLE table_reservations
ADD UNIQUE INDEX uq_table_slot (table_id, start_time, end_time);

-- Lưu ý: Nếu đã có dữ liệu trùng trong DB, cần dọn trước:
-- DELETE r1 FROM table_reservations r1
-- INNER JOIN table_reservations r2
-- WHERE r1.id > r2.id
--   AND r1.table_id = r2.table_id
--   AND r1.start_time = r2.start_time
--   AND r1.end_time = r2.end_time;
