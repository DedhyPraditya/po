# Perbandingan Database vs Form

## ✅ Tabel `products`
**Kolom Database:**
- id
- category_id
- name
- unit ✅
- cost_price ✅
- profit_margin ✅
- unit_price ✅
- created_at

**Form Fields (index.html):**
- category_id ✅
- product_name → name ✅
- product_unit → unit ✅
- product_cost_price → cost_price ✅
- product_profit_margin → profit_margin ✅
- product_price → unit_price ✅

**Status:** ✅ SESUAI

---

## ✅ Tabel `quotation_items`
**Kolom Database (UPDATED):**
- id
- quotation_id
- description ✅
- quantity ✅
- unit ✅
- cost_price ✅
- profit_margin ✅ (BARU DITAMBAHKAN)
- unit_price ✅
- discount ✅
- total_price ✅

**Form Fields (item-row di app.js):**
- item_description → description ✅
- item_quantity → quantity ✅
- item_unit → unit ✅
- item_cost_price → cost_price ✅
- item_profit_margin → profit_margin ✅
- item_price → unit_price ✅
- item_discount → discount ✅
- item_total → total_price ✅

**Status:** ✅ SESUAI (setelah update)

---

## Backend API Handlers

### POST /api/products ✅
Menerima: category_id, name, unit, cost_price, profit_margin, unit_price

### PUT /api/products/:id ✅
Menerima: category_id, name, unit, cost_price, profit_margin, unit_price

### POST /api/quotations ✅
Items menerima: description, quantity, unit, cost_price, profit_margin, unit_price, discount

---

## Kesimpulan
**SEMUA SUDAH SESUAI** ✅ setelah menambahkan kolom `profit_margin` ke tabel `quotation_items`.

Restart server untuk apply perubahan database.
