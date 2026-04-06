USE userdb;

CREATE TABLE IF NOT EXISTS email_verification_otp_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    is_valid TINYINT(1) NOT NULL DEFAULT 1,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    sent_at DATETIME(3) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    used_at DATETIME(3) NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    last_attempt_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    CONSTRAINT fk_otp_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_otp_logs_email ON email_verification_otp_logs (email);
CREATE INDEX IF NOT EXISTS idx_otp_logs_status ON email_verification_otp_logs (status);
CREATE INDEX IF NOT EXISTS idx_otp_logs_expires_at ON email_verification_otp_logs (expires_at);

-- Cleanup old OTP tracking columns on users table (from previous design)
ALTER TABLE users
    DROP COLUMN IF EXISTS email_verification_otp_email,
    DROP COLUMN IF EXISTS email_verification_otp_status,
    DROP COLUMN IF EXISTS email_verification_otp_used,
    DROP COLUMN IF EXISTS email_verification_otp_sent_at,
    DROP COLUMN IF EXISTS email_verification_otp_used_at,
    DROP COLUMN IF EXISTS email_verification_otp_attempt_count,
    DROP COLUMN IF EXISTS email_verification_otp_last_attempt_at;
