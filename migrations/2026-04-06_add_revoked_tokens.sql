-- BUG-007 (fix đầy đủ): Bảng lưu JWT đã bị thu hồi (logout blacklist)
-- Thay thế in-memory map bằng persistent storage.
-- Chạy trên schema: userdb

CREATE TABLE IF NOT EXISTS revoked_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    token      TEXT NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    INDEX idx_revoked_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lưu ý: Hibernate ddl-auto=update sẽ tự tạo bảng này khi restart service.
-- Chạy script thủ công chỉ cần thiết nếu ddl-auto=validate hoặc none.
