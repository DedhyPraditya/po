-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table db_penawaran.categories
DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_penawaran.categories: ~6 rows (approximately)
DELETE FROM `categories`;
INSERT INTO `categories` (`id`, `name`) VALUES
	(5, 'Connector'),
	(2, 'DVR / Recorder'),
	(7, 'Jasa'),
	(6, 'Kabel'),
	(1, 'Kamera CCTV'),
	(4, 'Power / Catu Daya'),
	(3, 'Storage (Harddisk CCTV)');

-- Dumping structure for table db_penawaran.invoices
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quotation_id` int NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('unpaid','paid','overdue') DEFAULT 'unpaid',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `quotation_id` (`quotation_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_penawaran.invoices: ~0 rows (approximately)
DELETE FROM `invoices`;
INSERT INTO `invoices` (`id`, `quotation_id`, `invoice_number`, `invoice_date`, `due_date`, `status`, `total_amount`, `created_at`) VALUES
	(2, 3, 'INV-1764560181726', '2025-12-01', '2025-12-31', 'paid', 2829586.00, '2025-12-01 03:36:21');

-- Dumping structure for table db_penawaran.products
DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `unit` varchar(50) DEFAULT 'pcs',
  `cost_price` decimal(15,2) DEFAULT '0.00',
  `profit_margin` decimal(5,2) DEFAULT '0.00',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_penawaran.products: ~16 rows (approximately)
DELETE FROM `products`;
INSERT INTO `products` (`id`, `category_id`, `name`, `unit`, `cost_price`, `profit_margin`, `unit_price`, `created_at`) VALUES
	(1, 1, 'Hilook Indoor THC-T120-PC (2.8mm)', 'Unit', 154500.00, 15.00, 181765.00, '2025-11-29 14:49:26'),
	(2, 1, 'Hilook Outdoor THC-B120-PC (3.6mm)', 'Unit', 163000.00, 15.00, 191765.00, '2025-11-29 14:49:26'),
	(3, 2, 'Hilook DVR-204G-M1/T', 'Unit', 519500.00, 15.00, 611176.00, '2025-11-29 14:49:26'),
	(4, 3, 'HDD Seagate Skyhawk 500GB', 'Unit', 205000.00, 15.00, 241176.00, '2025-11-29 14:49:26'),
	(5, 4, 'Power Supply Switching DC 12V 10A + Box Regular', 'Unit', 160000.00, 15.00, 188235.00, '2025-11-29 14:49:26'),
	(6, 4, 'DC Male (High Quality)', 'pcs', 1500.00, 15.00, 1765.00, '2025-11-29 14:49:26'),
	(7, 5, 'BNC Drat RG6 Premium (High Quality)', 'pcs', 3500.00, 15.00, 4118.00, '2025-11-29 14:49:26'),
	(8, 6, 'HDMI Cable 1.5m', 'Unit', 10000.00, 15.00, 11765.00, '2025-11-29 14:49:26'),
	(9, 6, 'Colan RG59 + Power (White)', 'Meter', 3500.00, 15.00, 4118.00, '2025-11-29 14:49:26'),
	(10, 7, 'Jasa Instalasi + Setting', 'Titik', 150000.00, 50.00, 300000.00, '2025-11-29 16:53:12'),
	(11, 1, 'Dahua DH-HAC-T1A21-U (indoor)', 'Unit', 166250.00, 5.00, 175000.00, '2025-11-30 05:59:38'),
	(12, 1, 'Dahua DH-HAC-B1A21-U (outdoor)', 'Unit', 178125.00, 5.00, 187500.00, '2025-11-30 06:00:18'),
	(13, 2, 'Dahua DH-XVR1B08-I (8Ch)', 'Unit', 710000.00, 10.00, 788889.00, '2025-11-30 06:04:36'),
	(14, 3, 'HDD 4TB Hikvision', 'Unit', 2300000.00, 15.00, 2705882.00, '2025-11-30 06:05:10'),
	(15, 6, 'Kabel CCTV outdoor RG59 / 100 meter', 'Roll', 270000.00, 20.00, 337500.00, '2025-11-30 06:06:46'),
	(16, 6, 'M-Tech HDMI CBL 1,5 M', 'Pcs', 23000.00, 20.00, 28750.00, '2025-11-30 06:14:55'),
	(17, 2, 'Mouse Logitech M170', 'Unit', 169000.00, 20.00, 211250.00, '2025-11-30 06:18:45');

