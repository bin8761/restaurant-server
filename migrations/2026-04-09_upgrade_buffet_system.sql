-- Migration: Upgrade Buffet System to Realistic Standards
-- Date: 2026-04-09

-- Update Buffet Packages in menudb
-- Existing column 'price' will be treated as Adult Price
ALTER TABLE buffet_packages ADD COLUMN price_child DECIMAL(18,2) DEFAULT 0;
ALTER TABLE buffet_packages ADD COLUMN duration_minutes INT DEFAULT 120;

-- Update Foods in menudb
-- Default to 1 (true) for existing items to avoid breaking changes
ALTER TABLE foods ADD COLUMN is_buffet_eligible TINYINT(1) DEFAULT 1;

-- Update Orders in orderdb
ALTER TABLE orders ADD COLUMN num_adults INT DEFAULT 1;
ALTER TABLE orders ADD COLUMN num_children INT DEFAULT 0;
ALTER TABLE orders ADD COLUMN buffet_expiry_time DATETIME;

-- Update Table Reservations in tabledb
ALTER TABLE table_reservations ADD COLUMN num_adults INT DEFAULT 1;
ALTER TABLE table_reservations ADD COLUMN num_children INT DEFAULT 0;
