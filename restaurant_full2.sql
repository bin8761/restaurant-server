-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 01, 2026 at 05:10 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `inventorydb`
--
CREATE DATABASE IF NOT EXISTS `inventorydb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `inventorydb`;

-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ingredients`
--

INSERT INTO `ingredients` (`id`, `name`, `unit`, `quantity`) VALUES
(1, 'Thịt bò', 'kg', 9.50),
(2, 'Bánh phở', 'kg', 99.00),
(3, 'Gà', 'kg', 8.00),
(4, 'Cơm trắng', 'kg', 6.00),
(5, 'Trà túi lọc', 'gói', 30.00),
(6, 'Đào hộp', 'kg', 4.00),
(7, 'Kem', 'tấn', 3.00),
(8, 'Vani', 'lít', 2000.00),
(10, 'Gạo', 'hạt', 1.00),
(11, 'Tỏi', 'g', 88.09),
(12, 'Ớt', 'g', 37.56),
(13, 'Gừng', 'củ', 60.73),
(14, 'Sả', 'tép', 14.02),
(15, 'Hành tím', 'kg', 6.26),
(16, 'Chanh', 'quả', 64.71),
(17, 'Rau thơm', 'g', 15.28),
(18, 'Ngò', 'g', 10.53),
(19, 'Tiêu', 'g', 40.44),
(20, 'Đường', 'g', 86.98),
(21, 'Muối', 'g', 41.02),
(22, 'Bột ngọt', 'g', 34.42),
(23, 'Dầu ăn', 'l', 10.38),
(24, 'Nước mắm', 'ml', 81.14),
(25, 'Xì dầu', 'ml', 25.55),
(26, 'Dấm', 'ml', 28.65),
(27, 'Bơ', 'g', 63.67),
(28, 'Kem', 'g', 89.11),
(29, 'Sữa tươi', 'ml', 42.53),
(30, 'Sữa đặc', 'ml', 97.60),
(31, 'Thịt bò', 'kg', 4.36),
(32, 'Thịt gà', 'kg', 1.87),
(33, 'Thịt heo', 'kg', 2.40),
(34, 'Cá hồi', 'kg', 5.61),
(35, 'Tôm', 'g', 17.26),
(36, 'Mực', 'kg', 2.97),
(37, 'Nấm rơm', 'g', 12.81),
(38, 'Nấm hương', 'g', 91.74),
(39, 'Trứng gà', 'quả', 22.90),
(40, 'Trứng vịt', 'quả', 19.17),
(41, 'Đậu phụ', 'kg', 3.76),
(42, 'Rau muống', 'g', 13.96),
(43, 'Cải ngọt', 'g', 86.49),
(44, 'Cải xanh', 'g', 23.02),
(45, 'Bông cải', 'g', 70.74),
(46, 'Khoai tây', 'g', 55.57),
(47, 'Khoai lang', 'g', 7.85),
(48, 'Cà rốt', 'g', 78.01),
(49, 'Su hào', 'g', 3.47),
(50, 'Dưa leo', 'quả', 11.84),
(51, 'Cà chua', 'quả', 28.93),
(52, 'Xoài', 'quả', 9.12),
(53, 'Chuối', 'quả', 6.38),
(54, 'Dứa', 'quả', 18.48),
(55, 'Nho', 'g', 47.89),
(56, 'Dưa hấu', 'g', 93.04),
(57, 'Táo', 'quả', 16.15),
(58, 'Lê', 'quả', 18.70),
(59, 'Vải', 'g', 37.36),
(60, 'Mít', 'g', 45.13),
(61, 'Sầu riêng', 'g', 51.02),
(62, 'Hạt sen', 'g', 72.60),
(63, 'Đậu xanh', 'g', 36.41),
(64, 'Đậu đen', 'g', 31.08),
(65, 'Lạc', 'g', 61.93),
(66, 'Hạt điều', 'g', 48.60),
(67, 'Hạnh nhân', 'g', 83.07),
(68, 'Bột mì', 'g', 14.63),
(69, 'Bột năng', 'g', 67.80),
(70, 'Bột gạo', 'g', 76.49),
(71, 'Mì sợi', 'g', 39.12),
(72, 'Phở khô', 'g', 82.34),
(73, 'Bún tươi', 'g', 75.48),
(74, 'Rau răm', 'g', 9.24),
(75, 'Húng quế', 'g', 5.63),
(76, 'Tía tô', 'g', 6.17),
(77, 'Rau má', 'g', 4.71),
(78, 'Hành lá', 'g', 7.38),
(79, 'Ớt chuông', 'quả', 13.44),
(80, 'Ớt hiểm', 'quả', 8.93),
(81, 'Ớt xanh', 'quả', 11.26),
(82, 'Măng', 'g', 14.86),
(83, 'Dừa nạo', 'g', 20.19),
(84, 'Rau cải thìa', 'g', 25.03),
(85, 'Rau diếp', 'g', 16.79),
(86, 'Bí đỏ', 'g', 19.41),
(87, 'Bí xanh', 'g', 17.35),
(88, 'Mướp', 'g', 12.95),
(89, 'Cà pháo', 'quả', 8.22),
(90, 'Chả cá', 'g', 48.61),
(91, 'Giò sống', 'g', 55.70),
(92, 'Thịt xay', 'g', 33.89),
(93, 'Chả lụa', 'g', 39.66),
(94, 'Nem chua', 'g', 23.40),
(95, 'Nấm kim châm', 'g', 10.78),
(96, 'Nấm mối', 'g', 16.53),
(97, 'Nấm linh chi', 'g', 21.74),
(98, 'Rong biển', 'g', 5.29),
(99, 'Trà xanh', 'g', 9.66),
(100, 'Trà ô long', 'g', 11.23),
(101, 'Cà phê', 'g', 18.45),
(102, 'Ca cao', 'g', 22.08),
(103, 'Socola', 'g', 15.99),
(104, 'Phô mai', 'g', 30.21),
(105, 'Bánh mì', 'ổ', 12.13),
(106, 'Bánh tráng', 'tờ', 42.67),
(107, 'Bột chiên xù', 'g', 10.49),
(108, 'Gia vị lẩu', 'g', 34.88),
(109, 'Xốt cà chua tươi', 'kg', 80.59),
(110, 'Cá basa tươi', 'g', 35.04),
(111, 'Lòng đỏ trứng tươi', 'l', 13.42),
(112, 'Rau thơm khô khô', 'miếng', 82.13),
(113, 'Nấm sò khô', 'thìa', 20.08),
(114, 'Bột canh cắt lát', 'muỗng', 83.13),
(115, 'Sốt BBQ khô', 'g', 82.52),
(116, 'Lá lốt nghiền', 'củ', 33.68),
(117, 'Lòng đỏ trứng khô', 'tép', 45.82),
(118, 'Muối tôm xắt nhỏ', 'thìa', 72.66),
(119, 'Xốt cà chua tươi', 'kg', 80.59),
(120, 'Cá basa tươi', 'g', 35.04),
(121, 'Lòng đỏ trứng tươi', 'l', 13.42),
(122, 'Rau thơm khô khô', 'miếng', 82.13),
(123, 'Nấm sò khô', 'thìa', 20.08),
(124, 'Bột canh cắt lát', 'muỗng', 83.13),
(125, 'Sốt BBQ khô', 'g', 82.52),
(126, 'Lá lốt nghiền', 'củ', 33.68),
(127, 'Lòng đỏ trứng khô', 'tép', 45.82),
(128, 'Muối tôm xắt nhỏ', 'thìa', 72.66);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=129;
--
-- Database: `kitchendb`
--
CREATE DATABASE IF NOT EXISTS `kitchendb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kitchendb`;

-- --------------------------------------------------------

--
-- Table structure for table `kitchen_queue`
--

