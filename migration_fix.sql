-- Manual Migration Script untuk menambahkan kolom yang hilang

-- 1. Tambah kolom ke tabel products
ALTER TABLE products ADD COLUMN unit VARCHAR(50) DEFAULT 'pcs' AFTER name;
ALTER TABLE products ADD COLUMN cost_price DECIMAL(15,2) DEFAULT 0.00 AFTER unit;
ALTER TABLE products ADD COLUMN profit_margin DECIMAL(5,2) DEFAULT 0.00 AFTER cost_price;

-- 2. Tambah kolom ke tabel quotation_items
ALTER TABLE quotation_items ADD COLUMN unit VARCHAR(50) DEFAULT 'pcs' AFTER quantity;
ALTER TABLE quotation_items ADD COLUMN cost_price DECIMAL(15,2) DEFAULT 0.00 AFTER unit_price;
ALTER TABLE quotation_items ADD COLUMN profit_margin DECIMAL(5,2) DEFAULT 0.00 AFTER cost_price;
ALTER TABLE quotation_items ADD COLUMN discount DECIMAL(15,2) DEFAULT 0.00 AFTER profit_margin;

-- Verifikasi
SELECT 'Products columns:' AS '';
DESCRIBE products;

SELECT 'Quotation_items columns:' AS '';
DESCRIBE quotation_items;
