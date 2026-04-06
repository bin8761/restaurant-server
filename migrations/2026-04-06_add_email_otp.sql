-- Migration: Add OTP columns and ensure CUSTOMER role exists
-- Date: 2026-04-06

USE userdb;

-- 1. Add OTP columns nếu chưa có
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_otp VARCHAR(6) NULL,
ADD COLUMN IF NOT EXISTS email_verification_otp_expires_at DATETIME(3) NULL;

-- 2. Ensure CUSTOMER role exists
INSERT IGNORE INTO roles (ID, name) VALUES (5, 'CUSTOMER');

-- 3. Mark as applied
SELECT 'Migration 2026-04-06_add_email_otp applied successfully' as status;