CREATE TABLE `kitchen_queue` (
  `id` int NOT NULL,
  `order_detail_id` int DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kitchen_queue`
--

INSERT INTO `kitchen_queue` (`id`, `order_detail_id`, `status`, `updated_at`) VALUES
(7, 158, 'Hoàn thành', '2026-04-02 00:06:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `kitchen_queue`
--
ALTER TABLE `kitchen_queue`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `kitchen_queue`
--
ALTER TABLE `kitchen_queue`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- Database: `menudb`
--
CREATE DATABASE IF NOT EXISTS `menudb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `menudb`;

-- --------------------------------------------------------

--
-- Table structure for table `buffet_packages`
--

CREATE TABLE `buffet_packages` (
  `id` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(18,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_drink` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `is_drink`) VALUES
(1, ' Khai vị (Appetizers)', 0),
(2, 'Món chính - Hải sản (Main Courses - Seafood)', 0),
(3, ' Món Việt Cao Cấp (High-end Vietnamese Selections)', 0),
(4, ' Món chính - Thịt (Main Courses - Meat & Poultry)', 0),
(5, ' Tráng miệng (Desserts)', 0),
(6, 'Thức uống gợi ý kèm món ăn (Wine & Beverage Pairings)', 0),
(7, 'Súp (Soups)', 0),
(8, 'Món Sống & Món Lạnh (Raw & Cold Dishes)', 0),
(10, 'Món Chay Fine Dining (Vegetarian & Vegan Options)', 0),
(12, 'Thực Đơn Đặc Biệt (Special Menus)', 0);

-- --------------------------------------------------------

--
-- Table structure for table `foods`
--

CREATE TABLE `foods` (
  `id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `foods`
--

INSERT INTO `foods` (`id`, `name`, `price`, `image_url`, `category_id`) VALUES
(1, 'Bạch tuộc nướng sốt chanh leo', 199000.00, '/api/images/foods/9e2fd424-0db6-4b57-96fc-a7df45870b35.jpg', 1),
(2, 'Súp bí đỏ vị quế, kem tươi', 299000.00, '/api/images/foods/50d1201d-95b9-41b9-a6d4-b0cf99666d02.jpg', 1),
(11, 'Cá hồi xông khói cuộn phô mai và trứng cá tầm', 350000.00, '/api/images/foods/60652afd-9399-4b39-84b0-cc6a8eb96ec7.jpg', 1),
(14, 'Bánh khọt tôm tươi mini', 1300000.00, '/api/images/foods/5d125b13-92f7-4544-a3dd-2aef8db88789.jpg', 1),
(15, 'Cà phê MOKA', 75000.00, '/api/images/foods/4463147b-8dbb-4112-9162-3b3e5183ab00.jpg', 6),
(34, 'Nộm hoa chuối bò tái chanh', 270000.00, '/api/images/foods/0a047683-1db7-41e0-95c3-64ddf34b1e8b.jpg', 1),
(35, 'Sashimi tổng hợp thượng hạng (Cá ngừ đại dương, cá hồi, bạch tuộc)', 899000.00, '/api/images/foods/b94a37df-44e0-4b77-b92a-1d4392e2e793.jpg', 1),
(36, 'Kimbap bò nướng sốt mè rang', 98000.00, '/api/images/foods/fe92b17d-1fc3-4d80-a519-2c1749369bc8.jpg', 1),
(37, 'Salad rong biển trứng cua', 299000.00, '/api/images/foods/59192cec-e516-495c-b964-28de11946e01.jpg', 1),
(38, 'Gỏi bò ngũ sắc', 199000.00, '/api/images/foods/5171481d-98f4-4e34-afd8-88a183d42f93.jpg', 1),
(39, 'Cá hồi áp chảo sốt chanh dây', 499000.00, '/api/images/foods/f7647939-f105-4b0c-96c4-9d70164638a7.jpg', 2),
(40, 'Mực nướng sa tế', 499000.00, '/api/images/foods/74c79798-1abd-4537-920e-7e6f98ae96ef.jpg', 2),
(41, 'Tôm hùm nướng bơ tỏi & mù tạt Dijon', 899000.00, '/api/images/foods/b416045c-4a6c-4a34-a188-aa162463087e.jpg', 2),
(42, 'Cá hồi Nauy đút lò sốt rượu vang trắng', 399000.00, '/api/images/foods/925e64fb-ce11-48f4-a304-ead0801ecd31.jpg', 2),
(43, 'Sò điệp Hokkaido áp chảo sốt miso caramel', 450000.00, '/api/images/foods/15a240a7-22fc-4128-ae12-8002dd76f573.jpg', 2),
(44, 'Tôm sú hấp nước dừa lá dứa', 799000.00, '/api/images/foods/6d3ea626-c546-41e6-bfb4-cce06722f712.jpg', 2),
(45, 'Mì Ý hải sản sốt cà chua cay kiểu Địa Trung Hải', 699000.00, '/api/images/foods/a72c1bcb-259b-4934-99c6-c80e2433fc52.jpg', 2),
(46, 'Cá tuyết hấp kiểu Hong Kong', 999000.00, '/api/images/foods/13f16503-f4dc-4969-ae49-4fa3f76dd690.jpg', 2),
(47, 'Tôm càng đút lò sốt kem tiêu xanh', 890000.00, '/api/images/foods/86a7cf64-368b-440d-a81e-902371a47a66.jpg', 2),
(48, 'Cua thịt xào miến Hồng Kông', 1299000.00, '/api/images/foods/27fbcbcb-cf19-417a-8b3f-a970ae16e41c.jpg', 2),
(49, 'Cá lóc nướng trui lá chuối ăn kèm muối ớt xanh', 390000.00, '/api/images/foods/274266b2-e91e-40e3-a982-57b375a35012.jpg', 3),
(50, 'Cơm sen Cung Đình Huế', 799000.00, '/api/images/foods/0df4fabf-f1c4-49c4-af0b-c63665595130.jpg', 3),
(51, 'Vịt quay sốt cam gừng sả', 699000.00, '/api/images/foods/68791cef-21c0-4dc2-8dfc-77bf6aa1c2e0.jpg', 3),
(52, 'Bò cuốn lá lốt nướng than hoa', 399000.00, '/api/images/foods/afbde1b3-ec8f-4f88-8e11-0860680ff049.jpg', 3),
(53, 'Lẩu riêu cua đồng giò heo – phong cách fusion', 599000.00, '/api/images/foods/fc7a47c7-e10c-4b90-9aa0-8e6525252208.jpg', 3),
(54, ' Canh chua cá lóc chuẩn vị Nam Bộ', 1290000.00, '/api/images/foods/c133129d-d6db-40e4-a189-3ebaeb17c19c.jpg', 3),
(55, 'Cá kho tộ', 299000.00, '/api/images/foods/8711b0cb-3324-4425-806a-73bb05a7d3c0.jpg', 3),
(56, 'Bánh xèo Miền Tây', 199000.00, '/api/images/foods/222a019b-2c6a-4d0b-b725-6cb869ba87c0.jpg', 3),
(57, 'Chả cá Lã Vọng', 599000.00, '/api/images/foods/04724bf7-980b-4fb2-9b84-107a6fbcb649.jpg', 3),
(58, 'Bò Wagyu sốt tiêu xanh', 799000.00, '/api/images/foods/a3998153-a770-43b0-86b6-81469f0954e3.png', 4),
(59, 'Sườn cừu nướng thảo mộc kiểu Địa Trung Hải', 899000.00, '/api/images/foods/d6f09328-e600-4a76-9cf0-9bea5262c521.jpg', 4),
(60, 'Thăn nội bò Mỹ nướng đá muối Himalaya', 999000.00, '/api/images/foods/192b1b7e-8ac4-456b-b268-1c882a32bd71.jpg', 4),
(61, 'Sườn bò hầm rượu vang đỏ kiểu Pháp (Bò Bourguignon)', 999000.00, '/api/images/foods/d9a25f76-fc55-4c75-a7b5-bac7d5d6a0f6.jpg', 4),
(62, 'Heo Iberico áp chảo sốt táo và tiêu hồng', 599000.00, '/api/images/foods/eec8b96f-4368-4b42-ad60-84defaf83130.jpg', 4),
(63, 'Gà Đông Tảo hấp muối hột & nấm quý', 799000.00, '/api/images/foods/63870765-d2d4-4e5c-a48e-bcde838ecc7c.jpg', 4),
(64, 'Lườn ngỗng hun khói sốt mận đỏ', 1290000.00, '/api/images/foods/6b74e1d7-39e6-4d8f-bc91-c40e70394208.jpg', 4),
(65, 'Heo nướng BBQ kiểu Nhật (Yakiniku)', 299000.00, '/api/images/foods/fa53f64d-d38e-4649-bdd6-a413e78ac71e.jpg', 3),
(66, 'Bánh flan trứng gà nướng với sốt cà phê caramel', 199000.00, '/api/images/foods/43d033fe-390f-434d-a002-ae133fb29061.jpg', 5),
(67, 'Chè khúc bạch trái cây tươi & hạnh nhân', 199000.00, '/api/images/foods/efc78a20-7efc-498e-a668-ed29a9ae2632.jpg', 5),
(68, 'Bánh mochi nhân kem matcha', 199000.00, '/api/images/foods/c3276b7d-4355-4104-9c6e-89fc3158f87b.jpg', 5),
(69, 'Tiramisu cà phê Việt Nam', 199000.00, '/api/images/foods/5b533373-f2b4-4413-9c03-5cd90672acf4.jpg', 5),
(70, 'Xôi xoài kem cốt dừa kiểu Thái', 199000.00, '/api/images/foods/bcd963d9-11dc-4f36-bf4e-8c9a5658dcee.jpg', 5),
(71, 'Kem phô mai sầu riêng nướng', 199000.00, '/api/images/foods/f65f273d-6852-4238-b41d-94c17ec716be.jpg', 5),
(72, 'Bánh lava sô-cô-la chảy phủ dâu tươi', 299000.00, '/api/images/foods/afe264c3-e64e-44bb-8db4-8730a928e678.jpg', 5),
(73, 'Yogurt Oreo', 199000.00, '/api/images/foods/a17dc450-b99f-44ad-bfdd-726696433922.webp', 5),
(74, 'Bánh cuộn trái cây tươi', 199000.00, '/api/images/foods/8f3577f2-37a3-4391-a141-c833f02c4f46.jpg', 5),
(75, 'Kem Ais Kacang', 199000.00, '/api/images/foods/e2f28df7-55a9-4fd9-8ecc-f5b2d04ee32b.jpg', 5),
(76, 'Chardonnay (Pháp, Mỹ, Úc)', 599000.00, '/api/images/foods/9485ca75-b6e9-4f89-9939-a0ab5d63907f.jpg', 6),
(77, 'Mojito truyền thống (Rum, bạc hà, soda)', 79000.00, '/api/images/foods/1e391edb-4ede-4364-8b69-c27c243d6819.jpg', 6),
(78, 'Passionfruit Tonic', 129000.00, '/api/images/foods/e6938e6d-83e0-4904-865b-ffbbace1a604.jpg', 6),
(79, 'Ginger Lemongrass Sparkle', 99000.00, '/api/images/foods/1c25094c-072f-4cc9-8b8f-4352927da43e.jpg', 6),
(80, 'Trà ô long cam thảo lạnh', 79000.00, '/api/images/foods/ea3569f4-52ec-49ab-95b2-ec9dd2f330aa.jpg', 6),
(81, 'Trà nhài mật ong', 890000.00, '/api/images/foods/374cd533-9020-4e48-838d-ef37fb4eba79.jpg', 6),
(82, 'Sinh tố xoài sữa chua Hy Lạp', 790000.00, '/api/images/foods/26e2f1c0-a0bb-480c-b0c7-20942fc74801.jpg', 6),
(83, 'Dom Pérignon Vintage Champagne', 17985000.00, '/api/images/foods/2d348a78-50c9-47f8-8557-73105b0056c9.jpg', 6),
(84, 'Château Margaux Premier Grand Cru', 19995000.00, '/api/images/foods/684e8329-e013-4657-997a-a5f6fd5be6ac.jpg', 6),
(85, 'Screaming Eagle Cabernet Sauvignon', 75995000.00, '/api/images/foods/46dce9c8-c654-49b8-8faf-8430bd8053ee.jpg', 6),
(86, 'Penfolds Grange Shiraz', 26878000.00, '/api/images/foods/94e93b89-5556-4119-899c-b89922d15425.jpg', 6),
(87, 'Trà Long Tỉnh Thượng Hạng', 595000.00, '/api/images/foods/69ed2a20-566f-4301-aa9c-3f119853c90f.jpg', 6),
(88, 'Súp bào ngư hải sâm', 1280000.00, '/api/images/foods/e3b4fc10-3dc4-459d-ac30-ee6304a3ad7f.jpg', 7),
(89, 'Súp vi cá – cua – nấm tuyết', 290000.00, '/api/images/foods/c5ad0cf7-f53b-4143-a1bb-d6064213a694.jpg', 7),
(90, 'Súp tôm hùm nấm đông trùng', 1280000.00, '/api/images/foods/e3e1ad39-ebf2-40e8-9cf0-f737965001eb.jpg', 7),
(91, 'Mushroom Cappuccino Soup', 895000.00, '/api/images/foods/27f8fd52-1043-4e33-9479-685991ae729a.jpg', 7),
(92, 'Pumpkin & Coconut Soup', 380000.00, '/api/images/foods/c0565b20-8a5a-4f9a-a8b7-dc74109230f4.jpg', 7),
(93, 'Gỏi cá mai Phan Thiết cuốn bánh tráng', 358000.00, '/api/images/foods/6870224c-837c-43ac-8738-5c0421cf7ec7.jpg', 8),
(94, 'Hàu Nhật sống tái chanh', 450000.00, '/api/images/foods/1d4197ab-b23b-4f6c-836f-3b6afcfb63a3.jpg', 8),
(95, 'Tôm sú tái chanh mật ong', 175000.00, '/api/images/foods/b831316d-b95b-443f-8107-eedff59cc298.jpg', 8),
(96, 'Sứa trộn xoài xanh', 385000.00, '/api/images/foods/25e61819-001f-4a95-9ba0-1ee1e9216a33.jpg', 8),
(97, 'Salad Yukhoe (Hàn Quốc)', 385000.00, '/api/images/foods/608aa308-f495-4745-bd36-faeb9b70f438.webp', 8),
(98, 'Tuna Tartare kiểu Nhật', 780000.00, '/api/images/foods/cf75e011-59af-48c6-b5bd-3710548d1d25.jpg', 8),
(99, 'Foie Gras lạnh áp chảo & trái cây đỏ', 1285000.00, '/api/images/foods/16535902-9825-48dd-9f53-f1c69645c51a.png', 8),
(100, 'Tuna Ceviche kiểu Peru', 899000.00, '/api/images/foods/376c1e10-59fd-49f1-ab84-77d8481d644f.jpeg', 8),
(101, 'Nộm bò Wagyu lạnh & bưởi da xanh', 3285000.00, '/api/images/foods/2ef5922c-46ea-4c5e-8311-a4d3240041a1.jpg', 8),
(102, 'Nấm đùi gà áp chảo sốt tiêu xanh', 285000.00, '/api/images/foods/55d34c7c-e812-4a3f-a084-de7a828c5190.jpg', 10),
(103, 'Cơm chiên trái thơm chay', 295000.00, '/api/images/foods/915c99db-dfc5-44b9-a277-400c761038a3.jpg', 10),
(104, 'Ravioli rau củ sốt nấm truffle', 895000.00, '/api/images/foods/29f58d19-d61e-4e1a-962e-e9a434b7eaaa.jpg', 10),
(105, 'Risotto nghệ & rau củ mùa vụ', 359000.00, '/api/images/foods/4fd5514c-885a-41e8-a6d3-832f8fe4fa72.jpg', 10),
(106, 'Thực đơn Tết Việt', 7950000.00, '/api/images/foods/49e2f171-9273-4c98-9b87-061711fb314f.jpg', 12),
(107, 'Thực đơn Lễ Tình Nhân (Valentine)', 9950000.00, '/api/images/foods/691b8b3a-74cf-4108-962e-abc31d2f00bd.jpg', 12),
(108, 'Thực đơn Đêm Giáng Sinh', 8750000.00, '/api/images/foods/80ef9987-91f8-4c25-9d98-13866799e4f2.png', 12),
(109, 'Set Bắc – Trung – Nam', 9780000.00, '/api/images/foods/6fa49459-50fc-491f-89af-c6ba6796cbc5.webp', 12),
(110, 'Set Chef’s Table', 6950000.00, '/api/images/foods/1e06d7a6-64e3-4faa-8d91-fd91faa41413.jpg', 12);

-- --------------------------------------------------------

--
-- Table structure for table `food_ingredients`
--

CREATE TABLE `food_ingredients` (
  `id` int NOT NULL,
  `food_id` int DEFAULT NULL,
  `ingredient_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `food_ingredients`
--

INSERT INTO `food_ingredients` (`id`, `food_id`, `ingredient_id`, `amount`) VALUES
(1, 1, 51, 1.00),
(2, 1, 36, 0.20),
(3, 1, 58, 2.00),
(4, 2, 86, 0.30),
(5, 2, 29, 50.00),
(6, 11, 34, 0.15),
(7, 11, 104, 20.00),
(8, 34, 31, 0.10),
(9, 34, 53, 50.00),
(10, 37, 98, 30.00),
(11, 37, 122, 1.00),
(12, 39, 34, 0.20),
(13, 39, 58, 1.00),
(14, 40, 36, 0.30),
(15, 40, 80, 2.00),
(16, 41, 35, 300.00),
(17, 41, 27, 20.00),
(18, 43, 35, 150.00),
(19, 46, 76, 0.40),
(20, 49, 110, 300.00),
(21, 49, 128, 1.00),
(22, 50, 47, 0.15),
(23, 50, 62, 20.00),
(24, 52, 33, 0.15),
(25, 52, 116, 5.00),
(26, 57, 90, 200.00),
(27, 57, 113, 1.00),
(28, 58, 31, 0.25),
(29, 58, 61, 5.00),
(30, 59, 33, 0.30),
(31, 59, 125, 20.00),
(32, 63, 32, 0.50),
(33, 63, 38, 50.00),
(34, 65, 33, 0.25),
(35, 66, 81, 2.00),
(36, 66, 101, 10.00),
(37, 70, 52, 1.00),
(38, 70, 29, 50.00),
(39, 76, 8, 0.15),
(40, 79, 13, 1.00),
(41, 79, 14, 1.00),
(42, 82, 52, 1.00),
(43, 82, 29, 100.00),
(44, 88, 35, 50.00),
(45, 88, 38, 20.00),
(46, 91, 38, 50.00),
(47, 94, 58, 2.00),
(48, 98, 30, 20.00),
(49, 14, 21, 5.00),
(50, 35, 21, 5.00),
(51, 36, 21, 5.00),
(52, 38, 21, 5.00),
(53, 42, 21, 5.00),
(54, 44, 21, 5.00),
(55, 45, 21, 5.00),
(56, 47, 21, 5.00),
(57, 48, 21, 5.00),
(58, 51, 21, 5.00),
(59, 53, 21, 5.00),
(60, 54, 21, 5.00),
(61, 55, 21, 5.00),
(62, 56, 21, 5.00),
(63, 60, 21, 5.00),
(64, 61, 21, 5.00),
(65, 62, 21, 5.00),
(66, 64, 21, 5.00),
(67, 67, 21, 5.00),
(68, 68, 21, 5.00),
(69, 69, 21, 5.00),
(70, 71, 21, 5.00),
(71, 72, 21, 5.00),
(72, 73, 21, 5.00),
(73, 74, 21, 5.00),
(74, 75, 21, 5.00),
(75, 15, 21, 5.00),
(76, 77, 21, 5.00),
(77, 78, 21, 5.00),
(78, 80, 21, 5.00),
(79, 81, 21, 5.00),
(80, 83, 21, 5.00),
(81, 84, 21, 5.00),
(82, 85, 21, 5.00),
(83, 86, 21, 5.00),
(84, 87, 21, 5.00),
(85, 89, 21, 5.00),
(86, 90, 21, 5.00),
(87, 92, 21, 5.00),
(88, 93, 21, 5.00),
(89, 95, 21, 5.00),
(90, 96, 21, 5.00),
(91, 97, 21, 5.00),
(92, 99, 21, 5.00),
(93, 100, 21, 5.00),
(94, 101, 21, 5.00),
(95, 102, 21, 5.00),
(96, 103, 21, 5.00),
(97, 104, 21, 5.00),
(98, 105, 21, 5.00),
(99, 106, 21, 5.00),
(100, 107, 21, 5.00),
(101, 108, 21, 5.00),
(102, 109, 21, 5.00),
(103, 110, 21, 5.00),
(112, 1, 20, 10.00),
(113, 2, 20, 10.00),
(114, 11, 20, 10.00),
(115, 14, 20, 10.00),
(116, 34, 20, 10.00),
(117, 35, 20, 10.00),
(118, 36, 20, 10.00),
(119, 37, 20, 10.00),
(120, 38, 20, 10.00),
(121, 39, 20, 10.00),
(122, 40, 20, 10.00),
(123, 41, 20, 10.00),
(124, 42, 20, 10.00),
(125, 43, 20, 10.00),
(126, 44, 20, 10.00),
(127, 45, 20, 10.00),
(128, 46, 20, 10.00),
(129, 47, 20, 10.00),
(130, 48, 20, 10.00),
(131, 49, 20, 10.00),
(132, 50, 20, 10.00),
(133, 51, 20, 10.00),
(134, 52, 20, 10.00),
(135, 53, 20, 10.00),
(136, 54, 20, 10.00),
(137, 55, 20, 10.00),
(138, 56, 20, 10.00),
(139, 57, 20, 10.00),
(140, 65, 20, 10.00),
(141, 58, 20, 10.00),
(142, 59, 20, 10.00),
(143, 60, 20, 10.00),
(144, 61, 20, 10.00),
(145, 62, 20, 10.00),
(146, 63, 20, 10.00),
(147, 64, 20, 10.00),
(148, 66, 20, 10.00),
(149, 67, 20, 10.00),
(150, 68, 20, 10.00),
(151, 69, 20, 10.00),
(152, 70, 20, 10.00),
(153, 71, 20, 10.00),
(154, 72, 20, 10.00),
(155, 73, 20, 10.00),
(156, 74, 20, 10.00),
(157, 75, 20, 10.00),
(158, 15, 20, 10.00),
(159, 76, 20, 10.00),
(160, 77, 20, 10.00),
(161, 78, 20, 10.00),
(162, 79, 20, 10.00),
(163, 80, 20, 10.00),
(164, 81, 20, 10.00),
(165, 82, 20, 10.00),
(166, 83, 20, 10.00),
(167, 84, 20, 10.00),
(168, 85, 20, 10.00),
(169, 86, 20, 10.00),
(170, 87, 20, 10.00),
(171, 88, 20, 10.00),
(172, 89, 20, 10.00),
(173, 90, 20, 10.00),
(174, 91, 20, 10.00),
(175, 92, 20, 10.00),
(176, 93, 20, 10.00),
(177, 94, 20, 10.00),
(178, 95, 20, 10.00),
(179, 96, 20, 10.00),
(180, 97, 20, 10.00),
(181, 98, 20, 10.00),
(182, 99, 20, 10.00),
(183, 100, 20, 10.00),
(184, 101, 20, 10.00),
(185, 102, 20, 10.00),
(186, 103, 20, 10.00),
(187, 104, 20, 10.00),
(188, 105, 20, 10.00),
(189, 106, 20, 10.00),
(190, 107, 20, 10.00),
(191, 108, 20, 10.00),
(192, 109, 20, 10.00),
(193, 110, 20, 10.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buffet_packages`
--
ALTER TABLE `buffet_packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `foods`
--
ALTER TABLE `foods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `food_ingredients`
--
ALTER TABLE `food_ingredients`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `buffet_packages`
--
ALTER TABLE `buffet_packages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `foods`
--
ALTER TABLE `foods`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT for table `food_ingredients`
--
ALTER TABLE `food_ingredients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=239;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `foods`
--
ALTER TABLE `foods`
  ADD CONSTRAINT `foods_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);
--
-- Database: `orderdb`
--
CREATE DATABASE IF NOT EXISTS `orderdb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `orderdb`;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int NOT NULL,
  `table_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `order_time` datetime DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total` decimal(18,2) DEFAULT NULL,
  `table_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_buffet` tinyint(1) DEFAULT NULL,
  `buffet_session_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buffet_package_id` int DEFAULT NULL,
  `buffet_package_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `table_id`, `user_id`, `order_time`, `status`, `total`, `table_key`, `is_buffet`, `buffet_session_id`, `buffet_package_id`, `buffet_package_name`, `payment_status`, `updated_at`) VALUES
(1, 1, NULL, '2025-04-13 23:31:46', 'Đã thanh toán', 50000.00, NULL, 0, NULL, NULL, NULL, 'paid', NULL),
(2, 1, NULL, '2025-04-14 22:22:57', 'Đã thanh toán', 250000.00, NULL, 0, NULL, NULL, NULL, 'paid', NULL),
(3, 2, NULL, '2025-04-15 09:54:32', 'Đã thanh toán', 370000.00, NULL, 0, NULL, NULL, NULL, 'paid', NULL),
(4, 1, NULL, '2025-05-24 23:36:51', 'Đã thanh toán', 1000.00, NULL, 0, NULL, NULL, NULL, 'paid', NULL),
(5, 1, 11, '2025-05-25 01:25:25', 'Đã thanh toán', 500.00, NULL, 0, NULL, NULL, NULL, 'paid', NULL),
(6, 1, 11, '2025-05-25 01:28:20', 'Đã thanh toán', 250.00, NULL, 0, NULL, NULL, NULL, 'paid', NULL),
(7, 1, NULL, '2025-05-26 15:53:48', 'Đã thanh toán', 1000.00, NULL, 0, NULL, NULL, NULL, 'paid', NULL),
(8, 2, NULL, '2025-05-26 16:23:11', 'Đã thanh toán', 1000.00, NULL, 0, NULL, NULL, NULL, 'paid', NULL),
(9, 1, NULL, '2025-05-26 18:45:24', 'Đã thanh toán', 299000.00, NULL, 0, NULL, NULL, NULL, 'paid', NULL),
(10, 1, NULL, '2025-05-26 21:20:40', 'Đã thanh toán', 1000.00, 'b63deb96-f17d-4f50-9aab-5ad793212b6a', 0, NULL, NULL, NULL, 'paid', NULL),
(11, 1, NULL, '2025-05-26 21:34:17', 'Đã thanh toán', 299000.00, '6089bf51-d4f5-4d5c-a0f9-c8137e80c373', 0, NULL, NULL, NULL, 'paid', NULL),
(12, 1, NULL, '2025-05-26 21:40:18', 'Đã thanh toán', 299000.00, '6835ae97-686c-4b36-9260-a5a1e99b14e9', 0, NULL, NULL, NULL, 'paid', NULL),
(13, 18, NULL, '2025-05-26 22:28:12', 'Đã thanh toán', 299000.00, '37277467-105a-4359-a94c-23c9993e12f2', 0, NULL, NULL, NULL, 'paid', NULL),
(14, 1, NULL, '2025-05-28 01:03:57', 'Đã thanh toán', 299000.00, '441b30e0-b7ff-4737-a239-d2141ab56a4b', 0, 'buffet_1_1748369037816', NULL, NULL, 'paid', NULL),
(15, 1, NULL, '2025-05-28 01:08:34', 'Đã thanh toán', 299000.00, '63ac7fa0-258d-4580-af6b-93cf13dd235d', 0, 'buffet_1_1748369314085', NULL, NULL, 'paid', NULL),
(16, 1, NULL, '2025-05-28 01:16:55', 'Đã thanh toán', 299000.00, '7f0ecffa-6547-4484-b1b5-5c2567fbaab8', 0, 'buffet_1_1748369815077', NULL, NULL, 'paid', NULL),
(17, 1, NULL, '2025-05-28 01:17:05', 'Đã thanh toán', 299000.00, '7f0ecffa-6547-4484-b1b5-5c2567fbaab8', 0, 'buffet_1_1748369825654', NULL, NULL, 'paid', NULL),
(18, 2, NULL, '2025-05-28 01:20:31', 'Đã thanh toán', 299000.00, '003f4984-2811-44a2-b3ea-76bd07a43134', 0, 'buffet_2_1748370031477', NULL, NULL, 'paid', NULL),
(19, 2, NULL, '2025-05-28 01:20:34', 'Đã thanh toán', 299000.00, '003f4984-2811-44a2-b3ea-76bd07a43134', 0, 'buffet_2_1748370034374', NULL, NULL, 'paid', NULL),
(20, 2, NULL, '2025-05-28 01:22:22', 'Đã thanh toán', 299000.00, '003f4984-2811-44a2-b3ea-76bd07a43134', 0, 'buffet_2_1748370142442', NULL, NULL, 'paid', NULL),
(21, 1, NULL, '2025-05-28 01:47:46', 'Đã thanh toán', 299000.00, '8f4fffb1-82fb-447f-9e25-8cdcde774f43', 0, 'buffet_1_1748371666480', NULL, NULL, 'paid', NULL),
(22, 1, NULL, '2025-05-28 03:55:29', 'Đã thanh toán', 299000.00, '89019ab2-6351-4be2-b4b8-9bc0250e2224', 0, 'buffet_1_1748379329945', NULL, NULL, 'paid', NULL),
(23, 2, NULL, '2025-05-28 03:56:15', 'Đã thanh toán', 299000.00, '2146431c-649e-41b8-9ca1-239a7dc8215d', 0, 'buffet_2_1748379375464', NULL, NULL, 'paid', NULL),
(24, 1, NULL, '2025-05-28 04:03:18', 'Đã thanh toán', 299000.00, 'f39452f0-b00b-4f54-9326-916683874437', 0, 'buffet_1_1748379798257', NULL, NULL, 'paid', NULL),
(25, 2, NULL, '2025-05-28 04:13:44', 'Đã thanh toán', 299000.00, 'd1b719d5-fd08-4188-b524-7d897d7564b7', 0, 'buffet_2_1748380424066', NULL, NULL, 'paid', NULL),
(26, 2, NULL, '2025-05-28 04:14:35', 'Đã thanh toán', 299000.00, 'a902fb3d-94e0-4061-b4f5-9de9f9f152fd', 0, 'buffet_2_1748380474995', NULL, NULL, 'paid', NULL),
(27, 1, NULL, '2025-05-28 04:20:58', 'Đã thanh toán', 299000.00, '7abaeba4-770b-4010-b6a3-0ac1bbbff5b1', 0, 'buffet_1_1748380858539', NULL, NULL, 'paid', NULL),
(28, 3, NULL, '2025-05-28 04:24:00', 'Đã thanh toán', 299000.00, '76dc5dc3-4f17-4ca8-ba2b-432fc7ae5eb4', 0, 'buffet_3_1748381040028', NULL, NULL, 'paid', NULL),
(29, 1, NULL, '2025-05-28 04:29:17', 'Đã thanh toán', 39000.00, '4a761397-99d3-4316-acd4-dbf92e8d2d58', 0, NULL, NULL, NULL, 'paid', NULL),
(30, 1, NULL, '2025-05-28 04:34:08', 'Đã thanh toán', 39000.00, '62c13714-bf47-4820-bb36-8d2dbb0f7096', 0, NULL, NULL, NULL, 'paid', NULL),
(31, 1, NULL, '2025-05-28 04:39:52', 'Đã thanh toán', 40000.00, 'd5f0c027-74e2-440c-9d45-4101516965ec', 0, NULL, NULL, NULL, 'paid', NULL),
(32, 1, NULL, '2025-05-28 05:08:21', 'Đã thanh toán', 29000.00, '06edf467-15b3-4b56-9bfc-754fcc99a4a0', 0, NULL, NULL, NULL, 'paid', NULL),
(33, 1, NULL, '2025-05-28 05:15:02', 'Đã thanh toán', 29000.00, 'f4b24832-3277-42ae-87fa-fdce29282fda', 0, NULL, NULL, NULL, 'paid', NULL),
(34, 1, NULL, '2025-05-28 05:38:18', 'Đã thanh toán', 299000.00, '9df268bb-fb89-405d-a683-d636e67813e9', 0, 'buffet_1_1748385498201', NULL, NULL, 'paid', NULL),
(35, 1, NULL, '2025-05-28 05:39:03', 'Đã thanh toán', 299000.00, '9df268bb-fb89-405d-a683-d636e67813e9', 0, 'buffet_1_1748385543927', NULL, NULL, 'paid', NULL),
(36, 1, NULL, '2025-05-28 05:44:22', 'Đã thanh toán', 299000.00, 'edbc33ac-d01f-4226-bdc9-c5c97fecc24b', 1, 'buffet_1_1748385862719', NULL, NULL, 'unpaid', NULL),
(37, 2, NULL, '2025-05-28 05:49:55', 'Đã thanh toán', 299000.00, 'ee186e62-4528-43be-8cd0-a828d76f1061', 1, 'buffet_2_1748386195953', NULL, NULL, 'unpaid', NULL),
(38, 2, NULL, '2025-05-28 13:47:53', 'Đã thanh toán', 299000.00, 'ab8b0ded-80fe-4950-a936-b372828db946', 1, 'buffet_2_1748414873287', NULL, NULL, 'unpaid', NULL),
(39, 2, NULL, '2025-06-02 19:40:47', 'Đã thanh toán', 1495000.00, '569418c0-9d86-40ba-a5d5-1ac340a60898', 0, NULL, NULL, NULL, 'unpaid', NULL),
(40, 1, NULL, '2025-06-02 20:39:53', 'Đã thanh toán', 1393000.00, '8bc05879-3333-46b0-9567-4dd81ca58996', 0, NULL, NULL, NULL, 'unpaid', NULL),
(41, 18, NULL, '2025-06-02 20:41:15', 'Đã thanh toán', 299000.00, '3a246565-7656-4a9d-ae85-806ff5d5824a', 1, 'buffet_18_1748871674847', NULL, NULL, 'unpaid', NULL),
(42, 9, NULL, '2025-06-02 20:41:38', 'Đã thanh toán', 29945000.00, '5f2e3ac4-7034-43ea-8681-7d55d45d4fa1', 0, NULL, NULL, NULL, 'unpaid', NULL),
(43, 1, NULL, '2025-06-03 11:07:27', 'Đã thanh toán', 297000.00, '78166951-4d74-4d20-90bc-0d20462c5ec1', 0, NULL, NULL, NULL, 'unpaid', NULL),
(44, 4, NULL, '2025-06-05 00:13:07', 'Đã thanh toán', 249000.00, '65c4f0f2-fdb7-44d0-ad9b-1a6153e1b32b', 1, 'buffet_4_1749057187496', 4, 'Buffet Chay', 'unpaid', NULL),
(45, 5, NULL, '2025-06-05 00:14:00', 'Đã thanh toán', 299000.00, '843e8119-79ef-4fb7-9c11-151ada211935', 1, 'buffet_5_1749057240225', 1, 'Buffet Cơ Bản', 'unpaid', NULL),
(46, 6, NULL, '2025-06-05 00:14:57', 'Đã thanh toán', 899000.00, 'be15c663-d074-4f6e-bd89-e45bd75b208c', 1, 'buffet_6_1749057297643', 8, 'Buffet Tối VIP', 'unpaid', NULL),
(47, 4, NULL, '2025-06-05 00:34:15', 'Đã thanh toán', 199000.00, '819e326f-c69e-432c-93a1-f437ba95cab4', 1, 'buffet_4_1749058455012', 3, 'Buffet Gia Đình', 'unpaid', NULL),
(48, 18, NULL, '2025-06-05 00:35:05', 'Đã thanh toán', 98000.00, '9fda2081-d1ad-482b-9586-c43746f95a4e', 0, NULL, NULL, NULL, 'unpaid', NULL),
(49, 18, NULL, '2025-06-05 00:35:13', 'Đã thanh toán', 699000.00, '9fda2081-d1ad-482b-9586-c43746f95a4e', 1, 'buffet_18_1749058513489', 5, 'Buffet Hải Sản', 'unpaid', NULL),
(50, 19, NULL, '2025-06-05 00:35:45', 'Đã thanh toán', 299000.00, '71fd685e-5ff6-45d9-86ba-ce15ece3b44f', 1, 'buffet_19_1749058545634', 1, 'Buffet Cơ Bản', 'unpaid', NULL),
(51, 6, NULL, '2025-06-05 01:09:17', 'Đã thanh toán', 199000.00, '7761b015-e216-44fc-93bf-d115d193498b', 1, 'buffet_6_1749060556817', 3, 'Buffet Gia Đình', 'unpaid', NULL),
(52, 1, NULL, '2025-06-05 14:21:00', 'Đã thanh toán', 899000.00, '2e51906b-676e-4eb0-80b8-106dbd5613d7', 1, 'buffet_1_1749108060946', 8, 'Buffet Tối VIP', 'unpaid', NULL),
(53, 1, NULL, '2025-06-05 14:47:51', 'Đã thanh toán', 199000.00, '826ce96c-642f-4eed-a1b6-0c4570968bc2', 0, NULL, NULL, NULL, 'unpaid', NULL),
(54, 1, NULL, '2025-06-05 15:43:13', 'Đã thanh toán', 199000.00, '4b03b446-f855-4d1e-a454-0436fbf59c7c', 0, NULL, NULL, NULL, 'unpaid', NULL),
(55, 2, NULL, '2025-06-05 15:51:20', 'Đã thanh toán', 199000.00, '39df77f6-34cb-4e36-853b-166cd664487b', 0, NULL, NULL, NULL, 'unpaid', NULL),
(56, 2, NULL, '2025-06-05 15:51:20', 'Đã thanh toán', 199000.00, '39df77f6-34cb-4e36-853b-166cd664487b', 0, NULL, NULL, NULL, 'unpaid', NULL),
(57, 1, NULL, '2025-06-05 22:16:56', 'Đã thanh toán', 1000.00, '4718e303-af71-4ba5-b439-04aad6cbe6be', 0, NULL, NULL, NULL, 'unpaid', NULL),
(58, 2, NULL, '2025-06-20 09:02:45', 'Đã thanh toán', 1400000.00, '2ecce84a-e24b-4128-9380-f0367b279f0c', 0, NULL, NULL, NULL, 'unpaid', NULL),
(59, 2, NULL, '2025-06-26 21:10:10', 'Đã thanh toán', 9000.00, 'bc889d9a-0de4-446e-8ff0-0335e13f71eb', 0, NULL, NULL, NULL, 'unpaid', NULL),
(60, 1, NULL, '2025-07-30 00:35:06', 'Đã thanh toán', 1000.00, '3f6b27de-79d1-4f91-bbcb-a77f070b2274', 0, NULL, NULL, NULL, 'unpaid', NULL),
(61, 1, NULL, '2025-12-08 20:18:38', 'Đã thanh toán', 199000.00, '35d21982-3415-447e-8c13-5a72e30811f9', 0, NULL, NULL, NULL, NULL, '2025-12-08 20:26:21'),
(62, 1, NULL, '2025-12-09 22:03:12', 'Đã thanh toán', 1300000.00, '56b1f280-dc54-456b-99d3-3e316a2f2471', 0, NULL, NULL, NULL, 'paid', '2025-12-09 15:21:03'),
(63, 1, NULL, '2025-12-09 22:12:20', 'Đã thanh toán', 1650000.00, '56b1f280-dc54-456b-99d3-3e316a2f2471', 0, NULL, NULL, NULL, 'paid', '2025-12-09 15:21:08'),
(64, 1, NULL, '2025-12-09 22:17:58', 'Đã thanh toán', 199000.00, 'f43b8923-4991-413d-9cf9-33a692a03630', 0, NULL, NULL, NULL, 'paid', '2025-12-09 15:21:17'),
(65, 1, NULL, '2025-12-09 22:24:13', 'Đã thanh toán', 350000.00, '3691d109-07fa-46b6-b797-765c8ddb7a73', 0, NULL, NULL, NULL, 'paid', '2025-12-09 15:47:18'),
(66, 2, NULL, '2025-12-09 23:01:17', 'Đã thanh toán', 350000.00, 'ce058eeb-ccea-4b5b-9da7-da2dedb369d9', 0, NULL, NULL, NULL, 'paid', '2025-12-09 16:04:20'),
(67, 1, NULL, '2025-12-09 23:55:22', 'Yêu cầu thanh toán', 1499000.00, '15daa991-ea36-49cf-8da7-daa27e4ad277', 0, NULL, NULL, NULL, 'waiting', '2025-12-09 16:55:31'),
(68, 2, NULL, '2025-12-10 00:18:00', 'Yêu cầu thanh toán', 350000.00, '0ffb2b8a-f533-4b02-a0d2-65978e225e7d', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 00:19:22'),
(69, 1, NULL, '2025-12-10 00:51:27', 'Đang chế biến', 3900000.00, '713c6eb5-cee8-4178-ac0f-f909bf2d6245', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 00:51:54'),
(70, 3, NULL, '2025-12-10 01:03:54', 'Đang chế biến', 199000.00, 'bf597f86-2e5a-4f8f-abc6-3161835a9a84', 0, NULL, NULL, NULL, 'unpaid', '2025-12-10 01:04:39'),
(71, 1, NULL, '2025-12-10 01:05:34', 'Đã thanh toán', 199000.00, 'bb946f76-1359-4382-8879-5c40f15d2cd4', 0, NULL, NULL, NULL, 'paid', '2025-12-10 01:25:29'),
(72, 1, NULL, '2025-12-10 01:31:45', 'Đã thanh toán', 299000.00, 'cab0173f-010a-4926-a1e2-2496e29e36c2', 1, 'buffet_1_1765305104901', 1, 'Buffet Cơ Bản', 'paid', '2025-12-10 01:31:53'),
(73, 1, NULL, '2025-12-10 01:53:37', 'Đang chế biến', 199000.00, 'bd73eef5-09c1-49a5-beeb-e9e1d4cd2017', 0, NULL, NULL, NULL, 'unpaid', '2025-12-10 01:53:45'),
(74, 1, NULL, '2025-12-10 01:56:19', 'Đang chế biến', 350000.00, 'bd73eef5-09c1-49a5-beeb-e9e1d4cd2017', 0, NULL, NULL, NULL, 'unpaid', '2025-12-10 01:56:26'),
(75, 1, NULL, '2025-12-10 01:59:17', 'Đã thanh toán', 350000.00, 'bd73eef5-09c1-49a5-beeb-e9e1d4cd2017', 0, NULL, NULL, NULL, 'paid', '2025-12-10 02:05:27'),
(76, 1, NULL, '2025-12-10 02:32:31', 'Đã thanh toán', 1300000.00, 'e3ae8107-f0ae-47ea-9ab7-8bce81241712', 0, NULL, NULL, NULL, 'paid', '2025-12-10 02:32:41'),
(77, 1, NULL, '2025-12-10 02:37:19', 'Đã thanh toán', 350000.00, '6faae243-0805-4c41-bf20-7fecadce8ee3', 0, NULL, NULL, NULL, 'paid', '2025-12-10 02:37:29'),
(78, 1, NULL, '2025-12-10 02:58:13', 'Đã thanh toán', 199000.00, 'db025ce0-9d43-44a6-8ba5-a4060d7182a9', 0, NULL, NULL, NULL, 'paid', '2025-12-10 02:58:23'),
(79, 1, NULL, '2025-12-10 03:10:04', 'Đã thanh toán', 1300000.00, '2ae2a8ab-8d42-4747-989a-2373766f217a', 0, NULL, NULL, NULL, 'paid', '2025-12-10 03:10:16'),
(80, 1, NULL, '2025-12-10 03:18:53', 'Đã thanh toán', 350000.00, '84d59b7a-749a-4591-9218-c548eb65b71d', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 03:38:06'),
(81, 1, NULL, '2025-12-10 03:24:41', 'Hoàn thành', 350000.00, '84d59b7a-749a-4591-9218-c548eb65b71d', 0, NULL, NULL, NULL, 'unpaid', '2025-12-10 03:26:09'),
(82, 1, NULL, '2025-12-10 03:26:51', 'Hoàn thành', 350000.00, '84d59b7a-749a-4591-9218-c548eb65b71d', 0, NULL, NULL, NULL, 'unpaid', '2025-12-10 03:27:20'),
(83, 1, NULL, '2025-12-10 03:35:25', 'Hoàn thành', 1300000.00, '84d59b7a-749a-4591-9218-c548eb65b71d', 0, NULL, NULL, NULL, 'unpaid', '2025-12-10 03:36:21'),
(84, 1, NULL, '2025-12-10 03:35:39', 'Hoàn thành', 199000.00, '84d59b7a-749a-4591-9218-c548eb65b71d', 0, NULL, NULL, NULL, 'unpaid', '2025-12-10 03:36:18'),
(85, 1, NULL, '2025-12-10 03:38:44', 'Đã thanh toán', 350000.00, '48edfc02-9cdb-4edb-bc60-e3ed72b38dfa', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 03:40:45'),
(86, 1, NULL, '2025-12-10 03:38:48', 'Hoàn thành', 98000.00, '48edfc02-9cdb-4edb-bc60-e3ed72b38dfa', 0, NULL, NULL, NULL, 'unpaid', '2025-12-10 03:39:15'),
(87, 1, NULL, '2025-12-10 03:50:24', 'Đã thanh toán', 1300000.00, 'e0f620e9-5998-40fd-a2af-a339333461ac', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 03:51:09'),
(88, 1, NULL, '2025-12-10 03:50:30', 'Đã thanh toán', 98000.00, 'e0f620e9-5998-40fd-a2af-a339333461ac', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 03:51:09'),
(89, 1, NULL, '2025-12-10 03:55:08', 'Đã thanh toán', 199000.00, '7615a2b6-b228-4903-b0c5-2165e70d28e5', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 03:57:19'),
(90, 1, NULL, '2025-12-10 03:55:24', 'Đã thanh toán', 398000.00, '7615a2b6-b228-4903-b0c5-2165e70d28e5', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 03:57:19'),
(91, 1, NULL, '2025-12-10 04:02:11', 'Đã thanh toán', 306000.00, '72f0c3e5-cb4f-4ee4-acd7-754e8415dcb7', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 04:04:54'),
(92, 1, NULL, '2025-12-10 04:02:21', 'Đã thanh toán', 1290000.00, '72f0c3e5-cb4f-4ee4-acd7-754e8415dcb7', 0, NULL, NULL, NULL, 'waiting', '2025-12-10 04:04:54'),
(93, 1, NULL, '2025-12-11 23:48:47', 'Đã thanh toán', 350000.00, '4a1dc70b-6624-401c-8849-df79b96112d3', 0, NULL, NULL, NULL, 'paid', '2025-12-13 08:58:57'),
(94, 1, NULL, '2025-12-13 09:19:26', 'Đã thanh toán', 1300000.00, '2f754cd6-8fcb-4942-a13b-54d652b01f34', 0, NULL, NULL, NULL, 'paid', '2025-12-13 09:24:25'),
(95, 1, NULL, '2025-12-13 10:06:45', 'Đã thanh toán', 1300000.00, 'cf6f181a-a437-45f2-a7ed-20937f11d062', 0, NULL, NULL, NULL, 'paid', '2025-12-13 10:08:44'),
(96, 2, NULL, '2025-12-13 10:14:48', 'Hoàn thành', 350000.00, 'f74bf5e1-bbfe-4688-890c-ff433b77dd7f', 0, NULL, NULL, NULL, 'unpaid', '2025-12-13 11:17:44'),
(97, 3, NULL, '2025-12-13 10:45:51', 'Đã thanh toán', 350000.00, '71db81be-99c1-4d5c-bf47-619dde71107b', 0, NULL, NULL, NULL, 'paid', '2025-12-13 10:46:20'),
(98, 1, NULL, '2025-12-13 11:13:39', 'Hoàn thành', 199000.00, '1a8dc320-ccfb-4b9f-9a03-a8e934721bd7', 0, NULL, NULL, NULL, 'unpaid', '2025-12-13 11:17:43'),
(99, 1, NULL, '2025-12-13 11:23:46', 'Đã thanh toán', 350000.00, 'b19bea9f-0cef-4b75-8d90-5485be1196ae', 0, NULL, NULL, NULL, 'paid', '2025-12-13 11:24:10'),
(100, 1, NULL, '2025-12-13 23:20:04', 'Đã thanh toán', 350000.00, 'f860137a-1ccd-497e-bf4a-692a95c69f3b', 0, NULL, NULL, NULL, 'paid', '2025-12-13 23:22:40'),
(101, 1, NULL, '2025-12-13 23:20:10', 'Đã thanh toán', 270000.00, 'f860137a-1ccd-497e-bf4a-692a95c69f3b', 0, NULL, NULL, NULL, 'paid', '2025-12-13 23:22:40'),
(102, 1, NULL, '2025-12-13 23:30:04', 'Đã thanh toán', 1300000.00, '64d28823-35df-4519-9210-fff3f6fc14c9', 0, NULL, NULL, NULL, 'paid', '2025-12-14 00:01:20'),
(103, 1, NULL, '2025-12-13 23:30:10', 'Đã thanh toán', 98000.00, '64d28823-35df-4519-9210-fff3f6fc14c9', 0, NULL, NULL, NULL, 'paid', '2025-12-14 00:01:20'),
(104, 1, NULL, '2025-12-14 00:07:35', 'Đã thanh toán', 350000.00, '4749571c-9fa4-429d-b142-0ec81ca4928c', 0, NULL, NULL, NULL, 'paid', '2025-12-14 00:08:23'),
(105, 1, NULL, '2025-12-14 00:07:39', 'Đã thanh toán', 98000.00, '4749571c-9fa4-429d-b142-0ec81ca4928c', 0, NULL, NULL, NULL, 'paid', '2025-12-14 00:08:23'),
(106, 1, NULL, '2025-12-14 00:13:37', 'Đã thanh toán', 350000.00, '8e8e387e-b82c-4a38-b26d-c43bba51d23d', 0, NULL, NULL, NULL, 'paid', '2025-12-14 00:15:09'),
(107, 1, NULL, '2025-12-14 00:13:45', 'Đã thanh toán', 1589000.00, '8e8e387e-b82c-4a38-b26d-c43bba51d23d', 0, NULL, NULL, NULL, 'paid', '2025-12-14 00:15:09'),
(108, 1, NULL, '2025-12-14 00:13:52', 'Đã thanh toán', 350000.00, '8e8e387e-b82c-4a38-b26d-c43bba51d23d', 0, NULL, NULL, NULL, 'paid', '2025-12-14 00:15:09'),
(109, 1, NULL, '2025-12-14 00:39:45', 'Đã thanh toán', 350000.00, '2caa440e-bbf8-4060-9081-14e5c90a74f0', 0, NULL, NULL, NULL, 'paid', '2025-12-14 00:43:34'),
(110, 1, NULL, '2025-12-14 00:57:51', 'Hoàn thành', 350000.00, 'f713d52d-dacb-4ba9-bc65-fb1d4000f9d7', 0, NULL, NULL, NULL, 'unpaid', '2025-12-14 00:59:35'),
(111, 1, NULL, '2025-12-14 07:21:51', 'Đã thanh toán', 5673000.00, '6100f8a9-c956-46fc-baa0-f835ed1c1c78', 0, NULL, NULL, NULL, 'paid', '2025-12-14 07:23:07'),
(112, 1, NULL, '2026-03-25 21:40:36', 'Chờ xác nhận', 199000.00, '9bc82aa2-46f9-4516-b243-6ffe7c907823', 0, NULL, NULL, NULL, 'unpaid', '2026-03-25 22:37:37'),
(113, 2, NULL, '2026-03-31 22:46:39', 'Hoàn thành', 2148000.00, '2841ee0f-d2f3-43a8-bfeb-faadd787a805', 0, NULL, NULL, NULL, 'unpaid', '2026-03-31 22:47:42'),
(114, 1, NULL, '2026-04-01 23:13:21', 'Hoàn thành', 199000.00, '138917ef-c3ca-49d6-a340-4a061c4819fc', 0, NULL, NULL, NULL, 'unpaid', '2026-04-01 23:13:53'),
(115, 1, NULL, '2026-04-01 23:14:53', 'Hoàn thành', 199000.00, '138917ef-c3ca-49d6-a340-4a061c4819fc', 0, NULL, NULL, NULL, 'unpaid', '2026-04-01 23:15:11'),
(116, 1, NULL, '2026-04-02 00:06:43', 'Hoàn thành', 199000.00, '0610f7f6-912c-4f54-a4b2-7057959e78a8', 0, NULL, NULL, NULL, 'paid', '2026-04-02 00:07:06');

-- --------------------------------------------------------

--
-- Table structure for table `order_details`
--

CREATE TABLE `order_details` (
  `id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `food_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `custom_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_free_drink` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_details`
--

INSERT INTO `order_details` (`id`, `order_id`, `food_id`, `quantity`, `price`, `custom_name`, `is_free_drink`) VALUES
(1, 1, 1, 1, 50000.00, NULL, 0),
(2, 2, 1, 5, 50000.00, NULL, 0),
(3, 3, 1, 5, 50000.00, NULL, 0),
(4, 3, 2, 3, 40000.00, NULL, 0),
(5, 4, 14, 1, 1000.00, NULL, 0),
(6, 7, 11, 1, 1000.00, NULL, 0),
(7, 8, 14, 1, 1000.00, NULL, 0),
(8, 9, 1, 1, 50000.00, NULL, 0),
(9, 13, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(10, 14, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(11, 15, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(12, 16, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(13, 17, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(14, 17, 34, 1, 0.00, NULL, 1),
(15, 18, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(16, 18, 34, 1, 0.00, NULL, 1),
(17, 19, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(18, 19, 34, 1, 0.00, NULL, 1),
(19, 20, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(20, 20, 34, 1, 0.00, NULL, 1),
(21, 21, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(22, 21, 34, 1, 0.00, NULL, 1),
(23, 22, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(24, 22, 34, 1, 0.00, NULL, 1),
(25, 23, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(26, 23, 34, 1, 0.00, NULL, 1),
(27, 24, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(28, 24, 34, 1, 0.00, NULL, 1),
(29, 25, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(30, 25, 34, 1, 0.00, NULL, 1),
(31, 26, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(32, 26, 34, 1, 0.00, NULL, 1),
(33, 27, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(34, 27, 34, 1, 0.00, NULL, 1),
(35, 28, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(36, 28, 34, 1, 0.00, NULL, 1),
(37, 29, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(38, 29, 34, 1, 0.00, NULL, 1),
(39, 30, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(40, 30, 34, 1, 0.00, NULL, 1),
(41, 31, 34, 1, 39000.00, NULL, 0),
(42, 32, 34, 1, 39000.00, NULL, 0),
(43, 33, 2, 1, 40000.00, NULL, 0),
(44, 34, 15, 1, 29000.00, NULL, 0),
(45, 35, 15, 1, 29000.00, NULL, 0),
(46, 36, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(47, 36, 34, 1, 0.00, NULL, 1),
(48, 37, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(49, 37, 34, 1, 0.00, NULL, 1),
(50, 38, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(51, 38, 34, 1, 0.00, NULL, 1),
(52, 39, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(53, 39, 34, 1, 0.00, NULL, 1),
(54, 39, 11, 1, 0.00, NULL, 0),
(55, 39, 1, 1, 0.00, NULL, 0),
(56, 40, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(57, 40, 34, 1, 0.00, NULL, 1),
(58, 41, 38, 1, 199000.00, NULL, 0),
(59, 41, 36, 1, 98000.00, NULL, 0),
(60, 41, 37, 1, 299000.00, NULL, 0),
(61, 41, 59, 1, 899000.00, NULL, 0),
(62, 42, 1, 7, 199000.00, NULL, 0),
(63, 43, NULL, 1, 299000.00, 'Buffet - Ăn thoải mái tất cả món ăn', 0),
(64, 43, 45, 1, 0.00, NULL, 1),
(65, 44, 84, 1, 19995000.00, NULL, 0),
(66, 44, 107, 1, 9950000.00, NULL, 0),
(67, 45, 38, 1, 199000.00, NULL, 0),
(68, 45, 36, 1, 98000.00, NULL, 0),
(69, 46, NULL, 1, 249000.00, 'Buffet Chay - Buffet', 0),
(70, 46, 46, 1, 0.00, NULL, 1),
(71, 47, NULL, 1, 299000.00, 'Buffet Cơ Bản - Buffet', 0),
(72, 47, 43, 1, 0.00, NULL, 1),
(73, 48, NULL, 1, 899000.00, 'Buffet Tối VIP - Buffet', 0),
(74, 48, 43, 1, 0.00, NULL, 1),
(75, 49, NULL, 1, 199000.00, 'Buffet Gia Đình - Buffet', 0),
(76, 50, 36, 1, 98000.00, NULL, 0),
(77, 51, NULL, 1, 699000.00, 'Buffet Hải Sản - Buffet', 0),
(78, 51, 38, 1, 0.00, NULL, 0),
(79, 52, NULL, 1, 299000.00, 'Buffet Cơ Bản - Buffet', 0),
(80, 52, 34, 1, 0.00, NULL, 0),
(81, 53, NULL, 1, 199000.00, 'Buffet Gia Đình - Buffet', 0),
(82, 54, NULL, 1, 899000.00, 'Buffet Tối VIP - Buffet', 0),
(83, 55, 1, 1, 199000.00, NULL, 0),
(84, 56, 1, 1, 199000.00, NULL, 0),
(85, 57, 1, 1, 199000.00, NULL, 0),
(86, 58, 1, 1, 199000.00, NULL, 0),
(88, 60, 11, 4, 350000.00, NULL, 0),
(91, 61, 1, 1, 199000.00, NULL, NULL),
(92, 62, 14, 1, 1300000.00, NULL, NULL),
(93, 63, 14, 1, 1300000.00, NULL, NULL),
(94, 63, 11, 1, 350000.00, NULL, NULL),
(95, 64, 1, 1, 199000.00, NULL, NULL),
(96, 65, 11, 1, 350000.00, NULL, NULL),
(97, 66, 11, 1, 350000.00, NULL, NULL),
(98, 67, 1, 1, 199000.00, NULL, NULL),
(99, 67, 14, 1, 1300000.00, NULL, NULL),
(100, 68, 11, 1, 350000.00, NULL, NULL),
(101, 69, 14, 3, 1300000.00, NULL, NULL),
(102, 70, 1, 1, 199000.00, NULL, NULL),
(103, 71, 1, 1, 199000.00, NULL, NULL),
(104, 72, NULL, 1, 299000.00, 'Buffet Cơ Bản - Buffet', NULL),
(105, 73, 1, 1, 199000.00, NULL, NULL),
(106, 74, 11, 1, 350000.00, NULL, NULL),
(107, 75, 11, 1, 350000.00, NULL, NULL),
(108, 76, 14, 1, 1300000.00, NULL, NULL),
(109, 77, 11, 1, 350000.00, NULL, NULL),
(110, 78, 1, 1, 199000.00, NULL, NULL),
(111, 79, 14, 1, 1300000.00, NULL, NULL),
(112, 80, 11, 1, 350000.00, NULL, NULL),
(113, 81, 11, 1, 350000.00, NULL, NULL),
(114, 82, 11, 1, 350000.00, NULL, NULL),
(115, 83, 14, 1, 1300000.00, NULL, NULL),
(116, 84, 1, 1, 199000.00, NULL, NULL),
(117, 85, 11, 1, 350000.00, NULL, NULL),
(118, 86, 36, 1, 98000.00, NULL, NULL),
(119, 87, 14, 1, 1300000.00, NULL, NULL),
(120, 88, 36, 1, 98000.00, NULL, NULL),
(121, 89, 1, 1, 199000.00, NULL, NULL),
(122, 90, 1, 1, 199000.00, NULL, NULL),
(123, 90, 38, 1, 199000.00, NULL, NULL),
(125, 91, 38, 1, 199000.00, NULL, NULL),
(126, 91, 36, 1, 98000.00, NULL, NULL),
(127, 92, 64, 1, 1290000.00, NULL, NULL),
(128, 93, 11, 1, 350000.00, NULL, NULL),
(129, 94, 14, 1, 1300000.00, NULL, NULL),
(130, 95, 14, 1, 1300000.00, NULL, NULL),
(131, 96, 11, 1, 350000.00, NULL, NULL),
(132, 97, 11, 1, 350000.00, NULL, NULL),
(133, 98, 1, 1, 199000.00, NULL, NULL),
(134, 99, 11, 1, 350000.00, NULL, NULL),
(135, 100, 11, 1, 350000.00, NULL, NULL),
(136, 101, 34, 1, 270000.00, NULL, NULL),
(137, 102, 14, 1, 1300000.00, NULL, NULL),
(138, 103, 36, 1, 98000.00, NULL, NULL),
(139, 104, 11, 1, 350000.00, NULL, NULL),
(140, 105, 36, 1, 98000.00, NULL, NULL),
(141, 106, 11, 1, 350000.00, NULL, NULL),
(142, 107, 2, 1, 299000.00, NULL, NULL),
(143, 107, 64, 1, 1290000.00, NULL, NULL),
(144, 108, 11, 1, 350000.00, NULL, NULL),
(145, 109, 11, 1, 350000.00, NULL, NULL),
(146, 110, 11, 1, 350000.00, NULL, NULL),
(147, 111, 54, 1, 1290000.00, NULL, NULL),
(148, 111, 67, 1, 199000.00, NULL, NULL),
(149, 111, 41, 1, 899000.00, NULL, NULL),
(150, 111, 101, 1, 3285000.00, NULL, NULL),
(151, 112, 1, 1, 199000.00, NULL, NULL),
(152, 113, 1, 1, 199000.00, NULL, NULL),
(153, 113, 2, 1, 299000.00, NULL, NULL),
(154, 113, 11, 1, 350000.00, NULL, NULL),
(155, 113, 14, 1, 1300000.00, NULL, NULL),
(156, 114, 1, 1, 199000.00, NULL, NULL),
(157, 115, 1, 1, 199000.00, NULL, NULL),
(158, 116, 1, 1, 199000.00, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_details`
--
ALTER TABLE `order_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=159;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_details`
--
ALTER TABLE `order_details`
  ADD CONSTRAINT `order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);
--
-- Database: `paymentdb`
--
CREATE DATABASE IF NOT EXISTS `paymentdb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `paymentdb`;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cash_received` decimal(18,2) DEFAULT NULL,
  `cash_change` decimal(18,2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `amount`, `method`, `cash_received`, `cash_change`, `created_at`, `paid_at`) VALUES
(1, 71, 199000.00, 'cash', NULL, NULL, '2025-12-10 01:22:35', NULL),
(2, 71, 199000.00, 'cash', NULL, NULL, '2025-12-10 01:25:29', NULL),
(3, 72, 299000.00, 'cash', NULL, NULL, '2025-12-10 01:31:53', NULL),
(4, 75, 350000.00, 'cash', NULL, NULL, '2025-12-10 02:05:27', NULL),
(5, 76, 1300000.00, 'cash', NULL, NULL, '2025-12-10 02:32:41', '2025-12-10 02:32:41'),
(6, 77, 350000.00, 'cash', NULL, NULL, '2025-12-10 02:37:29', '2025-12-10 02:37:29'),
(7, 78, 199000.00, 'cash', NULL, NULL, '2025-12-10 02:58:23', '2025-12-10 02:58:23'),
(8, 79, 1300000.00, 'cash', NULL, NULL, '2025-12-10 03:10:16', '2025-12-10 03:10:16'),
(9, 80, 350000.00, 'cash', NULL, NULL, '2025-12-10 03:38:06', '2025-12-10 03:38:06'),
(10, 85, 350000.00, 'cash', NULL, NULL, '2025-12-10 03:40:45', '2025-12-10 03:40:45'),
(11, 87, 1398000.00, 'cash', NULL, NULL, '2025-12-10 03:51:09', '2025-12-10 03:51:09'),
(12, 89, 597000.00, 'cash', NULL, NULL, '2025-12-10 03:57:19', '2025-12-10 03:57:19'),
(13, 91, 1596000.00, 'cash', NULL, NULL, '2025-12-10 04:04:54', '2025-12-10 04:04:54'),
(14, 93, 350000.00, 'cash', NULL, NULL, '2025-12-13 08:58:57', '2025-12-13 08:58:57'),
(15, 94, 1300000.00, 'cash', NULL, NULL, '2025-12-13 09:24:25', '2025-12-13 09:24:25'),
(16, 95, 1300000.00, 'cash', NULL, NULL, '2025-12-13 10:08:44', '2025-12-13 10:08:44'),
(17, 97, 350000.00, 'cash', NULL, NULL, '2025-12-13 10:46:20', '2025-12-13 10:46:20'),
(18, 99, 350000.00, 'cash', NULL, NULL, '2025-12-13 11:24:10', '2025-12-13 11:24:10'),
(19, 100, 620000.00, 'cash', NULL, NULL, '2025-12-13 23:22:40', '2025-12-13 23:22:40'),
(20, 102, 1398000.00, 'cash', NULL, NULL, '2025-12-14 00:01:20', '2025-12-14 00:01:20'),
(21, 104, 448000.00, 'cash', NULL, NULL, '2025-12-14 00:08:23', '2025-12-14 00:08:23'),
(22, 106, 2289000.00, 'cash', NULL, NULL, '2025-12-14 00:15:09', '2025-12-14 00:15:09'),
(23, 109, 350000.00, 'cash', NULL, NULL, '2025-12-14 00:43:34', '2025-12-14 00:43:34'),
(24, 111, 5673000.00, 'cash', NULL, NULL, '2025-12-14 07:23:07', '2025-12-14 07:23:07'),
(29, 114, 199000.00, 'cash', NULL, NULL, NULL, '2026-04-02 00:02:00'),
(30, 116, 199000.00, 'cash', NULL, NULL, NULL, '2026-04-02 00:07:06');

-- --------------------------------------------------------

--
-- Table structure for table `payment_requests`
--

CREATE TABLE `payment_requests` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `table_id` int NOT NULL,
  `total` decimal(18,2) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_requests`
--

INSERT INTO `payment_requests` (`id`, `order_id`, `table_id`, `total`, `status`, `request_time`) VALUES
(7, 71, 1, 199000.00, 'paid', '2025-12-10 01:12:26'),
(8, 72, 1, 299000.00, 'paid', '2025-12-10 01:31:47'),
(9, 75, 1, 350000.00, 'paid', '2025-12-10 02:05:19'),
(10, 76, 1, 1300000.00, 'paid', '2025-12-10 02:32:34'),
(11, 77, 1, 350000.00, 'paid', '2025-12-10 02:37:22'),
(12, 78, 1, 199000.00, 'paid', '2025-12-10 02:58:18'),
(13, 79, 1, 1300000.00, 'paid', '2025-12-10 03:10:13'),
(14, 80, 1, 350000.00, 'paid', '2025-12-10 03:38:02'),
(15, 85, 1, 350000.00, 'paid', '2025-12-10 03:39:31'),
(16, 87, 1, 1398000.00, 'paid', '2025-12-10 03:51:01'),
(17, 89, 1, 597000.00, 'paid', '2025-12-10 03:57:03'),
(18, 91, 1, 1596000.00, 'paid', '2025-12-10 04:04:44'),
(19, 93, 1, 350000.00, 'paid', '2025-12-11 23:48:51'),
(20, 94, 1, 1300000.00, 'paid', '2025-12-13 09:24:19'),
(21, 95, 1, 1300000.00, 'paid', '2025-12-13 10:08:39'),
(22, 97, 3, 350000.00, 'paid', '2025-12-13 10:46:15'),
(23, 99, 1, 350000.00, 'paid', '2025-12-13 11:23:49'),
(24, 100, 1, 620000.00, 'paid', '2025-12-13 23:22:13'),
(25, 102, 1, 1398000.00, 'paid', '2025-12-13 23:31:15'),
(26, 104, 1, 448000.00, 'paid', '2025-12-14 00:08:09'),
(27, 106, 1, 2289000.00, 'paid', '2025-12-14 00:14:04'),
(28, 109, 1, 350000.00, 'paid', '2025-12-14 00:43:29'),
(29, 111, 1, 5673000.00, 'paid', '2025-12-14 07:22:51'),
(30, 114, 1, 199000.00, 'paid', '2026-04-01 23:51:53'),
(31, 116, 1, 199000.00, 'paid', '2026-04-02 00:07:02');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `payment_requests`
--
ALTER TABLE `payment_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;
--
-- Database: `tabledb`
--
CREATE DATABASE IF NOT EXISTS `tabledb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tabledb`;

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_layouts`
--

CREATE TABLE `restaurant_layouts` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `layout_data` longtext COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `restaurant_layouts`
--

INSERT INTO `restaurant_layouts` (`id`, `layout_data`) VALUES
('main', '`{\"id\":\"floor-1\",\"name\":\"Tầng 1 (Trệt)\",\"objects\":[`}]');

-- --------------------------------------------------------

--
-- Table structure for table `tables`
--

CREATE TABLE `tables` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_buffet` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tables`
--

INSERT INTO `tables` (`id`, `name`, `status`, `is_buffet`) VALUES
(1, 'Bàn 1', 'Trống', 0),
(2, 'Bàn 2', 'Trống', 0),
(3, 'Bàn 3', 'Trống', 0),
(4, 'Bàn 4', 'Trống', 0),
(5, 'Bàn 5', 'Trống', 0),
(6, 'Bàn 6', 'Trống', 0),
(7, 'Bàn 7', 'Trống', 0),
(8, 'Bàn 8', 'Trống', 0),
(9, 'Bàn 9', 'Trống', 0),
(18, 'Bàn 10', 'Trống', 0),
(19, 'Bàn 11', 'Trống', 0),
(20, 'Bàn 12', 'Trống', 0),
(22, '13', 'Trá»‘ng', 0);

-- --------------------------------------------------------

--
-- Table structure for table `table_keys`
--

CREATE TABLE `table_keys` (
  `id` int NOT NULL,
  `table_id` int DEFAULT NULL,
  `key_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `is_valid` tinyint(1) DEFAULT NULL,
  `device_session` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `table_keys`
--

INSERT INTO `table_keys` (`id`, `table_id`, `key_value`, `created_at`, `expires_at`, `is_valid`, `device_session`) VALUES
(1, 3, 'de7b48d1-8999-47bc-b40e-28991e2a5a61', '2025-05-18 15:11:44', '2025-05-18 16:11:44', 0, NULL),
(2, 5, '6fd76306-7439-4c1a-80a4-2cb5961ac3b6', '2025-05-18 15:12:37', '2025-05-18 16:12:37', 0, NULL),
(3, 7, 'b52656b5-8a77-419e-bc8c-bb5826f0d9b4', '2025-05-18 15:23:05', '2025-05-18 16:23:05', 0, NULL),
(4, 7, 'ae23a920-9b28-498b-a0a4-544d60c02e83', '2025-05-18 15:23:27', '2025-05-18 16:23:27', 0, NULL),
(5, 4, '508fd7d2-f20d-4736-8220-8157711526a7', '2025-05-18 16:40:53', '2025-05-18 17:40:53', 0, NULL),
(6, 3, '968acefc-3471-45cb-b3a2-94be1e650b57', '2025-05-18 16:41:07', '2025-05-18 17:41:07', 0, NULL),
(7, 4, 'acb48768-10fc-4a7f-a87f-6362224de604', '2025-05-21 14:43:37', '2025-05-21 15:43:37', 0, NULL),
(8, 4, 'd5dc2a54-d80c-451c-92a0-11e2fe341fb4', '2025-05-21 14:43:40', '2025-05-21 15:43:40', 0, NULL),
(9, 6, '739e25ee-ecee-4863-8bfc-cf70e00f2e65', '2025-05-21 15:32:53', '2025-05-21 16:32:53', 0, NULL),
(10, 6, 'c97903de-6ea6-476c-8c12-23f6fade75b5', '2025-05-21 15:33:00', '2025-05-21 16:33:00', 0, NULL),
(11, 9, '147cc105-7181-42a8-bb1e-fc71cb8346a1', '2025-05-21 15:34:33', '2025-05-21 16:34:33', 0, NULL),
(12, 6, '23978577-9917-40a2-af63-3b2981114cd7', '2025-05-21 15:50:33', '2025-05-21 16:50:33', 0, NULL),
(13, 8, 'c6929dd8-916a-4bf1-b845-30480fbbcd50', '2025-05-21 15:51:03', '2025-05-21 16:51:03', 0, NULL),
(14, 8, 'a0b2e2d6-cee3-40ab-9dca-47f4f4873305', '2025-05-21 15:59:09', '2025-05-21 16:59:09', 0, NULL),
(15, 2, 'c9e69bbf-aef9-4f63-b815-092386f8c54d', '2025-05-26 16:22:25', '2025-05-26 18:22:25', 0, NULL),
(16, 2, 'fe2fac36-8570-4bd2-b77c-2a4dc0a11ef6', '2025-05-26 21:25:05', '2025-05-26 23:25:05', 0, NULL),
(17, 1, '6089bf51-d4f5-4d5c-a0f9-c8137e80c373', '2025-05-26 21:34:15', '2025-05-26 23:34:15', 0, NULL),
(18, 1, '6835ae97-686c-4b36-9260-a5a1e99b14e9', '2025-05-26 21:40:14', '2025-05-26 23:40:14', 0, NULL),
(19, 18, '37277467-105a-4359-a94c-23c9993e12f2', '2025-05-26 22:28:06', '2025-05-27 00:28:06', 0, NULL),
(20, 1, '73fbf1f5-19ac-46c9-bc5b-7459528231c2', '2025-05-26 22:37:48', '2025-05-27 00:37:48', 0, NULL),
(21, 1, '2a526c93-f035-4a5a-9814-8b27380c2e9c', '2025-05-26 22:37:51', '2025-05-27 00:37:51', 0, NULL),
(22, 1, 'c4cacbbc-2232-407a-8ac9-520568e61e8c', '2025-05-26 22:42:32', '2025-05-27 00:42:32', 0, NULL),
(23, 1, '3e876b9f-fcfd-4b00-a477-917f283992cb', '2025-05-26 22:43:03', '2025-05-27 00:43:03', 0, NULL),
(24, 1, 'c0218587-585e-4482-8988-933f619e3d4f', '2025-05-26 22:45:05', '2025-05-27 00:45:05', 0, NULL),
(25, 1, 'cbbcd297-9eb0-494f-95ae-8220995add26', '2025-05-26 22:45:09', '2025-05-27 00:45:09', 0, NULL),
(26, 1, '216e965e-0af6-4bcf-9f77-0e758fa2b6d7', '2025-05-27 01:57:36', '2025-05-27 03:57:36', 0, NULL),
(27, 1, '707fda28-2f66-4011-bfff-6b22bf25f3ae', '2025-05-27 01:59:57', '2025-05-27 03:59:57', 0, NULL),
(28, 1, 'dcb466d0-b3bb-4a20-999c-db6e252f069f', '2025-05-27 02:03:07', '2025-05-27 04:03:07', 0, NULL),
(29, 1, '37b46fcb-c840-4a2e-996c-9f46053a390f', '2025-05-27 13:01:44', '2025-05-27 15:01:44', 0, NULL),
(30, 1, 'c1eee778-2b02-453b-b53b-b0d22810544c', '2025-05-27 13:02:17', '2025-05-27 15:02:17', 0, NULL),
(31, 1, '441b30e0-b7ff-4737-a239-d2141ab56a4b', '2025-05-28 00:58:12', '2025-05-28 02:58:12', 0, NULL),
(32, 1, '63ac7fa0-258d-4580-af6b-93cf13dd235d', '2025-05-28 01:08:21', '2025-05-28 03:08:21', 0, NULL),
(33, 1, '7f0ecffa-6547-4484-b1b5-5c2567fbaab8', '2025-05-28 01:16:51', '2025-05-28 03:16:51', 0, NULL),
(34, 2, '003f4984-2811-44a2-b3ea-76bd07a43134', '2025-05-28 01:20:28', '2025-05-28 03:20:28', 0, NULL),
(35, 4, '2ff0b520-a109-4e00-8bb2-25cb1d53290d', '2025-05-28 01:27:31', '2025-05-28 03:27:31', 0, NULL),
(36, 1, '2bf496b1-9989-4b4b-943e-5abc32730cd7', '2025-05-28 01:42:30', '2025-05-28 03:42:30', 0, NULL),
(37, 1, '8f4fffb1-82fb-447f-9e25-8cdcde774f43', '2025-05-28 01:47:39', '2025-05-28 03:47:39', 0, NULL),
(38, 1, '89019ab2-6351-4be2-b4b8-9bc0250e2224', '2025-05-28 03:55:25', '2025-05-28 05:55:25', 0, NULL),
(39, 2, '2146431c-649e-41b8-9ca1-239a7dc8215d', '2025-05-28 03:56:11', '2025-05-28 05:56:11', 0, NULL),
(40, 1, 'f39452f0-b00b-4f54-9326-916683874437', '2025-05-28 04:03:15', '2025-05-28 06:03:15', 0, NULL),
(41, 2, 'd1b719d5-fd08-4188-b524-7d897d7564b7', '2025-05-28 04:13:41', '2025-05-28 06:13:41', 0, NULL),
(42, 2, 'a902fb3d-94e0-4061-b4f5-9de9f9f152fd', '2025-05-28 04:14:23', '2025-05-28 06:14:23', 0, NULL),
(43, 1, '7abaeba4-770b-4010-b6a3-0ac1bbbff5b1', '2025-05-28 04:20:55', '2025-05-28 06:20:55', 0, NULL),
(44, 3, '76dc5dc3-4f17-4ca8-ba2b-432fc7ae5eb4', '2025-05-28 04:23:56', '2025-05-28 06:23:56', 0, NULL),
(45, 1, '4a761397-99d3-4316-acd4-dbf92e8d2d58', '2025-05-28 04:29:12', '2025-05-28 06:29:12', 0, NULL),
(46, 1, '62c13714-bf47-4820-bb36-8d2dbb0f7096', '2025-05-28 04:34:04', '2025-05-28 06:34:04', 0, NULL),
(47, 1, 'd5f0c027-74e2-440c-9d45-4101516965ec', '2025-05-28 04:39:41', '2025-05-28 06:39:41', 0, NULL),
(48, 1, '06edf467-15b3-4b56-9bfc-754fcc99a4a0', '2025-05-28 05:06:12', '2025-05-28 07:06:12', 0, NULL),
(49, 1, 'f4b24832-3277-42ae-87fa-fdce29282fda', '2025-05-28 05:14:57', '2025-05-28 07:14:57', 0, NULL),
(50, 1, 'f5bcdf79-2a7c-485b-af9c-84f000a682fd', '2025-05-28 05:31:21', '2025-05-28 07:31:21', 0, NULL),
(51, 1, '9df268bb-fb89-405d-a683-d636e67813e9', '2025-05-28 05:38:14', '2025-05-28 07:38:14', 0, NULL),
(52, 1, 'edbc33ac-d01f-4226-bdc9-c5c97fecc24b', '2025-05-28 05:44:17', '2025-05-28 07:44:17', 0, NULL),
(53, 2, 'ee186e62-4528-43be-8cd0-a828d76f1061', '2025-05-28 05:49:52', '2025-05-28 07:49:52', 0, NULL),
(54, 1, '8010d4df-b145-4843-be22-ff8e66880c96', '2025-05-28 05:57:33', '2025-05-28 07:57:33', 0, NULL),
(55, 1, 'e47e44d8-b9f2-4644-baa7-a80f5d6e0e7d', '2025-05-28 13:26:29', '2025-05-28 15:26:29', 0, NULL),
(56, 2, 'ab8b0ded-80fe-4950-a936-b372828db946', '2025-05-28 13:47:44', '2025-05-28 15:47:44', 0, NULL),
(57, 3, '09dec78d-c285-41f7-a232-6597e5720b66', '2025-05-28 13:50:37', '2025-05-28 15:50:37', 0, NULL),
(58, 1, '4db20253-bb32-4bab-9be9-731872aaa46e', '2025-05-29 20:16:06', '2025-05-29 22:16:06', 0, NULL),
(59, 1, 'aabbd5f8-591d-4d5e-9c17-64c7b1bcc806', '2025-06-02 16:17:05', '2025-06-02 18:17:05', 0, NULL),
(60, 1, '79c95ec1-a303-4135-94fb-30bf65e008df', '2025-06-02 17:32:52', '2025-06-02 19:32:52', 0, NULL),
(61, 1, '94b5a8d5-5e6b-4793-964a-702a27cf2416', '2025-06-02 19:27:25', '2025-06-02 21:27:25', 0, NULL),
(62, 2, '569418c0-9d86-40ba-a5d5-1ac340a60898', '2025-06-02 19:40:36', '2025-06-02 21:40:36', 0, NULL),
(63, 1, '8bc05879-3333-46b0-9567-4dd81ca58996', '2025-06-02 20:39:44', '2025-06-02 22:39:44', 0, NULL),
(64, 18, '3a246565-7656-4a9d-ae85-806ff5d5824a', '2025-06-02 20:40:46', '2025-06-02 22:40:46', 0, NULL),
(65, 9, '5f2e3ac4-7034-43ea-8681-7d55d45d4fa1', '2025-06-02 20:41:25', '2025-06-02 22:41:25', 0, NULL),
(66, 1, '55fa8f4e-43cb-4b85-8659-05c1d273bc79', '2025-06-02 21:06:40', '2025-06-02 23:06:40', 0, NULL),
(67, 2, '677ca6cc-870d-456e-838d-26591d02918c', '2025-06-02 21:16:01', '2025-06-02 23:16:01', 0, NULL),
(68, 1, '78166951-4d74-4d20-90bc-0d20462c5ec1', '2025-06-03 11:07:14', '2025-06-03 13:07:14', 0, NULL),
(69, 1, '56be7e3e-0abb-4fb6-b750-1dedea4a05b5', '2025-06-04 23:35:50', '2025-06-05 01:35:50', 0, NULL),
(70, 2, 'ff38289e-6a06-4d19-9a13-3834472f1338', '2025-06-04 23:41:20', '2025-06-05 01:41:20', 0, NULL),
(71, 3, '5422cd43-6fc7-4bce-826b-16f754e7c7d5', '2025-06-05 00:02:10', '2025-06-05 02:02:10', 0, NULL),
(72, 4, '65c4f0f2-fdb7-44d0-ad9b-1a6153e1b32b', '2025-06-05 00:08:16', '2025-06-05 02:08:16', 0, NULL),
(73, 5, '843e8119-79ef-4fb7-9c11-151ada211935', '2025-06-05 00:13:49', '2025-06-05 02:13:49', 0, NULL),
(74, 6, 'be15c663-d074-4f6e-bd89-e45bd75b208c', '2025-06-05 00:14:31', '2025-06-05 02:14:31', 0, NULL),
(75, 7, 'd9ec4157-4196-46e2-ae67-f2b191f0a6f6', '2025-06-05 00:15:12', '2025-06-05 02:15:12', 0, NULL),
(76, 8, 'c77907ef-d546-4812-bead-3475b2bb14c4', '2025-06-05 00:21:54', '2025-06-05 02:21:54', 0, NULL),
(77, 9, 'dc7b13e1-f541-4a6d-ae52-7ad5650aac90', '2025-06-05 00:29:58', '2025-06-05 02:29:58', 0, NULL),
(78, 4, '819e326f-c69e-432c-93a1-f437ba95cab4', '2025-06-05 00:33:32', '2025-06-05 02:33:32', 0, NULL),
(79, 18, '9fda2081-d1ad-482b-9586-c43746f95a4e', '2025-06-05 00:34:56', '2025-06-05 02:34:56', 0, NULL),
(80, 19, '71fd685e-5ff6-45d9-86ba-ce15ece3b44f', '2025-06-05 00:35:39', '2025-06-05 02:35:39', 0, NULL),
(81, 5, '804dd910-a63f-41b7-9b6b-f71a6f5db11e', '2025-06-05 00:54:04', '2025-06-05 02:54:04', 0, NULL),
(82, 5, 'f1b98111-a91d-4e48-bf6b-43f0a712c2fe', '2025-06-05 00:54:37', '2025-06-05 02:54:37', 0, NULL),
(83, 1, '75c48f1f-b016-4ff8-b4e9-0a1358ce2525', '2025-06-05 00:55:56', '2025-06-05 02:55:56', 0, NULL),
(84, 6, '7761b015-e216-44fc-93bf-d115d193498b', '2025-06-05 01:09:12', '2025-06-05 03:09:12', 0, NULL),
(85, 7, 'c8539ffd-724d-4ed9-9529-4bc40f9028e4', '2025-06-05 01:10:38', '2025-06-05 03:10:38', 0, NULL),
(86, 8, '6a420272-2021-48b5-9bc4-37698d7a5d52', '2025-06-05 01:38:29', '2025-06-05 03:38:29', 0, NULL),
(87, 2, '5d9ed9be-1534-43aa-8354-a219ba32ae3b', '2025-06-05 02:00:11', '2025-06-05 04:00:11', 0, NULL),
(88, 3, '965cad5c-cdc8-4673-bb74-db47d109f433', '2025-06-05 02:09:33', '2025-06-05 04:09:33', 0, NULL),
(89, 1, '2e51906b-676e-4eb0-80b8-106dbd5613d7', '2025-06-05 14:20:43', '2025-06-05 16:20:43', 0, NULL),
(90, 1, '826ce96c-642f-4eed-a1b6-0c4570968bc2', '2025-06-05 14:47:42', '2025-06-05 16:47:42', 0, NULL),
(91, 1, '4b03b446-f855-4d1e-a454-0436fbf59c7c', '2025-06-05 15:43:08', '2025-06-05 17:43:08', 0, NULL),
(92, 2, '39df77f6-34cb-4e36-853b-166cd664487b', '2025-06-05 15:51:11', '2025-06-05 17:51:11', 0, NULL),
(93, 1, '4718e303-af71-4ba5-b439-04aad6cbe6be', '2025-06-05 22:13:54', '2025-06-06 00:13:54', 0, NULL),
(94, 1, '12e9b041-4bf1-405b-8548-f038d24cd609', '2025-06-06 20:07:44', '2025-06-06 22:07:44', 0, NULL),
(95, 1, '363281a6-e63d-4251-ab65-8a3746c9007d', '2025-06-07 11:54:51', '2025-06-07 13:54:51', 0, NULL),
(96, 2, 'b9e655fb-75ca-41f9-acab-27745a1f25b1', '2025-06-07 13:23:28', '2025-06-07 15:23:28', 0, NULL),
(97, 3, 'bdcb490d-dcdb-4648-bdce-b4a76a6e1035', '2025-06-07 13:25:40', '2025-06-07 15:25:40', 0, NULL),
(98, 3, '23926f1c-2572-4055-8549-dedbbc82f2fe', '2025-06-07 13:26:06', '2025-06-07 15:26:06', 0, NULL),
(99, 2, '2ecce84a-e24b-4128-9380-f0367b279f0c', '2025-06-20 09:01:10', '2025-06-20 11:01:10', 0, NULL),
(100, 1, 'b63d8e91-1a9a-4171-a2d6-8930e1a52052', '2025-06-26 18:51:08', '2025-06-26 20:51:08', 0, NULL),
(101, 2, 'bc889d9a-0de4-446e-8ff0-0335e13f71eb', '2025-06-26 21:08:33', '2025-06-26 23:08:33', 0, NULL),
(102, 1, '3f6b27de-79d1-4f91-bbcb-a77f070b2274', '2025-07-30 00:32:01', '2025-07-30 02:32:01', 0, NULL),
(103, 1, 'c3142fb8-84ff-49a3-a6ee-b1c379adcfac', '2025-08-10 00:11:18', '2025-08-10 02:11:18', 0, NULL),
(104, 1, '52a7ea0e-fbdd-4edd-90c2-5267067ecc96', '2025-10-31 02:15:21', '2025-10-31 04:15:21', 0, NULL),
(105, 1, '233ae958-768a-4d93-82bd-465530a66bec', '2025-11-15 09:47:47', '2025-11-15 11:47:47', 0, NULL),
(106, 1, '35d21982-3415-447e-8c13-5a72e30811f9', '2025-12-08 20:18:26', '2025-12-08 22:18:26', 0, NULL),
(107, 1, '56b1f280-dc54-456b-99d3-3e316a2f2471', '2025-12-09 22:02:57', '2025-12-10 00:02:57', 0, NULL),
(108, 1, 'f43b8923-4991-413d-9cf9-33a692a03630', '2025-12-09 22:17:45', '2025-12-10 00:17:45', 0, NULL),
(109, 1, '3691d109-07fa-46b6-b797-765c8ddb7a73', '2025-12-09 22:24:06', '2025-12-10 00:24:06', 0, NULL),
(110, 2, 'ce058eeb-ccea-4b5b-9da7-da2dedb369d9', '2025-12-09 23:01:08', '2025-12-10 01:01:08', 0, NULL),
(111, 1, '15daa991-ea36-49cf-8da7-daa27e4ad277', '2025-12-09 23:55:14', '2025-12-10 01:55:14', 0, NULL),
(112, 2, '0ffb2b8a-f533-4b02-a0d2-65978e225e7d', '2025-12-10 00:17:47', '2025-12-10 02:17:47', 0, NULL),
(113, 1, '713c6eb5-cee8-4178-ac0f-f909bf2d6245', '2025-12-10 00:46:37', '2025-12-10 02:46:37', 0, NULL),
(114, 3, 'bf597f86-2e5a-4f8f-abc6-3161835a9a84', '2025-12-10 00:50:29', '2025-12-10 02:50:29', 0, NULL),
(115, 1, 'bb946f76-1359-4382-8879-5c40f15d2cd4', '2025-12-10 01:05:28', '2025-12-10 03:05:28', 0, NULL),
(116, 1, 'cab0173f-010a-4926-a1e2-2496e29e36c2', '2025-12-10 01:31:40', '2025-12-10 03:31:40', 0, NULL),
(117, 1, 'bd73eef5-09c1-49a5-beeb-e9e1d4cd2017', '2025-12-10 01:53:31', '2025-12-10 03:53:31', 0, NULL),
(118, 1, 'e3ae8107-f0ae-47ea-9ab7-8bce81241712', '2025-12-10 02:32:26', '2025-12-10 04:32:26', 0, NULL),
(119, 1, '6faae243-0805-4c41-bf20-7fecadce8ee3', '2025-12-10 02:37:13', '2025-12-10 04:37:13', 0, NULL),
(120, 1, 'db025ce0-9d43-44a6-8ba5-a4060d7182a9', '2025-12-10 02:57:47', '2025-12-10 04:57:47', 0, NULL),
(121, 1, '2ae2a8ab-8d42-4747-989a-2373766f217a', '2025-12-10 03:09:53', '2025-12-10 05:09:53', 0, NULL),
(122, 1, '84d59b7a-749a-4591-9218-c548eb65b71d', '2025-12-10 03:18:47', '2025-12-10 05:18:47', 0, NULL),
(123, 1, '48edfc02-9cdb-4edb-bc60-e3ed72b38dfa', '2025-12-10 03:38:38', '2025-12-10 05:38:38', 0, NULL),
(124, 1, 'e0f620e9-5998-40fd-a2af-a339333461ac', '2025-12-10 03:50:17', '2025-12-10 05:50:17', 0, NULL),
(125, 1, '7615a2b6-b228-4903-b0c5-2165e70d28e5', '2025-12-10 03:55:01', '2025-12-10 05:55:01', 0, NULL),
(126, 1, '72f0c3e5-cb4f-4ee4-acd7-754e8415dcb7', '2025-12-10 04:01:57', '2025-12-10 06:01:57', 0, NULL),
(127, 1, '4a1dc70b-6624-401c-8849-df79b96112d3', '2025-12-11 23:48:42', '2025-12-12 01:48:42', 0, NULL),
(128, 1, '2f754cd6-8fcb-4942-a13b-54d652b01f34', '2025-12-13 09:17:33', '2025-12-13 11:17:33', 0, NULL),
(129, 1, 'cf6f181a-a437-45f2-a7ed-20937f11d062', '2025-12-13 10:06:40', '2025-12-13 12:06:40', 0, NULL),
(130, 2, 'f74bf5e1-bbfe-4688-890c-ff433b77dd7f', '2025-12-13 10:14:42', '2025-12-13 12:14:42', 0, NULL),
(131, 3, '71db81be-99c1-4d5c-bf47-619dde71107b', '2025-12-13 10:45:46', '2025-12-13 12:45:46', 0, NULL),
(132, 1, '1a8dc320-ccfb-4b9f-9a03-a8e934721bd7', '2025-12-13 11:13:31', '2025-12-13 13:13:31', 0, NULL),
(133, 1, 'b19bea9f-0cef-4b75-8d90-5485be1196ae', '2025-12-13 11:23:41', '2025-12-13 13:23:41', 0, NULL),
(134, 1, 'f860137a-1ccd-497e-bf4a-692a95c69f3b', '2025-12-13 23:19:58', '2025-12-14 01:19:58', 0, NULL),
(135, 1, '64d28823-35df-4519-9210-fff3f6fc14c9', '2025-12-13 23:29:58', '2025-12-14 01:29:58', 0, NULL),
(136, 1, '4749571c-9fa4-429d-b142-0ec81ca4928c', '2025-12-14 00:07:30', '2025-12-14 02:07:30', 0, NULL),
(137, 1, '8e8e387e-b82c-4a38-b26d-c43bba51d23d', '2025-12-14 00:13:30', '2025-12-14 02:13:30', 0, NULL),
(138, 1, '2caa440e-bbf8-4060-9081-14e5c90a74f0', '2025-12-14 00:39:40', '2025-12-14 02:39:40', 0, NULL),
(139, 1, '4e284fbb-a008-4f0e-822e-aacea8bfc004', '2025-12-14 00:43:45', '2025-12-14 02:43:45', 0, NULL),
(140, 1, 'f713d52d-dacb-4ba9-bc65-fb1d4000f9d7', '2025-12-14 00:57:38', '2025-12-14 02:57:38', 0, NULL),
(141, 1, '6100f8a9-c956-46fc-baa0-f835ed1c1c78', '2025-12-14 07:20:38', '2025-12-14 09:20:38', 0, NULL),
(142, 1, '797c321d-db37-4aab-9485-5c8e2b168acd', '2026-03-24 03:28:46', '2026-03-24 05:28:46', 0, NULL),
(143, 1, '9fb08036-ed71-457d-857b-6baa1890429d', '2026-03-24 03:28:49', '2026-03-24 05:28:49', 0, NULL),
(144, 22, 'c0a839fe-a94a-464e-805d-15194e414677', '2026-03-24 08:26:14', '2026-03-24 10:26:14', 0, NULL),
(145, 1, '77f99e6a-943f-4ae0-a353-55118a76ea21', '2026-03-24 08:45:41', '2026-03-24 10:45:41', 0, NULL),
(146, 1, '06a2fb7a-a777-4296-b294-dabf7d4b2f20', '2026-03-24 08:48:28', '2026-03-24 10:48:28', 0, NULL),
(147, 2, 'a9a1fd3e-eefb-4e39-8d69-f787800b0205', '2026-03-24 08:49:19', '2026-03-24 10:49:19', 0, NULL),
(148, 1, 'be8b7241-1232-477d-83d2-28431d77e93f', '2026-03-24 08:56:56', '2026-03-24 10:56:56', 0, 'dev_kdiyao7w1774317377698'),
(149, 1, '83d2478f-fd25-4953-b88b-90b9932cb7f4', '2026-03-24 09:46:17', '2026-03-24 11:46:17', 0, 'dev_kdiyao7w1774317377698'),
(1148, 1, '5a852d3c-b4fb-4672-b3e4-0c9a839cec95', '2026-03-25 18:45:02', '2026-03-25 20:45:02', 0, NULL),
(1149, 1, 'f80bd82b-9f67-48a4-b318-b81b7ab840ad', '2026-03-25 18:49:35', '2026-03-25 20:49:35', 0, NULL),
(1150, 1, '7d3cc6c3-45fd-4821-a76d-15050e7c5651', '2026-03-25 18:51:17', '2026-03-25 20:51:17', 0, 'test'),
(1151, 1, 'bb977e8a-5d0a-44e6-9d87-c1d392319064', '2026-03-25 18:53:07', '2026-03-25 20:53:07', 0, NULL),
(1152, 2, 'ec54ac49-7ab9-47a0-a835-140439bbc12a', '2026-03-25 18:53:21', '2026-03-25 20:53:21', 0, NULL),
(1153, 1, 'daad2370-a97c-4c6e-8d7e-e7a26f0495fd', '2026-03-25 19:02:25', '2026-03-25 21:02:25', 0, NULL),
(1154, 1, '9bc82aa2-46f9-4516-b243-6ffe7c907823', '2026-03-25 21:26:30', '2026-03-25 23:26:30', 0, 'dev_30l96hl41774439156106'),
(1155, 2, '2841ee0f-d2f3-43a8-bfeb-faadd787a805', '2026-03-31 22:46:02', '2026-04-01 00:46:02', 0, 'dev_30l96hl41774439156106'),
(1156, 2, 'daae05a4-75f2-4661-ad8b-cf04763e49cb', '2026-03-31 23:24:54', '2026-04-01 01:24:54', 0, 'dev_30l96hl41774439156106'),
(1157, 1, '12e98f0d-9347-4606-982c-7cde0741cd46', '2026-04-01 16:01:57', '2026-04-01 18:01:57', 0, 'dev_30l96hl41774439156106'),
(1158, 1, 'f7367d9c-98f6-4334-986a-2f133bc5261a', '2026-04-01 22:32:26', '2026-04-02 00:32:26', 0, NULL),
(1159, 2, 'a70864f1-864e-42c9-8615-21657b2d3744', '2026-04-01 22:33:04', '2026-04-02 00:33:04', 1, NULL),
(1160, 1, '7b5c8a05-53de-4c0a-8bcc-b66ed8bc48aa', '2026-04-01 23:04:53', '2026-04-02 01:04:53', 0, NULL),
(1161, 1, '138917ef-c3ca-49d6-a340-4a061c4819fc', '2026-04-01 23:11:47', '2026-04-02 01:11:47', 0, NULL),
(1162, 1, '2f5c13dd-54a7-4084-b40d-1f2c510b42ca', '2026-04-02 00:02:41', '2026-04-02 02:02:41', 0, NULL),
(1163, 1, '0610f7f6-912c-4f54-a4b2-7057959e78a8', '2026-04-02 00:06:27', '2026-04-02 02:06:27', 0, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `restaurant_layouts`
--
ALTER TABLE `restaurant_layouts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tables`
--
ALTER TABLE `tables`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `table_keys`
--
ALTER TABLE `table_keys`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tables`
--
ALTER TABLE `tables`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `table_keys`
--
ALTER TABLE `table_keys`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1164;
--
-- Database: `userdb`
--
CREATE DATABASE IF NOT EXISTS `userdb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `userdb`;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `logs`
--

INSERT INTO `logs` (`id`, `user_id`, `action`, `created_at`) VALUES
(1, 0, 'Khách bàn 1 đặt đơn hàng mới ID: 73', '2025-04-13 01:27:24'),
(2, 0, 'Khách bàn 1 hủy đơn hàng ID: 73', '2025-04-13 01:27:53'),
(3, 0, 'Khách bàn 1 đặt đơn hàng mới ID: 1', '2025-04-13 23:31:46'),
(4, 0, 'Khách bàn 1 đặt đơn hàng mới ID: 2', '2025-04-14 22:22:57'),
(5, 0, 'Khách bàn 2 đặt đơn hàng mới ID: 3', '2025-04-15 09:54:32'),
(6, 11, 'Đăng nhập', '2025-05-21 17:36:49'),
(7, 11, 'Đăng nhập', '2025-05-21 18:31:04'),
(8, 12, 'Đăng nhập', '2025-05-21 18:48:39'),
(9, 11, 'Đăng nhập', '2025-05-21 18:55:59'),
(10, 12, 'Đăng nhập', '2025-05-21 18:59:57'),
(11, 11, 'Đăng nhập', '2025-05-21 19:01:40'),
(12, 11, 'Đăng nhập', '2025-05-21 19:06:47'),
(13, 11, 'Đăng nhập', '2025-05-21 19:47:21'),
(14, 11, 'Đăng nhập', '2025-05-21 20:07:24'),
(15, 11, 'Đăng nhập', '2025-05-21 20:21:56'),
(16, 11, 'Đăng nhập', '2025-05-21 20:32:29'),
(17, 11, 'Đăng nhập', '2025-05-21 20:50:38'),
(18, 11, 'Đăng nhập', '2025-05-21 21:21:41'),
(19, 11, 'Đăng nhập', '2025-05-21 23:20:03'),
(20, 11, 'Đăng nhập', '2025-05-21 23:35:03'),
(21, 11, 'Đăng nhập', '2025-05-21 23:37:27'),
(22, 11, 'Đăng nhập', '2025-05-24 17:01:09'),
(23, 11, 'Đăng nhập', '2025-05-24 17:06:07'),
(24, 11, 'Đăng nhập', '2025-05-24 17:30:51'),
(25, 11, 'Đăng nhập', '2025-05-24 23:34:53'),
(26, 11, 'Đăng nhập', '2025-05-24 23:53:05'),
(27, 11, 'Đăng nhập', '2025-05-25 00:47:39'),
(28, 11, 'Đăng nhập', '2025-05-25 00:48:03'),
(29, 11, 'Đăng nhập', '2025-05-25 01:15:20'),
(30, 11, 'Đăng nhập', '2025-05-25 01:20:26'),
(31, 11, 'Đăng nhập', '2025-05-25 01:20:26'),
(32, 11, 'Đăng nhập', '2025-05-25 01:25:01'),
(33, 11, 'Đăng nhập', '2025-05-25 01:29:04'),
(34, 11, 'Đăng nhập', '2025-05-25 02:05:57'),
(35, 11, 'Đăng nhập', '2025-05-25 02:19:26'),
(36, 11, 'Đăng nhập', '2025-05-25 02:19:48'),
(37, 11, 'Đăng nhập', '2025-05-25 02:30:49'),
(38, 11, 'Đăng nhập', '2025-05-25 02:31:40'),
(39, 11, 'Đăng nhập', '2025-05-25 02:34:29'),
(40, 11, 'Đăng nhập', '2025-05-25 02:48:47'),
(41, 11, 'Đăng nhập', '2025-05-26 15:45:46'),
(42, 11, 'Đăng nhập', '2025-05-26 17:12:41'),
(43, 11, 'Đăng nhập', '2025-05-26 17:17:53'),
(44, 11, 'Xóa 3 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-26 17:18:04'),
(45, 11, 'Đăng nhập', '2025-05-26 18:50:41'),
(46, 11, 'Xóa 1 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-26 21:05:42'),
(47, 11, 'Xóa 1 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-26 21:17:34'),
(48, 11, 'Đăng nhập', '2025-05-26 21:39:33'),
(49, 11, 'Đăng nhập', '2025-05-26 21:47:11'),
(50, 11, 'Đăng nhập', '2025-05-26 22:12:18'),
(51, 11, 'Đăng nhập', '2025-05-26 22:12:41'),
(52, 11, 'Đăng nhập', '2025-05-27 01:57:00'),
(53, 11, 'Đăng nhập', '2025-05-28 01:25:14'),
(54, 11, 'Xóa 1 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-28 01:48:06'),
(55, 11, 'Đăng nhập', '2025-05-28 04:02:58'),
(56, 11, 'Đăng nhập', '2025-05-28 04:13:12'),
(57, 11, 'Xóa 6 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-28 04:23:50'),
(58, 11, 'Đăng nhập', '2025-05-28 04:28:53'),
(59, 11, 'Xóa 1 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-28 04:29:05'),
(60, 11, 'Đăng nhập', '2025-05-28 04:59:49'),
(61, 11, 'Xóa 3 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-28 05:06:08'),
(62, 11, 'Đăng nhập', '2025-05-28 05:14:24'),
(63, 11, 'Xóa 2 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-28 05:30:14'),
(64, 11, 'Đăng nhập', '2025-05-28 05:38:03'),
(65, 11, 'Xóa 3 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-28 05:44:42'),
(66, 11, 'Đăng nhập', '2025-05-28 05:49:16'),
(67, 11, 'Xóa 3 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-05-28 06:02:34'),
(68, 11, 'Đăng nhập', '2025-05-29 20:15:57'),
(69, 11, 'Đăng nhập', '2025-06-02 16:15:35'),
(70, 11, 'Xóa 1 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-06-02 16:22:52'),
(71, 13, 'Đăng nhập', '2025-06-02 19:34:00'),
(72, 13, 'Đăng nhập', '2025-06-02 19:40:10'),
(73, 13, 'Đăng nhập', '2025-06-02 20:18:01'),
(74, 14, 'Đăng nhập', '2025-06-02 21:06:17'),
(75, 14, 'Đăng nhập', '2025-06-02 22:03:04'),
(76, 14, 'Đăng nhập', '2025-06-04 22:52:02'),
(77, 15, 'Đăng nhập', '2025-06-04 23:31:07'),
(78, 16, 'Đăng nhập', '2025-06-04 23:31:19'),
(79, 14, 'Đăng nhập', '2025-06-05 00:01:59'),
(80, 14, 'Đăng nhập', '2025-06-05 02:07:36'),
(81, 14, 'Đăng nhập', '2025-06-05 02:24:11'),
(82, 14, 'Đăng nhập', '2025-06-05 02:35:56'),
(83, 11, 'Đăng nhập', '2025-06-05 14:13:43'),
(84, 11, 'Đăng nhập', '2025-06-05 14:47:34'),
(85, 11, 'Đăng nhập', '2025-06-05 15:09:26'),
(86, 11, 'Đăng nhập', '2025-06-05 22:20:42'),
(87, 11, 'Đăng nhập', '2025-06-07 11:54:35'),
(88, 14, 'Đăng nhập', '2025-06-20 09:01:00'),
(89, 11, 'Đăng nhập', '2025-06-26 18:50:47'),
(90, 11, 'Đăng nhập', '2025-07-30 00:31:51'),
(91, 11, 'Đăng nhập', '2025-08-10 00:11:06'),
(92, 11, 'Đăng nhập', '2025-10-25 12:27:45'),
(93, 11, 'Xóa 24 món ăn đã hoàn thành khỏi hàng đợi nhà bếp', '2025-10-25 12:29:14'),
(94, 11, 'Đăng nhập', '2025-10-31 02:14:40'),
(95, 11, 'Đăng nhập', '2025-11-15 09:46:29'),
(96, 11, 'Đăng nhập', '2025-12-01 19:37:55'),
(97, 11, 'Đăng nhập', '2025-12-08 19:33:58'),
(98, 11, 'Đăng nhập', '2025-12-08 19:54:20'),
(99, 11, 'Đăng nhập', '2025-12-08 20:18:18'),
(100, 11, 'Đăng nhập', '2025-12-09 19:55:33'),
(101, 11, 'Đăng nhập', '2025-12-09 20:07:28'),
(102, 11, 'Đăng nhập', '2025-12-09 20:40:11'),
(103, 11, 'Đăng nhập', '2025-12-09 20:40:23'),
(104, 11, 'Đăng nhập', '2025-12-09 21:04:00'),
(105, 11, 'Đăng nhập', '2025-12-09 22:44:07'),
(106, 11, 'Đăng nhập', '2025-12-09 22:58:55'),
(107, 11, 'Đăng nhập', '2025-12-09 23:38:26'),
(108, 11, 'Đăng nhập', '2025-12-10 00:05:49'),
(109, 11, 'Đăng nhập', '2025-12-10 00:50:21'),
(110, 11, 'Đăng nhập', '2025-12-10 02:06:13'),
(111, 11, 'Đăng nhập', '2025-12-10 02:09:38'),
(112, 11, 'Đăng nhập', '2025-12-10 02:11:41'),
(113, 11, 'Đăng nhập', '2025-12-10 02:30:48'),
(114, 11, 'Đăng nhập', '2025-12-10 02:36:36'),
(115, 11, 'Đăng nhập', '2025-12-10 03:09:35'),
(116, 11, 'Đăng nhập', '2025-12-10 03:18:40'),
(117, 11, 'Đăng nhập', '2025-12-10 03:24:25'),
(118, 11, 'Đăng nhập', '2025-12-10 03:35:49'),
(119, 11, 'Đăng nhập', '2025-12-10 03:44:00'),
(120, 11, 'Đăng nhập', '2025-12-10 03:54:24'),
(121, 11, 'Đăng nhập', '2025-12-11 23:47:57'),
(122, 11, 'Đăng nhập', '2025-12-13 08:49:20'),
(123, 11, 'Đăng nhập', '2025-12-13 09:28:55'),
(124, 11, 'Đăng nhập', '2025-12-13 09:31:37'),
(125, 11, 'Đăng nhập', '2025-12-13 09:45:48'),
(126, 11, 'Đăng nhập', '2025-12-13 10:00:39'),
(127, 11, 'Đăng nhập', '2025-12-13 11:23:19'),
(128, 11, 'Đăng nhập', '2025-12-13 11:26:21'),
(129, 11, 'Đăng nhập', '2025-12-13 11:52:03'),
(130, 11, 'Đăng nhập', '2025-12-13 11:53:36'),
(131, 11, 'Đăng nhập', '2025-12-13 11:54:07'),
(132, 11, 'Đăng nhập', '2025-12-13 11:54:48'),
(133, 11, 'Đăng nhập', '2025-12-13 11:56:11'),
(134, 11, 'Đăng nhập', '2025-12-13 12:05:12'),
(135, 11, 'Đăng nhập', '2025-12-14 01:05:04'),
(136, 11, 'Đăng nhập', '2025-12-14 08:38:37'),
(137, 11, 'Đăng nhập', '2025-12-20 08:57:37'),
(138, 11, 'Đăng nhập', '2026-03-19 11:34:32'),
(139, 11, 'Đăng nhập', '2026-03-19 11:37:28');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'admin'),
(2, 'manager'),
(3, 'cashier'),
(4, 'kitchen'),
(5, 'guest');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role_id`, `full_name`, `phone_number`, `age`, `email`, `address`, `created_at`, `updated_at`) VALUES
(1, 'guest', 'guest', 5, 'Khách', '0123456789', 25, 'guest@restaurant.com', '123 Đường Khách, Quận 1, TP.HCM', '2025-04-15 07:03:41', '2025-04-15 07:03:41'),
(11, 'admin11', '$2b$10$pb0Aas7PNW8t34Z1bJPoS.C4yYET466X83tB2bVuUbJYQ2LiBHoau', 1, 'Dương Huy', '0792967973', 16, 'huy2114399@gmail.com', 'Copac Square', '2025-05-21 17:35:56', '2025-06-05 14:13:43'),
(12, 'kitchen', '$2b$10$7RdqzJvmQ9lyXVygTwFEFuuHYhcneyoeAwOhb/PRoetf5K9LUuS..', 3, 'Dương Văn Huy', '0792967973', 18, 'huy2114379@gmail.com', 'abc', '2025-05-21 17:37:38', '2025-05-21 19:30:05'),
(13, 'didi', '$2b$10$PGc0zGFG8Gx1nWNex.dbSuj20Se2cscTHZP1ZKUP7iUx2p58xflp6', 1, 'NguyenDat', '9445896547', 21, 'ndat50591@gmail.com', 'K8', '2025-06-02 16:15:52', '2025-06-02 16:15:52'),
(14, 'KoiThe', '$2b$10$4kongPv4PQ.zhac8.Mauj.U3vkcrysFeHOUOGFXxpkT2pcHMREUui', 1, 'NguyenDat', '9445896547', 21, 'ndat50591@gmail.com', NULL, '2025-06-02 21:06:03', '2025-06-02 21:06:03'),
(15, 'admin01', '$2b$10$RIRSP34Jr.0IZEShNgG4Ue2n65jb7qmpCgY2iA9PLlC0Z.FrMjBQm', 1, 'Nguyễn Văn Admin1', '0912340001', 45, 'admin1@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2025-06-04 23:31:06'),
(16, 'admin02', '$2b$10$r9.cJIslv3f7BnIkYnR3TuZn1umLulzwICEZqi385lw5Z6YNU47dO', 1, 'Nguyễn Văn Admin2', '0912340002', 38, 'admin2@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2025-06-04 23:31:19'),
(17, 'admin03', '$2a$10$Y8uUJC4URpNCn2646drr1u7AlyGaFnLRGnZd77KIZMz2PNk8b3PZu', 1, 'Nguyễn Văn Admin3', '0912340003', 29, 'admin3@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2026-03-26 03:47:07'),
(18, 'admin04', '123456', 1, 'Nguyễn Văn Admin4', '0912340004', 22, 'admin4@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(19, 'admin05', '123456', 1, 'Nguyễn Văn Admin5', '0912340005', 42, 'admin5@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(20, 'admin06', '123456', 1, 'Nguyễn Văn Admin6', '0912340006', 41, 'admin6@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(21, 'admin07', '123456', 1, 'Nguyễn Văn Admin7', '0912340007', 49, 'admin7@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(22, 'admin08', '123456', 1, 'Nguyễn Văn Admin8', '0912340008', 38, 'admin8@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(23, 'admin09', '123456', 1, 'Nguyễn Văn Admin9', '0912340009', 21, 'admin9@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(24, 'admin10', '123456', 1, 'Nguyễn Văn Admin10', '0912340010', 34, 'admin10@example.com', 'Hà Nội', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(25, 'chef01', '123456', 2, 'Trần Văn Bếp1', '0922340001', 29, 'chef1@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(26, 'chef02', '123456', 2, 'Trần Văn Bếp2', '0922340002', 40, 'chef2@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(27, 'chef03', '123456', 2, 'Trần Văn Bếp3', '0922340003', 33, 'chef3@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(28, 'chef04', '123456', 2, 'Trần Văn Bếp4', '0922340004', 31, 'chef4@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(29, 'chef05', '123456', 2, 'Trần Văn Bếp5', '0922340005', 40, 'chef5@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(30, 'chef06', '123456', 2, 'Trần Văn Bếp6', '0922340006', 49, 'chef6@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(31, 'chef07', '123456', 2, 'Trần Văn Bếp7', '0922340007', 41, 'chef7@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(32, 'chef08', '123456', 2, 'Trần Văn Bếp8', '0922340008', 27, 'chef8@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(33, 'chef09', '123456', 2, 'Trần Văn Bếp9', '0922340009', 20, 'chef9@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(34, 'chef10', '123456', 2, 'Trần Văn Bếp10', '0922340010', 27, 'chef10@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(35, 'chef11', '123456', 2, 'Trần Văn Bếp11', '0922340011', 44, 'chef11@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(36, 'chef12', '123456', 2, 'Trần Văn Bếp12', '0922340012', 42, 'chef12@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(37, 'chef13', '123456', 2, 'Trần Văn Bếp13', '0922340013', 40, 'chef13@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(38, 'chef14', '123456', 2, 'Trần Văn Bếp14', '0922340014', 30, 'chef14@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(39, 'chef15', '123456', 2, 'Trần Văn Bếp15', '0922340015', 25, 'chef15@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(40, 'chef16', '123456', 2, 'Trần Văn Bếp16', '0922340016', 37, 'chef16@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(41, 'chef17', '123456', 2, 'Trần Văn Bếp17', '0922340017', 38, 'chef17@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(42, 'chef18', '123456', 2, 'Trần Văn Bếp18', '0922340018', 23, 'chef18@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(43, 'chef19', '123456', 2, 'Trần Văn Bếp19', '0922340019', 45, 'chef19@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(44, 'chef20', '123456', 2, 'Trần Văn Bếp20', '0922340020', 43, 'chef20@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(45, 'chef21', '123456', 2, 'Trần Văn Bếp21', '0922340021', 50, 'chef21@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(46, 'chef22', '123456', 2, 'Trần Văn Bếp22', '0922340022', 50, 'chef22@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(47, 'chef23', '123456', 2, 'Trần Văn Bếp23', '0922340023', 42, 'chef23@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(48, 'chef24', '123456', 2, 'Trần Văn Bếp24', '0922340024', 40, 'chef24@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(49, 'chef25', '123456', 2, 'Trần Văn Bếp25', '0922340025', 28, 'chef25@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(50, 'chef26', '123456', 2, 'Trần Văn Bếp26', '0922340026', 26, 'chef26@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(51, 'chef27', '123456', 2, 'Trần Văn Bếp27', '0922340027', 20, 'chef27@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(52, 'chef28', '123456', 2, 'Trần Văn Bếp28', '0922340028', 24, 'chef28@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(53, 'chef29', '123456', 2, 'Trần Văn Bếp29', '0922340029', 38, 'chef29@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(54, 'chef30', '123456', 2, 'Trần Văn Bếp30', '0922340030', 20, 'chef30@example.com', 'TP Hồ Chí Minh', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(55, 'employee01', '123456', 3, 'Lê Thị Nhân Viên1', '0932340001', 29, 'employee1@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(56, 'employee02', '123456', 3, 'Lê Thị Nhân Viên2', '0932340002', 25, 'employee2@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(57, 'employee03', '123456', 3, 'Lê Thị Nhân Viên3', '0932340003', 26, 'employee3@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(58, 'employee04', '123456', 3, 'Lê Thị Nhân Viên4', '0932340004', 22, 'employee4@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(59, 'employee05', '123456', 3, 'Lê Thị Nhân Viên5', '0932340005', 48, 'employee5@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(60, 'employee06', '123456', 3, 'Lê Thị Nhân Viên6', '0932340006', 36, 'employee6@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(61, 'employee07', '123456', 3, 'Lê Thị Nhân Viên7', '0932340007', 38, 'employee7@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(62, 'employee08', '123456', 3, 'Lê Thị Nhân Viên8', '0932340008', 45, 'employee8@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(63, 'employee09', '123456', 3, 'Lê Thị Nhân Viên9', '0932340009', 27, 'employee9@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(64, 'employee10', '123456', 3, 'Lê Thị Nhân Viên10', '0932340010', 43, 'employee10@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(65, 'employee11', '123456', 3, 'Lê Thị Nhân Viên11', '0932340011', 50, 'employee11@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(66, 'employee12', '123456', 3, 'Lê Thị Nhân Viên12', '0932340012', 32, 'employee12@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(67, 'employee13', '123456', 3, 'Lê Thị Nhân Viên13', '0932340013', 26, 'employee13@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(68, 'employee14', '123456', 3, 'Lê Thị Nhân Viên14', '0932340014', 34, 'employee14@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(69, 'employee15', '123456', 3, 'Lê Thị Nhân Viên15', '0932340015', 32, 'employee15@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(70, 'employee16', '123456', 3, 'Lê Thị Nhân Viên16', '0932340016', 25, 'employee16@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(71, 'employee17', '123456', 3, 'Lê Thị Nhân Viên17', '0932340017', 43, 'employee17@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(72, 'employee18', '123456', 3, 'Lê Thị Nhân Viên18', '0932340018', 36, 'employee18@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(73, 'employee19', '123456', 3, 'Lê Thị Nhân Viên19', '0932340019', 50, 'employee19@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(74, 'employee20', '123456', 3, 'Lê Thị Nhân Viên20', '0932340020', 44, 'employee20@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(75, 'employee21', '123456', 3, 'Lê Thị Nhân Viên21', '0932340021', 39, 'employee21@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(76, 'employee22', '123456', 3, 'Lê Thị Nhân Viên22', '0932340022', 34, 'employee22@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(77, 'employee23', '123456', 3, 'Lê Thị Nhân Viên23', '0932340023', 41, 'employee23@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(78, 'employee24', '123456', 3, 'Lê Thị Nhân Viên24', '0932340024', 50, 'employee24@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(79, 'employee25', '123456', 3, 'Lê Thị Nhân Viên25', '0932340025', 26, 'employee25@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(80, 'employee26', '123456', 3, 'Lê Thị Nhân Viên26', '0932340026', 50, 'employee26@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(81, 'employee27', '123456', 3, 'Lê Thị Nhân Viên27', '0932340027', 22, 'employee27@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(82, 'employee28', '123456', 3, 'Lê Thị Nhân Viên28', '0932340028', 29, 'employee28@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(83, 'employee29', '123456', 3, 'Lê Thị Nhân Viên29', '0932340029', 30, 'employee29@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(84, 'employee30', '123456', 3, 'Lê Thị Nhân Viên30', '0932340030', 38, 'employee30@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(85, 'employee31', '123456', 3, 'Lê Thị Nhân Viên31', '0932340031', 23, 'employee31@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(86, 'employee32', '123456', 3, 'Lê Thị Nhân Viên32', '0932340032', 33, 'employee32@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(87, 'employee33', '123456', 3, 'Lê Thị Nhân Viên33', '0932340033', 46, 'employee33@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(88, 'employee34', '123456', 3, 'Lê Thị Nhân Viên34', '0932340034', 44, 'employee34@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(89, 'employee35', '123456', 3, 'Lê Thị Nhân Viên35', '0932340035', 25, 'employee35@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(90, 'employee36', '123456', 3, 'Lê Thị Nhân Viên36', '0932340036', 25, 'employee36@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(91, 'employee37', '123456', 3, 'Lê Thị Nhân Viên37', '0932340037', 47, 'employee37@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(92, 'employee38', '123456', 3, 'Lê Thị Nhân Viên38', '0932340038', 32, 'employee38@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(93, 'employee39', '123456', 3, 'Lê Thị Nhân Viên39', '0932340039', 30, 'employee39@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(94, 'employee40', '123456', 3, 'Lê Thị Nhân Viên40', '0932340040', 30, 'employee40@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(95, 'employee41', '123456', 3, 'Lê Thị Nhân Viên41', '0932340041', 37, 'employee41@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(96, 'employee42', '123456', 3, 'Lê Thị Nhân Viên42', '0932340042', 46, 'employee42@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(97, 'employee43', '123456', 3, 'Lê Thị Nhân Viên43', '0932340043', 26, 'employee43@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(98, 'employee44', '123456', 3, 'Lê Thị Nhân Viên44', '0932340044', 45, 'employee44@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(99, 'employee45', '123456', 3, 'Lê Thị Nhân Viên45', '0932340045', 31, 'employee45@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(100, 'employee46', '123456', 3, 'Lê Thị Nhân Viên46', '0932340046', 31, 'employee46@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(101, 'employee47', '123456', 3, 'Lê Thị Nhân Viên47', '0932340047', 24, 'employee47@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(102, 'employee48', '123456', 3, 'Lê Thị Nhân Viên48', '0932340048', 22, 'employee48@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(103, 'employee49', '123456', 3, 'Lê Thị Nhân Viên49', '0932340049', 21, 'employee49@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(104, 'employee50', '123456', 3, 'Lê Thị Nhân Viên50', '0932340050', 33, 'employee50@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(105, 'employee51', '123456', 3, 'Lê Thị Nhân Viên51', '0932340051', 47, 'employee51@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(106, 'employee52', '123456', 3, 'Lê Thị Nhân Viên52', '0932340052', 24, 'employee52@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(107, 'employee53', '123456', 3, 'Lê Thị Nhân Viên53', '0932340053', 20, 'employee53@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(108, 'employee54', '123456', 3, 'Lê Thị Nhân Viên54', '0932340054', 45, 'employee54@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(109, 'employee55', '123456', 3, 'Lê Thị Nhân Viên55', '0932340055', 45, 'employee55@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(110, 'employee56', '123456', 3, 'Lê Thị Nhân Viên56', '0932340056', 48, 'employee56@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(111, 'employee57', '123456', 3, 'Lê Thị Nhân Viên57', '0932340057', 39, 'employee57@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(112, 'employee58', '123456', 3, 'Lê Thị Nhân Viên58', '0932340058', 41, 'employee58@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(113, 'employee59', '123456', 3, 'Lê Thị Nhân Viên59', '0932340059', 42, 'employee59@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38'),
(114, 'employee60', '123456', 3, 'Lê Thị Nhân Viên60', '0932340060', 34, 'employee60@example.com', 'Đà Nẵng', '2025-06-04 23:23:38', '2025-06-04 23:23:38');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=140;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