-- Dumping structure for table db_penawaran.quotations
DROP TABLE IF EXISTS `quotations`;
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_name` varchar(255) NOT NULL,
  `client_address` text,
  `quotation_date` date NOT NULL,
  `status` enum('draft','sent','accepted','rejected','invoiced') DEFAULT 'draft',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_penawaran.quotations: ~3 rows (approximately)
DELETE FROM `quotations`;
INSERT INTO `quotations` (`id`, `client_name`, `client_address`, `quotation_date`, `status`, `total_amount`, `created_at`) VALUES
	(1, 'Rusnaini, SH, MKn', 'JL . RS Faisal 12 nomor 7 ( KTR Notaris Rusnaini)', '2025-11-30', 'rejected', 1211784.00, '2025-11-29 16:21:54'),
	(2, 'TV SHOP (DAHUA)', 'Pak Nizar ( +62 853-9831-6333‬)\nPT. Belanja mesin suksesindo \njl. Tol lama. Pergudangan ir sutami blk H. No. 1. Parangloe, Kec. Tamalanrea. Kota makassar', '2025-11-12', 'draft', 6866029.00, '2025-11-30 06:13:31'),
	(3, 'TV SHOP (Hilook)', 'Subhan\nALAMAT : Jalan sunu 2 no 10 makassar\nNO HP ; 081355323038/‪+62 887-0584-9134‬\nPAKET CCTV ; 4 kamera. 1 outdoor dan 3 indoor', '2025-11-29', 'accepted', 2829586.00, '2025-11-30 13:15:48');

-- Dumping structure for table db_penawaran.quotation_items
DROP TABLE IF EXISTS `quotation_items`;
CREATE TABLE IF NOT EXISTS `quotation_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quotation_id` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit` varchar(50) DEFAULT 'pcs',
  `unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `cost_price` decimal(15,2) DEFAULT '0.00',
  `profit_margin` decimal(5,2) DEFAULT '0.00',
  `discount` decimal(15,2) DEFAULT '0.00',
  `total_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  CONSTRAINT `quotation_items_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=196 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_penawaran.quotation_items: ~28 rows (approximately)
DELETE FROM `quotation_items`;
INSERT INTO `quotation_items` (`id`, `quotation_id`, `description`, `quantity`, `unit`, `unit_price`, `cost_price`, `profit_margin`, `discount`, `total_price`) VALUES
	(1, 1, 'Hilook Indoor THC-T120-PC (2.8mm)', 2, 'Unit', 181765.00, 154500.00, 15.00, 0.00, 363530.00),
	(2, 1, 'Hilook Outdoor THC-B120-PC (3.6mm)', 1, 'Unit', 191765.00, 163000.00, 15.00, 0.00, 191765.00),
	(3, 1, 'Seagate Skyhawk 500GB', 1, 'Unit', 241176.00, 205000.00, 15.00, 0.00, 241176.00),
	(4, 1, 'Power Supply Switching DC 12V 10A + Box Regular', 1, 'Unit', 188235.00, 160000.00, 15.00, 0.00, 188235.00),
	(5, 1, 'BNC Drat RG6 Premium (High Quality)', 6, 'pcs', 4118.00, 3500.00, 15.00, 0.00, 24708.00),
	(6, 1, 'DC Male (High Quality)', 3, 'pcs', 1765.00, 1500.00, 15.00, 0.00, 5295.00),
	(7, 1, 'HDMI Cable 1.5m', 1, 'Unit', 11765.00, 10000.00, 15.00, 0.00, 11765.00),
	(8, 1, 'Colan RG59 + Power (White)', 45, 'Meter', 4118.00, 3500.00, 15.00, 0.00, 185310.00),
	(126, 3, 'Hilook Indoor THC-T120-PC (2.8mm)', 3, 'Unit', 181765.00, 154500.00, 15.00, 0.00, 545295.00),
	(127, 3, 'Hilook Outdoor THC-B120-PC (3.6mm)', 1, 'Unit', 191765.00, 163000.00, 15.00, 0.00, 191765.00),
	(128, 3, 'Hilook DVR-204G-M1/T', 1, 'Unit', 649375.00, 519500.00, 15.00, 0.00, 649375.00),
	(129, 3, 'HDD Seagate Skyhawk 500GB', 1, 'Unit', 241176.00, 205000.00, 15.00, 0.00, 241176.00),
	(130, 3, 'Power Supply Switching DC 12V 10A + Box Regular', 1, 'Unit', 193125.00, 160000.00, 15.00, 0.00, 193125.00),
	(131, 3, 'BNC Drat RG6 Premium (High Quality)', 10, 'pcs', 4118.00, 3500.00, 15.00, 0.00, 41180.00),
	(132, 3, 'DC Male (High Quality)', 5, 'pcs', 1765.00, 1500.00, 15.00, 0.00, 8825.00),
	(133, 3, 'HDMI Cable 1.5m', 1, 'Unit', 11765.00, 10000.00, 15.00, 0.00, 11765.00),
	(134, 3, 'Colan RG59 + Power (White)', 60, 'Meter', 4118.00, 3500.00, 15.00, 0.00, 247080.00),
	(135, 3, 'Jasa Instalasi + Setting', 4, 'Titik', 175000.00, 150000.00, 50.00, 0.00, 700000.00),
	(186, 2, 'Dahua DH-HAC-B1A21-U (outdoor)', 6, 'Unit', 187500.00, 178125.00, 5.00, 0.00, 1125000.00),
	(187, 2, 'Dahua DH-HAC-T1A21-U (indoor)', 2, 'Unit', 175000.00, 166250.00, 5.00, 0.00, 350000.00),
	(188, 2, 'BNC Drat RG6 Premium (High Quality)', 16, 'pcs', 4118.00, 3500.00, 15.00, 0.00, 65888.00),
	(189, 2, 'DC Male (High Quality)', 8, 'pcs', 1765.00, 1500.00, 15.00, 0.00, 14120.00),
	(190, 2, 'Kabel CCTV outdoor RG59 / 120 meter', 1, 'Roll', 337500.00, 270000.00, 20.00, 0.00, 337500.00),
	(191, 2, 'M-Tech HDMI CBL 1,5 M', 1, 'Pcs', 28750.00, 23000.00, 20.00, 0.00, 28750.00),
	(192, 2, 'Material support', 1, 'Lot', 50000.00, 0.00, 0.00, 0.00, 50000.00),
	(193, 2, 'DVR 8CH decoder', 1, 'Unit', 788889.00, 710000.00, 10.00, 0.00, 788889.00),
	(194, 2, 'HDD 4TB Hikvision', 1, 'Unit', 2705882.00, 2300000.00, 15.00, 0.00, 2705882.00),
	(195, 2, 'Jasa Instalasi + Setting', 8, 'Titik', 175000.00, 150000.00, 50.00, 0.00, 1400000.00);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
