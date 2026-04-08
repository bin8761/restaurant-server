-- Seed Buffet Packages for menudb
USE menudb;

INSERT INTO buffet_packages (name, price, price_child, duration_minutes, description) VALUES 
('Buffet Classic', 299000.00, 149000.00, 120, 'Gói Buffet cơ bản với hơn 50 món nướng và lẩu đặc sắc.'),
('Buffet Premium', 499000.00, 249000.00, 180, 'Gói Buffet thượng hạng với hải sản tươi sống, bò Wagyu và quầy Line không giới hạn.'),
('Buffet Lunch (T2-T6)', 199000.00, 99000.00, 90, 'Gói Buffet trưa tiết kiệm dành cho dân văn phòng và sinh viên.');

-- Đảm bảo các món ăn hiện tại đều có thể gọi buffet (nếu chưa set)
UPDATE foods SET is_buffet_eligible = 1 WHERE is_buffet_eligible IS NULL;
