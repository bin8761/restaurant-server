-- Complete Migration for Database Initialization
-- Run this manually if needed: mysql -u root < migrations/2026-04-06_init_all.sql
-- Or server runs automatically on startup

USE userdb;

-- ===== 1. Ensure default roles exist =====
INSERT IGNORE INTO roles (ID, name) VALUES 
(1, 'ADMIN'),
(2, 'STAFF'),
(3, 'KITCHEN'),
(5, 'CUSTOMER');

-- ===== 2. Add OTP columns if missing =====
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_otp VARCHAR(6) NULL,
ADD COLUMN IF NOT EXISTS email_verification_otp_expires_at DATETIME(3) NULL;

-- ===== 3. Create revoked_tokens table if missing (for JWT blacklist) =====
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    token      TEXT NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    INDEX idx_revoked_expires (expires_at),
    UNIQUE KEY idx_revoked_token (token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== Verification =====
SELECT '✓ Roles' as status;
SELECT ID, name FROM roles ORDER BY ID;

SELECT '✓ Users schema' as status;
DESCRIBE users;

SELECT '✓ Revoked tokens table' as status;
DESCRIBE revoked_tokens;

SELECT 'Migration completed successfully!' as result;
