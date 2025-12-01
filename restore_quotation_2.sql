-- SQL untuk memulihkan Penawaran #2
-- Jalankan di phpMyAdmin atau MySQL Workbench

USE db_penawaran;

-- Hapus data lama (jika ada)
DELETE FROM quotation_items WHERE quotation_id = 2;
DELETE FROM quotations WHERE quotation_id = 2;

-- Insert Quotation #2
INSERT INTO quotations (quotation_id, client_name, client_address, quotation_date, total_amount, status, created_at)
VALUES (2, 'PT. Customer CCTV', '', '2024-12-01', 6897655, 'draft', NOW());

-- Insert Items (10 items)
INSERT INTO quotation_items (quotation_id, description, quantity, unit, unit_price, discount, total) VALUES
(2, 'Dahua DH-HAC-B1A21-U', 2, 'Unit', 187500.00, 0.00, 375000.00),
(2, 'Dahua DH-HAC-T1A21-U', 6, 'Unit', 175000.00, 0.00, 1050000.00),
(2, 'BNC Drat RG6 Premium (High Quality)', 16, 'pcs', 4118.00, 0.00, 65888.00),
(2, 'DC Male (High Quality)', 8, 'pcs', 1765.00, 0.00, 14120.00),
(2, 'Kabel CCTV outdoor RG59 / 120 meter', 1, 'Roll', 337500.00, 0.00, 337500.00),
(2, 'HDMI Cable 1.5m', 1, 'Unit', 11765.00, 0.00, 11765.00),
(2, 'Jasa Instalasi + Setting', 8, 'Titik', 175000.00, 0.00, 1400000.00),
(2, 'Materal Support', 1, 'Lot', 50000.00, 0.00, 50000.00),
(2, 'DVR 8CH decoder', 1, 'Unit', 887500.00, 0.00, 887500.00),
(2, 'HDD 4TB', 1, 'Unit', 2705882.00, 0, 2705882);

-- Verifikasi hasil
SELECT 
    q.quotation_id,
    q.client_name,
    q.quotation_date,
    COUNT(qi.item_id) as total_items,
    q.total_amount
FROM quotations q
LEFT JOIN quotation_items qi ON q.quotation_id = qi.quotation_id
WHERE q.quotation_id = 2
GROUP BY q.quotation_id;
