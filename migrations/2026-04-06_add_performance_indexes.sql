-- BUG-027: Thêm database index cho các cột query thường xuyên
-- Chạy trên orderdb
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_orders_table_key (table_key);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_orders_payment_status (payment_status);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_orders_table_payment (table_id, table_key, payment_status);

-- Chạy trên tabledb
ALTER TABLE table_keys ADD INDEX IF NOT EXISTS idx_keys_value_valid (key_value, is_valid);
ALTER TABLE table_keys ADD INDEX IF NOT EXISTS idx_keys_table_valid (table_id, is_valid, expires_at);
ALTER TABLE table_reservations ADD INDEX IF NOT EXISTS idx_reservations_table_time (table_id, start_time, end_time);
ALTER TABLE table_reservations ADD INDEX IF NOT EXISTS idx_reservations_customer (customer_id);

-- Chạy trên kitchendb (nếu tên DB khác, thay thích hợp)
ALTER TABLE kitchen_queue ADD INDEX IF NOT EXISTS idx_kitchen_status (status);

-- NOTE: IF NOT EXISTS chỉ hỗ trợ từ MySQL 8.0.29+. Nếu dùng MySQL cũ hơn,
-- bỏ "IF NOT EXISTS" và chạy thủ công từng câu.
