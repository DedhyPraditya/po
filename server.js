const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from root
app.use('/node_modules', express.static(__dirname + '/node_modules')); // Serve node_modules

// Database Connection Configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: ''
};

// Create Connection (without database initially)
const db = mysql.createConnection(dbConfig);

// Initialize Database and Server
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL server:', err);
        return;
    }
    console.log('Connected to MySQL server');

    // 1. Create Database
    db.query('CREATE DATABASE IF NOT EXISTS db_penawaran', (err) => {
        if (err) {
            console.error('Error creating database:', err);
            return;
        }
        console.log('Database db_penawaran checked/created');

        // 2. Use Database
        db.changeUser({ database: 'db_penawaran' }, (err) => {
            if (err) {
                console.error('Error switching to database:', err);
                return;
            }
            console.log('Switched to database db_penawaran');

            // 3. Create Tables
            createTables();
        });
    });
});

function createTables() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS quotations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_name VARCHAR(255) NOT NULL,
            client_address TEXT,
            quotation_date DATE NOT NULL,
            status ENUM('draft', 'sent', 'accepted', 'rejected', 'invoiced') DEFAULT 'draft',
            total_amount DECIMAL(15, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS quotation_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_id INT NOT NULL,
            description VARCHAR(255) NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            unit VARCHAR(50) DEFAULT 'pcs',
            unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            cost_price DECIMAL(15, 2) DEFAULT 0.00,
            profit_margin DECIMAL(5, 2) DEFAULT 0.00,
            discount DECIMAL(15, 2) DEFAULT 0.00,
            total_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_id INT NOT NULL,
            invoice_number VARCHAR(50) UNIQUE NOT NULL,
            invoice_date DATE NOT NULL,
            due_date DATE,
            status ENUM('unpaid', 'paid', 'overdue') DEFAULT 'unpaid',
            total_amount DECIMAL(15, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quotation_id) REFERENCES quotations(id)
        )`,
        `CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        )`,
        `CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT,
            name VARCHAR(255) NOT NULL,
            unit VARCHAR(50) DEFAULT 'pcs',
            unit_price DECIMAL(15, 2) DEFAULT 0.00,
            cost_price DECIMAL(15, 2) DEFAULT 0.00,
            profit_margin DECIMAL(5, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )`
    ];

    // Helper to run queries sequentially
    const runQueries = async () => {
        try {
            for (const sql of tables) {
                await db.promise().query(sql);
            }
            console.log('Tables checked/created');
            await migrateTables();
            seedMasterData();
        } catch (err) {
            console.error('Error initializing database:', err);
        }
    };

    runQueries();
}

async function migrateTables() {
    // Migration to add columns - using standard syntax
    const migrations = [
        { sql: "ALTER TABLE products ADD COLUMN unit VARCHAR(50) DEFAULT 'pcs' AFTER name", desc: "Add unit to products" },
        { sql: "ALTER TABLE products ADD COLUMN cost_price DECIMAL(15, 2) DEFAULT 0.00 AFTER unit", desc: "Add cost_price to products" },
        { sql: "ALTER TABLE products ADD COLUMN profit_margin DECIMAL(5, 2) DEFAULT 0.00 AFTER cost_price", desc: "Add profit_margin to products" },
        { sql: "ALTER TABLE quotation_items ADD COLUMN unit VARCHAR(50) DEFAULT 'pcs' AFTER quantity", desc: "Add unit to quotation_items" },
        { sql: "ALTER TABLE quotation_items ADD COLUMN cost_price DECIMAL(15, 2) DEFAULT 0.00 AFTER unit_price", desc: "Add cost_price to quotation_items" },
        { sql: "ALTER TABLE quotation_items ADD COLUMN profit_margin DECIMAL(5, 2) DEFAULT 0.00 AFTER cost_price", desc: "Add profit_margin to quotation_items" },
        { sql: "ALTER TABLE quotation_items ADD COLUMN discount DECIMAL(15, 2) DEFAULT 0.00 AFTER profit_margin", desc: "Add discount to quotation_items" }
    ];

    for (const migration of migrations) {
        try {
            await db.promise().query(migration.sql);
            console.log(`✓ ${migration.desc}`);
        } catch (err) {
            // Ignore if column already exists (error 1060)
            if (err.errno !== 1060) {
                console.error(`✗ ${migration.desc}: ${err.message}`);
            }
        }
    }
    
    console.log('Database schema migrated');
}

async function seedMasterData() {
    try {
        const [categories] = await db.promise().query('SELECT COUNT(*) as count FROM categories');
        if (categories[0].count === 0) {
            console.log('Seeding master data...');
            
            const categoryData = [
                'Kamera CCTV', 'DVR / Recorder', 'Storage (Harddisk CCTV)', 
                'Power / Catu Daya', 'Connector', 'Kabel'
            ];

            for (const catName of categoryData) {
                const [result] = await db.promise().query('INSERT INTO categories (name) VALUES (?)', [catName]);
                const catId = result.insertId;

                // Seed products for this category
                const products = getProductsForCategory(catName);
                if (products.length > 0) {
                    const productValues = products.map(p => [catId, p.name, p.price]);
                    await db.promise().query('INSERT INTO products (category_id, name, unit_price) VALUES ?', [productValues]);
                }
            }
            console.log('Master data seeded successfully');
        }
        startServer();
    } catch (err) {
        console.error('Error seeding data:', err);
        startServer(); // Try to start anyway
    }
}

function getProductsForCategory(category) {
    const data = {
        'Kamera CCTV': [
            { name: 'Hilook Indoor THC-T120-PC (2.8mm)', price: 0 },
            { name: 'Hilook Outdoor THC-B120-PC (3.6mm)', price: 0 }
        ],
        'DVR / Recorder': [
            { name: 'Hilook DVR-204G-M1/T', price: 0 }
        ],
        'Storage (Harddisk CCTV)': [
            { name: 'Seagate Skyhawk 500GB', price: 0 }
        ],
        'Power / Catu Daya': [
            { name: 'Power Supply Switching DC 12V 10A + Box Regular', price: 0 },
            { name: 'DC Male (High Quality)', price: 0 }
        ],
        'Connector': [
            { name: 'BNC Drat RG6 Premium (High Quality)', price: 0 }
        ],
        'Kabel': [
            { name: 'HDMI Cable 1.5m', price: 0 },
            { name: 'Colan RG59 + Power (White)', price: 0 }
        ]
    };
    return data[category] || [];
}

function startServer() {
    // --- API Endpoints ---

    // Categories
    app.get('/api/categories', (req, res) => {
        db.query('SELECT * FROM categories ORDER BY name', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    app.post('/api/categories', (req, res) => {
        const { name } = req.body;
        db.query('INSERT INTO categories (name) VALUES (?)', [name], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, name });
        });
    });

    app.put('/api/categories/:id', (req, res) => {
        const { name } = req.body;
        db.query('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Category updated' });
        });
    });

    app.delete('/api/categories/:id', (req, res) => {
        db.query('DELETE FROM categories WHERE id = ?', [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Category deleted' });
        });
    });

    // Products
    app.get('/api/products', (req, res) => {
        const sql = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY c.name, p.name`;
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    app.post('/api/products', (req, res) => {
        const { category_id, name, unit, cost_price, profit_margin, unit_price } = req.body;
        db.query('INSERT INTO products (category_id, name, unit, cost_price, profit_margin, unit_price) VALUES (?, ?, ?, ?, ?, ?)', 
            [category_id, name, unit, cost_price, profit_margin, unit_price], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, message: 'Product created' });
        });
    });

    app.put('/api/products/:id', (req, res) => {
        const { category_id, name, unit, cost_price, profit_margin, unit_price } = req.body;
        db.query('UPDATE products SET category_id = ?, name = ?, unit = ?, cost_price = ?, profit_margin = ?, unit_price = ? WHERE id = ?', 
            [category_id, name, unit, cost_price, profit_margin, unit_price, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product updated' });
        });
    });

    app.delete('/api/products/:id', (req, res) => {
        db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product deleted' });
        });
    });

    // 1. Get All Quotations
    app.get('/api/quotations', (req, res) => {
        const sql = 'SELECT * FROM quotations ORDER BY created_at DESC';
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // 2. Create Quotation
    app.post('/api/quotations', (req, res) => {
        const { client_name, client_address, quotation_date, items } = req.body;
        
        // Calculate total
        let total_amount = 0;
        if (items && items.length > 0) {
            items.forEach(item => {
                total_amount += item.quantity * item.unit_price;
            });
        }

        const sqlQuotation = 'INSERT INTO quotations (client_name, client_address, quotation_date, total_amount) VALUES (?, ?, ?, ?)';
        
        db.beginTransaction(err => {
            if (err) return res.status(500).json({ error: err.message });

            db.query(sqlQuotation, [client_name, client_address, quotation_date, total_amount], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }

                const quotationId = result.insertId;

                if (!items || items.length === 0) {
                    return db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                        res.json({ message: 'Quotation created successfully', id: quotationId });
                    });
                }

                const sqlItems = 'INSERT INTO quotation_items (quotation_id, description, quantity, unit, cost_price, profit_margin, unit_price, discount, total_price) VALUES ?';
                const itemValues = items.map(item => [
                    quotationId, 
                    item.description, 
                    item.quantity, 
                    item.unit || 'pcs',
                    item.cost_price || 0,
                    item.profit_margin || 0,
                    item.unit_price, 
                    item.discount || 0,
                    (item.quantity * item.unit_price) - (item.discount || 0) // Total after discount
                ]);

                db.query(sqlItems, [itemValues], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }

                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }
                        res.json({ message: 'Quotation created successfully', id: quotationId });
                    });
                });
            });
        });
    });

    // 3. Get Quotation with Items
    app.get('/api/quotations/:id/details', (req, res) => {
        const sqlQuotation = 'SELECT * FROM quotations WHERE id = ?';
        const sqlItems = 'SELECT * FROM quotation_items WHERE quotation_id = ?';

        db.query(sqlQuotation, [req.params.id], (err, quotationResults) => {
            if (err) return res.status(500).json({ error: err.message });

            if (quotationResults.length === 0) return res.status(404).json({ error: 'Quotation not found' });

            const quotation = quotationResults[0];

            db.query(sqlItems, [req.params.id], (err, itemResults) => {
                if (err) return res.status(500).json({ error: err.message });

                quotation.items = itemResults;
                res.json(quotation);
            });
        });
    });

    // Also support without /details
    app.get('/api/quotations/:id', (req, res) => {
        const quotationId = req.params.id;
        const sqlQuotation = 'SELECT * FROM quotations WHERE id = ?';
        const sqlItems = 'SELECT * FROM quotation_items WHERE quotation_id = ?';

        db.query(sqlQuotation, [quotationId], (err, quotationResult) => {
            if (err) return res.status(500).json({ error: err.message });
            if (quotationResult.length === 0) return res.status(404).json({ message: 'Quotation not found' });

            db.query(sqlItems, [quotationId], (err, itemsResult) => {
                if (err) return res.status(500).json({ error: err.message });
                
                const quotation = quotationResult[0];
                quotation.items = itemsResult;
                res.json(quotation);
            });
        });
    });

    // 4. Delete Quotation
    app.delete('/api/quotations/:id', (req, res) => {
        const quotationId = req.params.id;
        // Items will be deleted automatically due to ON DELETE CASCADE
        db.query('DELETE FROM quotations WHERE id = ?', [quotationId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Quotation not found' });
            res.json({ message: 'Quotation deleted successfully' });
        });
    });

    // 5. Update Quotation
    app.put('/api/quotations/:id', (req, res) => {
        const quotationId = req.params.id;
        const { client_name, client_address, quotation_date, items } = req.body;
        
        // Calculate total
        let total_amount = 0;
        if (items && items.length > 0) {
            items.forEach(item => {
                total_amount += (item.quantity * item.unit_price) - (item.discount || 0);
            });
        }

        const sqlQuotation = 'UPDATE quotations SET client_name = ?, client_address = ?, quotation_date = ?, total_amount = ? WHERE id = ?';
        
        db.beginTransaction(err => {
            if (err) return res.status(500).json({ error: err.message });

            db.query(sqlQuotation, [client_name, client_address, quotation_date, total_amount, quotationId], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }

                if (result.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(404).json({ message: 'Quotation not found' });
                    });
                }

                // Delete old items
                db.query('DELETE FROM quotation_items WHERE quotation_id = ?', [quotationId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }

                    if (!items || items.length === 0) {
                        return db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                            res.json({ message: 'Quotation updated successfully', id: quotationId });
                        });
                    }

                    // Insert new items
                    const sqlItems = 'INSERT INTO quotation_items (quotation_id, description, quantity, unit, cost_price, profit_margin, unit_price, discount, total_price) VALUES ?';
                    const itemValues = items.map(item => [
                        quotationId,
                        item.description,
                        item.quantity,
                        item.unit || 'pcs',
                        item.cost_price || 0,
                        item.profit_margin || 0,
                        item.unit_price,
                        item.discount || 0,
                        (item.quantity * item.unit_price) - (item.discount || 0)
                    ]);

                    db.query(sqlItems, [itemValues], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }

                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: err.message });
                                });
                            }
                            res.json({ message: 'Quotation updated successfully', id: quotationId });
                        });
                    });
                });
            });
        });
    });

    // 6. Approve Quotation
    app.put('/api/quotations/:id/approve', (req, res) => {
        const quotationId = req.params.id;
        const sql = "UPDATE quotations SET status = 'accepted' WHERE id = ?";
        
        db.query(sql, [quotationId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Quotation approved' });
        });
    });
    
    // Update Quotation Status (untuk reject, reset, dll)
    app.patch('/api/quotations/:id/status', (req, res) => {
        const quotationId = req.params.id;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['draft', 'sent', 'accepted', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const sql = "UPDATE quotations SET status = ? WHERE id = ?";
        
        db.query(sql, [status, quotationId], (err, result) => {
            if (err) {
                console.error('Error updating quotation status:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Quotation not found' });
            }
            
            res.json({ message: 'Quotation status updated', status: status });
        });
    });

    // 5. Convert to Invoice
    app.post('/api/invoices/convert/:quotationId', (req, res) => {
        const quotationId = req.params.quotationId;
        
        // Check if quotation exists and is accepted
        const checkSql = "SELECT * FROM quotations WHERE id = ?";
        db.query(checkSql, [quotationId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ message: 'Quotation not found' });
            
            const quotation = results[0];
            if (quotation.status !== 'accepted') {
                return res.status(400).json({ message: 'Quotation must be accepted before converting to invoice' });
            }

            // Create Invoice
            const invoiceNumber = `INV-${Date.now()}`; // Simple invoice number generation
            const invoiceDate = new Date();
            const sqlInvoice = 'INSERT INTO invoices (quotation_id, invoice_number, invoice_date, total_amount) VALUES (?, ?, ?, ?)';

            db.query(sqlInvoice, [quotationId, invoiceNumber, invoiceDate, quotation.total_amount], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // Update quotation status to invoiced
                const updateQuotation = "UPDATE quotations SET status = 'invoiced' WHERE id = ?";
                db.query(updateQuotation, [quotationId], (err) => {
                    if (err) console.error('Failed to update quotation status:', err);
                });

                res.json({ message: 'Invoice created successfully', invoiceId: result.insertId });
            });
        });
    });

    // 6. Get All Invoices
    // 7. Get Margin Report per Quotation
    app.get('/api/reports/margins', (req, res) => {
        const sql = `
            SELECT q.id, q.client_name, q.quotation_date, q.total_amount,
                   IFNULL(SUM(qi.quantity * qi.cost_price), 0) AS total_cost
            FROM quotations q
            LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
            GROUP BY q.id
            ORDER BY q.client_name ASC`;
        db.query(sql, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const data = rows.map(r => {
                const margin = parseFloat(r.total_amount) - parseFloat(r.total_cost);
                const margin_percent = r.total_amount > 0 ? (margin / parseFloat(r.total_amount)) * 100 : 0;
                return {
                    id: r.id,
                    client_name: r.client_name,
                    quotation_date: r.quotation_date,
                    total_amount: parseFloat(r.total_amount),
                    total_cost: parseFloat(r.total_cost),
                    margin: margin,
                    margin_percent: parseFloat(margin_percent.toFixed(2))
                };
            });
            res.json(data);
        });
    });
    
    // Get All Invoices
    app.get('/api/invoices', (req, res) => {
        const sql = `
            SELECT i.*, q.client_name 
            FROM invoices i 
            JOIN quotations q ON i.quotation_id = q.id 
            ORDER BY i.created_at DESC
        `;
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
    
    // Create Invoice
    app.post('/api/invoices', (req, res) => {
        const { quotation_id, client_name, invoice_date, due_date, total_amount, status } = req.body;
        
        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}`;
        
        const sql = `INSERT INTO invoices 
            (quotation_id, invoice_number, invoice_date, due_date, total_amount, status) 
            VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.query(sql, [quotation_id, invoiceNumber, invoice_date, due_date, total_amount, status || 'unpaid'], 
            (err, result) => {
                if (err) {
                    console.error('Error creating invoice:', err);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ 
                    message: 'Invoice created successfully', 
                    invoiceId: result.insertId,
                    invoiceNumber: invoiceNumber
                });
            }
        );
    });
    
    // Update Invoice Status (PATCH)
    app.patch('/api/invoices/:id', (req, res) => {
        const invoiceId = req.params.id;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['unpaid', 'paid', 'overdue'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const sql = "UPDATE invoices SET status = ? WHERE id = ?";
        
        db.query(sql, [status, invoiceId], (err, result) => {
            if (err) {
                console.error('Error updating invoice status:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Invoice not found' });
            }
            
            res.json({ message: 'Invoice status updated', status: status });
        });
    });

    // Delete invoice by quotation_id
    app.delete('/api/invoices/by-quotation/:quotationId', (req, res) => {
        const quotationId = req.params.quotationId;
        
        const sql = "DELETE FROM invoices WHERE quotation_id = ?";
        
        db.query(sql, [quotationId], (err, result) => {
            if (err) {
                console.error('Error deleting invoice:', err);
                return res.status(500).json({ error: err.message });
            }
            
            res.json({ 
                message: 'Invoice deleted successfully', 
                deletedCount: result.affectedRows 
            });
        });
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
