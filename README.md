# PO & Invoice App

Aplikasi manajemen Penawaran (Quotation) dan Invoice berbasis web menggunakan Node.js, Express, dan MySQL.

## 🚀 Fitur

- **Dashboard** - Statistik dan ringkasan aktivitas
- **Penawaran** - Buat, edit, lihat, dan kelola penawaran
- **Invoice** - Generate invoice otomatis dari penawaran yang diterima
- **Laporan Margin** - Analisis margin keuntungan
- **Master Data** - Kelola produk dan kategori
- **Login System** - Autentikasi dengan localStorage
- **Print** - Cetak penawaran dan invoice dengan desain profesional

## 📋 Teknologi

- **Frontend**: HTML5, CSS3, JavaScript, CoreUI 5.4.3
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Icons**: Font Awesome 6.0

## 🛠️ Instalasi

1. Clone repository ini
```bash
git clone https://github.com/[username]/po-invoice-app.git
cd po-invoice-app
```

2. Install dependencies
```bash
npm install
```

3. Setup database MySQL
   - Buat database `db_penawaran`
   - Database akan otomatis membuat tabel saat server pertama kali dijalankan

4. Jalankan server
```bash
node server.js
```

5. Buka browser dan akses
```
http://localhost:3000/login.html
```

## 🔑 Login

- **Username**: `admin`
- **Password**: `admin123`

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.0",
  "body-parser": "^1.20.2",
  "cors": "^2.8.5"
}
```

## 📁 Struktur Project

```
po-invoice-app/
├── template/           # CoreUI template files
├── app.js             # Frontend JavaScript
├── server.js          # Backend Express server
├── index.html         # Dashboard & main app
├── login.html         # Login page
├── style.css          # Custom styles
├── style_item_row.css # Item table styles
└── package.json       # NPM dependencies
```

## 🎯 Workflow

1. **Login** - User login dengan username/password
2. **Buat Penawaran** - Tambah client, item, dan total otomatis
3. **Accept Penawaran** - Generate invoice otomatis
4. **Print Invoice** - Cetak invoice dengan format profesional
5. **Mark as Paid** - Update status pembayaran

## 📱 Responsive Design

Aplikasi ini fully responsive dan dapat diakses dari:
- Desktop
- Tablet
- Mobile

## 📄 License

© 2025 PO & Invoice App. All rights reserved.

## 👨‍💻 Developer

Developed with ❤️ using CoreUI template
