const API_URL = 'http://localhost:3000/api';

// DOM Elements
const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
const tabContents = document.querySelectorAll('.tab-content');

// Modal Elements (using CoreUI/Bootstrap API)
const modalQuotationEl = document.getElementById('modal-quotation');
const modalCategoryEl = document.getElementById('modal-category');
const modalProductEl = document.getElementById('modal-product');

const modalQuotation = new coreui.Modal(modalQuotationEl);
const modalCategory = new coreui.Modal(modalCategoryEl);
const modalProduct = new coreui.Modal(modalProductEl);

// Buttons
const btnNewQuotation = document.getElementById('btn-new-quotation');
const btnNewCategory = document.getElementById('btn-new-category');
const btnNewProduct = document.getElementById('btn-new-product');
const btnAddItem = document.getElementById('btn-add-item');

// Forms
const formQuotation = document.getElementById('form-quotation');
const formCategory = document.getElementById('form-category');
const formProduct = document.getElementById('form-product');

// Tables
const quotationsTableBody = document.querySelector('#quotations-table');
const invoicesTableBody = document.querySelector('#invoices-table');
const categoriesTableBody = document.querySelector('#categories-table');
const productsTableBody = document.querySelector('#products-table');
const productCategorySelect = document.getElementById('product-category-select');
const itemsContainer = document.getElementById('items-container');

// State
let currentTab = 'dashboard';
let products = []; 
let categories = [];
let editingCategoryId = null;
let editingProductId = null;

// Navigation Logic
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        // Add active class to clicked link
        link.classList.add('active');
        
        // Hide all tabs
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Show target tab
        const targetId = link.dataset.tab;
        document.getElementById(targetId).classList.add('active');
        
        currentTab = targetId;
        loadData();
    });
});

formCategory.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = formCategory.category_name.value;
    const method = editingCategoryId ? 'PUT' : 'POST';
    const url = editingCategoryId ? `${API_URL}/categories/${editingCategoryId}` : `${API_URL}/categories`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (response.ok) {
            modalCategory.hide();
            loadCategories();
            alert(editingCategoryId ? 'Kategori diperbarui' : 'Kategori ditambahkan');
        }
    } catch (error) {
        console.error(error);
    }
});

formQuotation.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const items = [];
    // Support both table rows (edit mode) and div rows (create mode)
    const itemRows = document.querySelectorAll('#items-tbody tr, .item-row');
    
    itemRows.forEach(row => {
        const description = row.querySelector('[name="item_description"]');
        const quantity = row.querySelector('[name="item_quantity"]');
        const unit = row.querySelector('[name="item_unit"]');
        const price = row.querySelector('[name="item_price"]');
        const costPrice = row.querySelector('[name="item_cost_price"]');
        const profitMargin = row.querySelector('[name="item_profit_margin"]');
        const discount = row.querySelector('[name="item_discount"]');
        const total = row.querySelector('[name="item_total"]');
        
        // Only add if has values
        if (description && description.value) {
            // Remove thousand separator and convert to number
            const totalValue = total.value.replace(/\./g, '');
            
            items.push({
                description: description.value,
                quantity: quantity.value,
                unit: unit.value,
                unit_price: price.value,
                cost_price: costPrice.value || 0,
                profit_margin: profitMargin.value || 0,
                discount: discount.value || 0,
                total_price: totalValue
            });
        }
    });
    
    if (items.length === 0) {
        alert('Minimal harus ada 1 item dalam penawaran');
        return;
    }

    const payload = {
        client_name: formQuotation.client_name.value,
        client_address: formQuotation.client_address.value,
        quotation_date: formQuotation.quotation_date.value,
        items: items
    };
    
    console.log('Saving quotation with payload:', payload);

    try {
        let response;
        if (editingQuotationId) {
            console.log('Updating quotation ID:', editingQuotationId);
            // Update existing quotation
            response = await fetch(`${API_URL}/quotations/${editingQuotationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            console.log('Creating new quotation');
            // Create new quotation
            response = await fetch(`${API_URL}/quotations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            const result = await response.json();
            console.log('Save successful:', result);
            modalQuotation.hide();
            formQuotation.reset();
            itemsContainer.innerHTML = '';
            loadQuotations();
            loadDashboardStats();
            alert(editingQuotationId ? 'Penawaran berhasil diperbarui' : 'Penawaran berhasil dibuat');
            editingQuotationId = null; // Reset editing mode
        } else {
            const error = await response.json();
            console.error('Save failed:', error);
            alert('Gagal menyimpan penawaran: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving quotation:', error);
        alert('Terjadi kesalahan saat menyimpan penawaran');
    }
});

// Functions
function addItemRow() {
    // Create table if not exists
    if (!itemsContainer.querySelector('table')) {
        itemsContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-bordered table-sm align-middle" id="items-table">
                    <thead class="table-light">
                        <tr>
                            <th style="min-width: 250px;">Deskripsi Item / Produk</th>
                            <th style="width: 80px;">Qty</th>
                            <th style="width: 100px;">Satuan</th>
                            <th style="width: 140px;">Harga Satuan</th>
                            <th style="width: 120px;">Diskon</th>
                            <th style="width: 150px;">Total</th>
                            <th style="width: 60px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="items-tbody">
                    </tbody>
                </table>
            </div>
        `;
    }
    
    const tbody = document.getElementById('items-tbody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>
            <input type="text" class="form-control form-control-sm" name="item_description" placeholder="Deskripsi item atau pilih produk" list="product-list" onchange="fillProductPrice(this)" required>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm text-center" name="item_quantity" placeholder="1" min="1" value="1" onchange="calculateTotal(this)" required>
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="item_unit" placeholder="Unit" required>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm text-end" name="item_price" placeholder="0.00" min="0" step="0.01" onchange="calculateTotal(this)" required>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm text-end" name="item_discount" placeholder="0.00" min="0" value="0" onchange="calculateTotal(this)">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm text-end fw-semibold bg-light" name="item_total" value="0" readonly>
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-danger btn-sm" onclick="removeItemRow(this)">
                <i class="fas fa-trash"></i>
            </button>
        </td>
        <input type="hidden" name="item_cost_price" value="0">
        <input type="hidden" name="item_profit_margin" value="0">
    `;
    
    tbody.appendChild(row);
}

window.removeItemRow = (btn) => {
    btn.closest('tr').remove();
    updateGrandTotal();
};

window.fillProductPrice = (input) => {
    const productName = input.value;
    const product = products.find(p => p.name === productName);
    if (product) {
        const row = input.closest('tr');
        row.querySelector('[name="item_unit"]').value = product.unit || 'pcs';
        row.querySelector('[name="item_price"]').value = product.unit_price;
        // Populate hidden fields for backend
        row.querySelector('[name="item_cost_price"]').value = product.cost_price || 0;
        row.querySelector('[name="item_profit_margin"]').value = product.profit_margin || 0;
        calculateTotal(input);
    }
};

window.calculateTotal = (input) => {
    const row = input.closest('tr');
    const qty = parseFloat(row.querySelector('[name="item_quantity"]').value) || 0;
    const price = parseFloat(row.querySelector('[name="item_price"]').value) || 0;
    const discount = parseFloat(row.querySelector('[name="item_discount"]').value) || 0;
    
    const total = (qty * price) - discount;
    row.querySelector('[name="item_total"]').value = Math.round(total).toLocaleString('id-ID');

    updateGrandTotal();
};

function updateGrandTotal() {
    let totalAmount = 0;
    
    document.querySelectorAll('#items-tbody tr').forEach(row => {
        const totalText = row.querySelector('[name="item_total"]').value.replace(/\./g, '');
        const total = parseFloat(totalText) || 0;
        totalAmount += total;
    });
    
    document.getElementById('quotation-total').textContent = `Rp ${Math.round(totalAmount).toLocaleString('id-ID')}`;
}

async function loadData() {
    if (currentTab === 'dashboard') {
        loadDashboardStats();
    } else if (currentTab === 'quotations') {
        loadQuotations();
    } else if (currentTab === 'invoices') {
        loadInvoices();
    } else if (currentTab === 'master-data') {
        loadCategories();
        loadProducts();
    } else if (currentTab === 'margin-report') {
        loadMarginReport();
    }
}

async function loadDashboardStats() {
    try {
        // Fetch counts (simple implementation: fetch all and count)
        const [quotations, invoices, products] = await Promise.all([
            fetch(`${API_URL}/quotations`).then(r => r.json()),
            fetch(`${API_URL}/invoices`).then(r => r.json()),
            fetch(`${API_URL}/products`).then(r => r.json())
        ]);

        document.getElementById('stat-quotations').textContent = quotations.length;
        document.getElementById('stat-invoices').textContent = invoices.length;
        document.getElementById('stat-products').textContent = products.length;

        const revenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
        document.getElementById('stat-revenue').textContent = `Rp ${Math.round(revenue).toLocaleString('id-ID')}`;

        // Calculate estimated revenue from total margin in quotation items
        let totalMargin = 0;
        for (const quotation of quotations) {
            const details = await fetch(`${API_URL}/quotations/${quotation.id}/details`).then(r => r.json());
            console.log(`Quotation ID: ${quotation.id}, Items:`, details.items); // Debug log
            totalMargin += details.items.reduce((sum, item) => sum + parseFloat(item.profit_margin || 0), 0);
        }
        console.log(`Total Margin: ${totalMargin}`); // Debug log
        document.getElementById('stat-estimated-revenue').textContent = `Rp ${Math.round(totalMargin).toLocaleString('id-ID')}`;

        // Update Ringkasan Bulan Ini
        const draftCount = quotations.filter(q => q.status === 'draft').length;
        const sentCount = quotations.filter(q => q.status === 'sent').length;
        const acceptedCount = quotations.filter(q => q.status === 'accepted').length;
        const unpaidCount = invoices.filter(inv => inv.status === 'unpaid').length;
        const paidCount = invoices.filter(inv => inv.status === 'paid').length;
        
        const totalQuotations = quotations.length || 1; // Avoid division by zero
        const totalInvoices = invoices.length || 1;
        
        document.getElementById('summary-draft').textContent = draftCount;
        document.getElementById('summary-sent').textContent = sentCount;
        document.getElementById('summary-accepted').textContent = acceptedCount;
        document.getElementById('summary-unpaid').textContent = unpaidCount;
        document.getElementById('summary-paid').textContent = paidCount;
        
        // Update progress bars
        document.getElementById('progress-draft').style.width = `${(draftCount/totalQuotations)*100}%`;
        document.getElementById('progress-sent').style.width = `${(sentCount/totalQuotations)*100}%`;
        document.getElementById('progress-accepted').style.width = `${(acceptedCount/totalQuotations)*100}%`;
        document.getElementById('progress-unpaid').style.width = `${(unpaidCount/totalInvoices)*100}%`;
        document.getElementById('progress-paid').style.width = `${(paidCount/totalInvoices)*100}%`;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        categories = await response.json();
        renderCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function renderCategories(data) {
    categoriesTableBody.innerHTML = data.map(c => `
        <tr>
            <td class="d-flex justify-content-between align-items-center">
                ${c.name}
                <div>
                    <button onclick="editCategory(${c.id}, '${c.name}')" class="btn btn-sm btn-info text-white me-1"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteCategory(${c.id})" class="btn btn-sm btn-danger text-white"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderCategoryOptions() {
    productCategorySelect.innerHTML = categories.map(c => `
        <option value="${c.id}">${c.name}</option>
    `).join('');
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        products = await response.json();
        renderProducts(products);
        
        // Update datalist
        let datalist = document.getElementById('product-list');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'product-list';
            document.body.appendChild(datalist);
        }
        datalist.innerHTML = products.map(p => `<option value="${p.name}">`).join('');

        // Setup filtering
        setupProductFiltering();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Add filtering functionality for products
function setupProductFiltering() {
    const filterInput = document.getElementById('product-filter');
    if (!filterInput) return; // Guard if element doesn't exist
    
    filterInput.addEventListener('input', () => {
        const filterValue = filterInput.value.toLowerCase();
        const rows = document.querySelectorAll('#products-table tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                const productName = cells[1]?.textContent.toLowerCase() || '';
                const categoryName = cells[0]?.textContent.toLowerCase() || '';

                if (productName.includes(filterValue) || categoryName.includes(filterValue)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    });
}

function renderProducts(data) {
    productsTableBody.innerHTML = data.map(p => `
        <tr>
            <td>${p.category_name || '-'}</td>
            <td>${p.name}</td>
            <td>${p.unit || '-'}</td>
            <td>Rp ${Math.round(parseFloat(p.cost_price || 0)).toLocaleString('id-ID')}</td>
            <td>Rp ${Math.round(parseFloat(p.unit_price)).toLocaleString('id-ID')}</td>
            <td>
                <button onclick="editProduct(${p.id}, ${p.category_id}, '${p.name}', '${p.unit || ''}', ${p.cost_price || 0}, ${p.profit_margin || 0}, ${p.unit_price})" class="btn btn-sm btn-info text-white me-1"><i class="fas fa-edit"></i></button>
                <button onclick="deleteProduct(${p.id})" class="btn btn-sm btn-danger text-white"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// ... (existing code)

window.editProduct = (id, catId, name, unit, cost, price) => {
    editingProductId = id;
    renderCategoryOptions(); // Ensure options are loaded
    formProduct.category_id.value = catId;
    formProduct.product_name.value = name;
    formProduct.product_unit.value = unit;
    formProduct.product_cost_price.value = cost;
    formProduct.product_price.value = price;
    document.querySelector('#modal-product .modal-title').textContent = 'Edit Produk';
    modalProduct.show();
};

// ... (existing code)

// Product Form Auto-Calculation
const inputCost = formProduct.product_cost_price;
const inputMargin = formProduct.product_profit_margin;
const inputPrice = formProduct.product_price;

function calculateSellingPrice() {
    const cost = parseFloat(inputCost.value) || 0;
    const margin = parseFloat(inputMargin.value) || 0;
    
    if (cost > 0 && margin < 100) {
        // Formula: Price = Cost / (1 - Margin%)
        const price = cost / (1 - (margin / 100));
        inputPrice.value = Math.round(price); // Round to nearest integer
    }
}

inputCost.addEventListener('input', calculateSellingPrice);
inputMargin.addEventListener('input', calculateSellingPrice);

formProduct.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        category_id: formProduct.category_id.value,
        name: formProduct.product_name.value,
        unit: formProduct.product_unit.value,
        cost_price: formProduct.product_cost_price.value,
        profit_margin: formProduct.product_profit_margin.value,
        unit_price: formProduct.product_price.value
    };
    const method = editingProductId ? 'PUT' : 'POST';
    const url = editingProductId ? `${API_URL}/products/${editingProductId}` : `${API_URL}/products`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            modalProduct.hide();
            loadProducts();
            alert(editingProductId ? 'Produk diperbarui' : 'Produk ditambahkan');
            editingProductId = null; // Reset after save
        }
    } catch (error) {
        console.error(error);
    }
});

// Modal event listeners
btnNewProduct.addEventListener('click', () => {
    editingProductId = null;
    formProduct.reset();
    renderCategoryOptions();
    document.querySelector('#modal-product .modal-title').textContent = 'Tambah Produk';
    modalProduct.show();
});

btnNewCategory.addEventListener('click', () => {
    editingCategoryId = null;
    formCategory.reset();
    document.querySelector('#modal-category .modal-title').textContent = 'Tambah Kategori';
    modalCategory.show();
});

btnNewQuotation.addEventListener('click', () => {
    editingQuotationId = null; // Reset editing mode
    formQuotation.reset();
    itemsContainer.innerHTML = '';
    addItemRow(); // Add first row
    document.getElementById('quotation-total').textContent = 'Rp 0';
    document.querySelector('#modal-quotation .modal-title').innerHTML = '<i class="fas fa-file-invoice me-2"></i>Buat Penawaran Baru';
    modalQuotation.show();
});

// Reset form when modal is hidden without saving
modalQuotationEl.addEventListener('hidden.coreui.modal', () => {
    if (editingQuotationId) {
        console.log('Modal closed, resetting editing mode');
        editingQuotationId = null;
    }
});

btnAddItem.addEventListener('click', addItemRow);

async function loadQuotations() {
    try {
        const response = await fetch(`${API_URL}/quotations`);
        const data = await response.json();
        renderQuotations(data);
    } catch (error) {
        console.error('Error loading quotations:', error);
    }
}

function renderQuotations(quotations) {
    quotationsTableBody.innerHTML = quotations.map(q => {
        const isAccepted = q.status === 'accepted';
        const isRejected = q.status === 'rejected';
        const isFinal = isAccepted || isRejected;
        
        return `
        <tr>
            <td>#${q.id}</td>
            <td>${q.client_name}</td>
            <td>${new Date(q.quotation_date).toLocaleDateString()}</td>
            <td>Rp ${Math.round(parseFloat(q.total_amount)).toLocaleString('id-ID')}</td>
            <td><span class="status-badge status-${q.status}">${q.status}</span></td>
            <td>
                <div class="d-flex gap-2">
                    <!-- Status Action Buttons -->
                    <div class="btn-group" role="group">
                        ${!isFinal ? `
                        <button onclick="acceptQuotation(${q.id})" class="btn btn-sm btn-success text-white" title="Setujui & Buat Invoice">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button onclick="rejectQuotation(${q.id})" class="btn btn-sm btn-danger text-white" title="Tolak Penawaran">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        ` : `
                        <button onclick="resetQuotationStatus(${q.id})" class="btn btn-sm btn-warning text-white" title="Reset ke Draft">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                        `}
                    </div>
                    
                    <!-- Regular Action Buttons -->
                    <div class="btn-group" role="group">
                        <button onclick="viewQuotation(${q.id})" class="btn btn-sm btn-info text-white" title="Preview">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${!isFinal ? `
                        <button onclick="editQuotation(${q.id})" class="btn btn-sm btn-warning text-white" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        <button onclick="printQuotation(${q.id})" class="btn btn-sm btn-secondary text-white" title="Print">
                            <i class="fas fa-print"></i>
                        </button>
                        ${!isAccepted ? `
                        <button onclick="deleteQuotation(${q.id})" class="btn btn-sm btn-outline-danger" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// View/Preview Quotation
window.viewQuotation = async (id) => {
    try {
        const response = await fetch(`${API_URL}/quotations/${id}/details`);
        const quotation = await response.json();
        
        // Create preview modal content with professional invoice style
        const itemsHtml = quotation.items.map(item => `
            <tr>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${item.description}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${item.unit || 'pcs'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Rp ${Math.round(parseFloat(item.unit_price)).toLocaleString('id-ID')}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Rp ${Math.round(parseFloat(item.discount || 0)).toLocaleString('id-ID')}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Rp ${Math.round(parseFloat(item.total_price)).toLocaleString('id-ID')}</td>
            </tr>
        `).join('');
        
        const previewContent = `
            <div class="invoice-container" style="background: white; padding: 2rem; font-family: Arial, sans-serif;">
                <!-- Header -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                            <img src="logo.jpg" alt="Mallawa Logo" style="width: 60px; height: 60px; margin-right: 15px; object-fit: contain;">
                            <div>
                                 <h5 style="margin: 0; font-weight: bold;">MALLAWA DIGITAL CONNECTION</h5>
                           </div>
                        </div>
                        <p style="color: #666; margin: 0; font-size: 12px; font-style: italic;">
                            Jl. Bung Lr. 8 Perintis Kemerdekaan, Tamalanrea<br>
                            Makassar, Sulawesi Selatan
                        </p>
                    </div>
                    <div class="col-md-6 text-end">
                        <h2 style="font-weight: bold; margin: 0;">PENAWARAN</h2>
                        <p style="color: #666; margin: 0;">#${quotation.id}</p>
                    </div>
                </div>

                <!-- Client Info & Date -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <p style="color: #666; margin-bottom: 0.5rem; font-size: 12px;">Bill To</p>
                        <p style="margin: 0; font-weight: bold;">${quotation.client_name}</p>
                        <p style="color: #666; margin: 0; font-size: 14px;">${quotation.client_address || '-'}</p>
                    </div>
                    <div class="col-md-6">
                        <table style="float: right; font-size: 14px;">
                            <tr>
                                <td style="color: #666; padding: 4px 20px 4px 0;">Date</td>
                                <td style="text-align: right; padding: 4px 0;">${new Date(quotation.quotation_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            </tr>
                            <tr>
                                <td style="color: #666; padding: 4px 20px 4px 0;">Status</td>
                                <td style="text-align: right; padding: 4px 0;"><span class="status-badge status-${quotation.status}">${quotation.status}</span></td>
                            </tr>
                            <tr>
                                <td style="color: #666; padding: 4px 20px 4px 0; font-weight: bold;">Total</td>
                                <td style="text-align: right; padding: 4px 0; font-weight: bold;">Rp ${Math.round(parseFloat(quotation.total_amount)).toLocaleString('id-ID')}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Items Table -->
                <table class="table table-bordered" style="margin-top: 2rem;">
                    <thead style="background-color: #f8f9fa;">
                        <tr>
                            <th style="padding: 12px; border: 1px solid #dee2e6;">ITEM</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 80px; text-align: center;">QTY</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 80px; text-align: center;">SATUAN</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 130px; text-align: right;">RATE</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 110px; text-align: right;">DISKON</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 130px; text-align: right;">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" style="text-align: right; padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Total</td>
                            <td style="text-align: right; padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Rp ${Math.round(parseFloat(quotation.total_amount)).toLocaleString('id-ID')}</td>
                        </tr>
                    </tfoot>
                </table>

                <!-- Notes -->
                <div style="margin-top: 2rem; color: #666; font-size: 13px;">
                    <p style="margin-bottom: 0.5rem;"><strong>Notes</strong></p>
                    <p style="margin: 0;">1. Harga Netto Franco Makassar</p>
                    <p style="margin: 0;">2. Harga dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu</p>
                    <p style="margin: 0;">3. Mohon konfirmasi stock terlebih dahulu sebelum turun P.O atau sebelum melakukan pembayaran</p>
                    <p style="margin: 0;">4. Pembayaran dapat dilakukan melalui transfer ke:</p>
                    <p style="margin: 0; padding-left: 1rem; font-weight: bold; font-style: italic;">Bank BCA-PT. Mallawa Digital Connection</p>
                    <p style="margin: 0; padding-left: 1rem; font-weight: bold; font-style: italic;">705.5155216</p>
                </div>
            </div>
        `;
        
        // Show in a modal
        const previewDiv = document.createElement('div');
        previewDiv.innerHTML = `
            <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Preview Penawaran #${quotation.id}</h5>
                            <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                        </div>
                        <div class="modal-body" id="print-content-${id}">
                            ${previewContent}
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Tutup</button>
                            <button class="btn btn-primary" onclick="printQuotationContent(${id})"><i class="fas fa-print"></i> Print</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(previewDiv);
    } catch (error) {
        console.error('Error viewing quotation:', error);
        alert('Gagal memuat data penawaran');
    }
};

// Edit Quotation
let editingQuotationId = null;

window.editQuotation = async (id) => {
    try {
        console.log('Fetching quotation details for ID:', id);
        const response = await fetch(`${API_URL}/quotations/${id}/details`);
        const quotation = await response.json();
        
        console.log('Quotation data received:', quotation);
        
        // Set editing mode
        editingQuotationId = id;
        
        // Populate form fields
        formQuotation.client_name.value = quotation.client_name || '';
        formQuotation.client_address.value = quotation.client_address || '';
        formQuotation.quotation_date.value = quotation.quotation_date ? quotation.quotation_date.split('T')[0] : ''; // Format to YYYY-MM-DD
        
        console.log('Form fields populated');
        
        // Clear items container
        itemsContainer.innerHTML = '';
        
        // Create table structure
        itemsContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-bordered table-sm align-middle" id="items-table">
                    <thead class="table-light">
                        <tr>
                            <th style="min-width: 250px;">Deskripsi Item / Produk</th>
                            <th style="width: 80px;">Qty</th>
                            <th style="width: 100px;">Satuan</th>
                            <th style="width: 140px;">Harga Satuan</th>
                            <th style="width: 120px;">Diskon</th>
                            <th style="width: 150px;">Total</th>
                            <th style="width: 60px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="items-tbody">
                    </tbody>
                </table>
            </div>
        `;
        
        const tbody = document.getElementById('items-tbody');
        
        console.log('Items count:', quotation.items ? quotation.items.length : 0);
        
        if (quotation.items && quotation.items.length > 0) {
            quotation.items.forEach((item, index) => {
                console.log(`Adding item ${index + 1}:`, item);
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>
                        <input type="text" class="form-control form-control-sm" name="item_description" placeholder="Deskripsi item atau pilih produk" list="product-list" value="${item.description || ''}" onchange="fillProductPrice(this)" required>
                    </td>
                    <td>
                        <input type="number" class="form-control form-control-sm text-center" name="item_quantity" placeholder="1" min="1" value="${item.quantity || 1}" onchange="calculateTotal(this)" required>
                    </td>
                    <td>
                        <input type="text" class="form-control form-control-sm" name="item_unit" placeholder="Unit" value="${item.unit || 'pcs'}" required>
                    </td>
                    <td>
                        <input type="number" class="form-control form-control-sm text-end" name="item_price" placeholder="0.00" min="0" step="0.01" value="${item.unit_price || 0}" onchange="calculateTotal(this)" required>
                    </td>
                    <td>
                        <input type="number" class="form-control form-control-sm text-end" name="item_discount" placeholder="0.00" min="0" value="${item.discount || 0}" onchange="calculateTotal(this)">
                    </td>
                    <td>
                        <input type="text" class="form-control form-control-sm text-end fw-semibold bg-light" name="item_total" value="${Math.round(parseFloat(item.total_price || 0)).toLocaleString('id-ID')}" readonly>
                    </td>
                    <td class="text-center">
                        <button type="button" class="btn btn-danger btn-sm" onclick="removeItemRow(this)">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                    <input type="hidden" name="item_cost_price" value="${item.cost_price || 0}">
                    <input type="hidden" name="item_profit_margin" value="${item.profit_margin || 0}">
                `;
                
                tbody.appendChild(row);
            });
        } else {
            console.log('No items found, adding empty row');
            addItemRow(); // Add one empty row if no items
        }
        
        // Update grand total
        updateGrandTotal();
        
        console.log('Grand total updated');
        
        // Update modal title
        document.querySelector('#modal-quotation .modal-title').innerHTML = '<i class="fas fa-edit me-2"></i>Edit Penawaran #' + id;
        
        // Show modal
        modalQuotation.show();
        
        console.log('Modal shown');
        
    } catch (error) {
        console.error('Error loading quotation:', error);
        alert('Gagal memuat data penawaran untuk diedit');
    }
};

// Print Quotation Content
window.printQuotationContent = (id) => {
    const printContent = document.getElementById(`print-content-${id}`).innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Penawaran #${id}</title>
            <link href="node_modules/@coreui/coreui/dist/css/coreui.min.css" rel="stylesheet">
            <style>
                body { padding: 20px; font-family: Arial, sans-serif; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
                .status-badge {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border-radius: 0.25rem;
                    display: inline-block;
                }
                .status-draft { background-color: #ffc107; color: #000; }
                .status-sent { background-color: #17a2b8; color: #fff; }
                .status-accepted { background-color: #28a745; color: #fff; }
                .status-rejected { background-color: #dc3545; color: #fff; }
            </style>
        </head>
        <body>
            ${printContent}
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    }
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

// Print Quotation (legacy support)
window.printQuotation = (id) => {
    printQuotationContent(id);
};

// Delete Quotation
window.deleteQuotation = async (id) => {
    if (!confirm('Yakin ingin menghapus penawaran ini?')) return;
    
    try {
        const response = await fetch(`${API_URL}/quotations/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Penawaran berhasil dihapus');
            loadQuotations();
            loadDashboardStats();
        } else {
            alert('Gagal menghapus penawaran');
        }
    } catch (error) {
        console.error('Error deleting quotation:', error);
        alert('Terjadi kesalahan saat menghapus');
    }
};

// Accept Quotation dan Auto Create Invoice
window.acceptQuotation = async (id) => {
    if (!confirm('Setujui penawaran ini dan buat invoice?')) return;
    
    try {
        console.log('Starting accept quotation process for ID:', id);
        
        // 1. Approve quotation
        const approveResponse = await fetch(`${API_URL}/quotations/${id}/approve`, {
            method: 'PUT'
        });
        
        console.log('Approve response status:', approveResponse.status);
        
        if (!approveResponse.ok) {
            alert('Gagal menyetujui penawaran');
            return;
        }
        
        // 2. Get quotation details
        const quotationResponse = await fetch(`${API_URL}/quotations/${id}/details`);
        const quotation = await quotationResponse.json();
        
        console.log('Quotation details:', quotation);
        
        // 3. Create invoice from quotation
        const invoiceData = {
            quotation_id: id,
            client_name: quotation.client_name,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 days from now
            total_amount: quotation.total_amount,
            status: 'unpaid'
        };
        
        console.log('Creating invoice with data:', invoiceData);
        
        const invoiceResponse = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceData)
        });
        
        console.log('Invoice response status:', invoiceResponse.status);
        
        if (invoiceResponse.ok) {
            const invoiceResult = await invoiceResponse.json();
            console.log('Invoice created successfully:', invoiceResult);
            alert('Penawaran disetujui dan Invoice berhasil dibuat!');
            loadQuotations();
            loadDashboardStats();
            // Auto switch to invoice tab and load invoices
            navigateToTab('invoices');
            setTimeout(() => {
                loadInvoices();
            }, 300);
        } else {
            const errorText = await invoiceResponse.text();
            console.error('Failed to create invoice:', errorText);
            alert('Penawaran disetujui tapi gagal membuat invoice. Silakan buat manual.');
            loadQuotations();
            loadDashboardStats();
        }
    } catch (error) {
        console.error('Error accepting quotation:', error);
        alert('Terjadi kesalahan saat memproses penawaran');
    }
};

// Reject Quotation
window.rejectQuotation = async (id) => {
    if (!confirm('Tolak penawaran ini?')) return;
    
    try {
        const response = await fetch(`${API_URL}/quotations/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'rejected' })
        });
        
        if (response.ok) {
            alert('Penawaran ditolak.');
            loadQuotations();
            loadDashboardStats();
        } else {
            const error = await response.json();
            console.error('Error rejecting quotation:', error);
            alert('Gagal menolak penawaran: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error rejecting quotation:', error);
        alert('Terjadi kesalahan saat menolak penawaran');
    }
};

// Reset Quotation Status to Draft
window.resetQuotationStatus = async (id) => {
    if (!confirm('Reset penawaran ini ke status Draft? Invoice terkait akan dihapus.')) return;
    
    try {
        // Delete invoice associated with this quotation
        const deleteInvoiceResponse = await fetch(`${API_URL}/invoices/by-quotation/${id}`, {
            method: 'DELETE'
        });
        
        if (!deleteInvoiceResponse.ok) {
            console.error('Error deleting invoice');
            // Continue anyway, invoice might not exist
        }
        
        // Reset quotation status to draft
        const response = await fetch(`${API_URL}/quotations/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'draft' })
        });
        
        if (response.ok) {
            alert('Status penawaran berhasil direset ke Draft dan invoice telah dihapus.');
            loadQuotations();
            loadInvoices();
            loadDashboardStats();
        } else {
            const error = await response.json();
            console.error('Error resetting quotation:', error);
            alert('Gagal reset status: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error resetting quotation:', error);
        alert('Terjadi kesalahan saat reset status');
    }
};

async function loadInvoices() {
    try {
        const response = await fetch(`${API_URL}/invoices`);
        const data = await response.json();
        renderInvoices(data);
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

function renderInvoices(invoices) {
    invoicesTableBody.innerHTML = invoices.map(inv => `
        <tr>
            <td>${inv.invoice_number}</td>
            <td>${inv.client_name}</td>
            <td>${new Date(inv.invoice_date).toLocaleDateString()}</td>
            <td>Rp ${Math.round(parseFloat(inv.total_amount)).toLocaleString('id-ID')}</td>
            <td><span class="status-badge status-${inv.status}">${inv.status}</span></td>
            <td>
                <div class="btn-group" role="group">
                    <button onclick="printInvoice(${inv.id})" class="btn btn-sm btn-secondary text-white" title="Print">
                        <i class="fas fa-print"></i>
                    </button>
                    ${inv.status === 'unpaid' ? `
                    <button onclick="markInvoicePaid(${inv.id})" class="btn btn-sm btn-success text-white" title="Tandai Lunas">
                        <i class="fas fa-check"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Print Invoice
window.printInvoice = async (id) => {
    try {
        const response = await fetch(`${API_URL}/invoices`);
        const invoices = await response.json();
        const invoice = invoices.find(inv => inv.id === id);
        
        if (!invoice) {
            alert('Invoice tidak ditemukan');
            return;
        }
        
        // Get quotation details for items
        const quotationResponse = await fetch(`${API_URL}/quotations/${invoice.quotation_id}/details`);
        const quotation = await quotationResponse.json();
        
        const itemsHtml = quotation.items.map(item => `
            <tr>
                <td style="padding: 12px; border: 1px solid #dee2e6;">${item.description}</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${item.unit || 'pcs'}</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Rp ${Math.round(parseFloat(item.unit_price)).toLocaleString('id-ID')}</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Rp ${Math.round(parseFloat(item.discount || 0)).toLocaleString('id-ID')}</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Rp ${Math.round(parseFloat(item.total_price)).toLocaleString('id-ID')}</td>
            </tr>
        `).join('');
        
        const printContent = `
            <div style="max-width: 900px; margin: 0 auto; font-family: Arial, sans-serif;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #dee2e6;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                            <img src="logo.jpg" alt="Mallawa Logo" style="width: 60px; height: 60px; margin-right: 15px; object-fit: contain;">
                            <div>
                                <h5 style="margin: 0; font-weight: bold;">MALLAWA DIGITAL CONNECTION</h5>
                            </div>
                        </div>
                        <p style="color: #666; margin: 0; font-size: 12px; font-style: italic;">
                            Jl. Bung Lr. 8 Perintis Kemerdekaan, Tamalanrea<br>
                            Makassar, Sulawesi Selatan
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="font-weight: bold; margin: 0;">INVOICE</h2>
                        <p style="color: #666; margin: 0;">${invoice.invoice_number}</p>
                    </div>
                </div>

                <!-- Client Info & Date -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 2rem;">
                    <div style="flex: 1;">
                        <p style="color: #666; margin-bottom: 0.5rem; font-size: 12px;">Bill To</p>
                        <p style="margin: 0; font-weight: bold;">${invoice.client_name}</p>
                    </div>
                    <div>
                        <table style="float: right; font-size: 14px;">
                            <tr>
                                <td style="color: #666; padding: 4px 20px 4px 0;">Invoice Date</td>
                                <td style="text-align: right; padding: 4px 0;">${new Date(invoice.invoice_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            </tr>
                            <tr>
                                <td style="color: #666; padding: 4px 20px 4px 0;">Due Date</td>
                                <td style="text-align: right; padding: 4px 0;">${new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            </tr>
                            <tr>
                                <td style="color: #666; padding: 4px 20px 4px 0; font-weight: bold;">Total</td>
                                <td style="text-align: right; padding: 4px 0; font-weight: bold;">Rp ${Math.round(parseFloat(invoice.total_amount)).toLocaleString('id-ID')}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Items Table -->
                <table style="width: 100%; border-collapse: collapse; margin-top: 2rem;">
                    <thead style="background-color: #f8f9fa;">
                        <tr>
                            <th style="padding: 12px; border: 1px solid #dee2e6;">ITEM</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 80px; text-align: center;">QTY</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 80px; text-align: center;">SATUAN</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 130px; text-align: right;">RATE</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 110px; text-align: right;">DISKON</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; width: 130px; text-align: right;">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" style="text-align: right; padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Total</td>
                            <td style="text-align: right; padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Rp ${Math.round(parseFloat(invoice.total_amount)).toLocaleString('id-ID')}</td>
                        </tr>
                    </tfoot>
                </table>

                <!-- Notes -->
                <div style="margin-top: 2rem; color: #666; font-size: 13px;">
                    <p style="margin-bottom: 0.5rem;"><strong>Notes</strong></p>
                    <p style="margin: 0;">1. Harga Netto Franco Makassar</p>
                    <p style="margin: 0;">2. Harga dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu</p>
                    <p style="margin: 0;">3. Mohon konfirmasi stock terlebih dahulu sebelum turun P.O atau sebelum melakukan pembayaran</p>
                    <p style="margin: 0;">4. Pembayaran dapat dilakukan melalui transfer ke:</p>
                    <p style="margin: 0; padding-left: 1rem; font-weight: bold; font-style: italic;">Bank BCA-PT. Mallawa Digital Connection</p>
                    <p style="margin: 0; padding-left: 1rem; font-weight: bold; font-style: italic;">705.5155216</p>
                </div>

                <!-- Payment Status -->
                <div style="margin-top: 2rem; padding: 1rem; background-color: ${invoice.status === 'paid' ? '#d4edda' : '#fff3cd'}; border: 1px solid ${invoice.status === 'paid' ? '#c3e6cb' : '#ffeeba'}; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: ${invoice.status === 'paid' ? '#155724' : '#856404'};">
                        Status Pembayaran: ${invoice.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                    </p>
                </div>
            </div>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoice_number}</title>
                <link href="node_modules/@coreui/coreui/dist/css/coreui.min.css" rel="stylesheet">
                <style>
                    body { padding: 20px; font-family: Arial, sans-serif; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        console.error('Error printing invoice:', error);
        alert('Gagal mencetak invoice');
    }
};

// Mark Invoice as Paid
window.markInvoicePaid = async (id) => {
    if (!confirm('Tandai invoice ini sebagai LUNAS?')) return;
    
    try {
        const response = await fetch(`${API_URL}/invoices/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'paid' })
        });
        
        if (response.ok) {
            alert('Invoice berhasil ditandai sebagai LUNAS!');
            loadInvoices();
            loadDashboardStats();
        } else {
            alert('Gagal update status invoice');
        }
    } catch (error) {
        console.error('Error updating invoice:', error);
        alert('Terjadi kesalahan');
    }
};

// Global functions for inline event handlers
window.approveQuotation = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui penawaran ini?')) return;
    
    try {
        const response = await fetch(`${API_URL}/quotations/${id}/approve`, { method: 'PUT' });
        if (response.ok) {
            loadQuotations();
        } else {
            alert('Gagal menyetujui penawaran');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

window.convertToInvoice = async (id) => {
    if (!confirm('Buat invoice dari penawaran ini?')) return;

    try {
        const response = await fetch(`${API_URL}/invoices/convert/${id}`, { method: 'POST' });
        if (response.ok) {
            alert('Invoice berhasil dibuat!');
            loadQuotations(); // Refresh to show status update
        } else {
            alert('Gagal membuat invoice');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

// CRUD Handlers
window.editCategory = (id, name) => {
    editingCategoryId = id;
    formCategory.category_name.value = name;
    document.querySelector('#modal-category .modal-title').textContent = 'Edit Kategori';
    modalCategory.show();
};

window.deleteCategory = async (id) => {
    if (!confirm('Hapus kategori ini? Produk terkait mungkin akan kehilangan kategori.')) return;
    try {
        await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
        loadCategories();
    } catch (error) {
        console.error(error);
    }
};

window.editProduct = (id, catId, name, unit, cost, profitMargin, price) => {
    editingProductId = id;
    renderCategoryOptions(); // Ensure options are loaded
    formProduct.category_id.value = catId;
    formProduct.product_name.value = name;
    formProduct.product_unit.value = unit;
    formProduct.product_cost_price.value = cost;
    formProduct.product_profit_margin.value = profitMargin;
    formProduct.product_price.value = price;
    document.querySelector('#modal-product .modal-title').textContent = 'Edit Produk';
    modalProduct.show();
};

window.deleteProduct = async (id) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
        await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        loadProducts();
    } catch (error) {
        console.error(error);
    }
};

// Initial Load
loadData();
loadDashboardStats(); // Load stats initially
loadCategories(); // Preload categories for select options
loadProducts(); // Preload products for datalist

// Search Functionality
let marginReportData = [];

document.getElementById('search-product').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        (p.category_name && p.category_name.toLowerCase().includes(searchTerm))
    );
    renderProducts(filteredProducts);
});

document.getElementById('search-margin').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredData = marginReportData.filter(item => 
        item.client_name.toLowerCase().includes(searchTerm)
    );
    renderMarginReport(filteredData);
});

// Margin Report Functions
async function loadMarginReport() {
    try {
        const response = await fetch(`${API_URL}/reports/margins`);
        marginReportData = await response.json(); // Store data globally for filtering
        renderMarginReport(marginReportData);
    } catch (error) {
        console.error('Error loading margin report:', error);
    }
}

function renderMarginReport(data) {
    const tbody = document.querySelector('#margin-report-table');
    if (!tbody) return;
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>#${item.id}</td>
            <td>${item.client_name}</td>
            <td>${new Date(item.quotation_date).toLocaleDateString()}</td>
            <td>Rp ${Math.round(parseFloat(item.total_amount)).toLocaleString('id-ID')}</td>
            <td>Rp ${Math.round(parseFloat(item.total_cost)).toLocaleString('id-ID')}</td>
            <td class="${item.margin >= 0 ? 'text-success' : 'text-danger'}">
                Rp ${Math.round(parseFloat(item.margin)).toLocaleString('id-ID')}
            </td>
            <td class="${item.margin_percent >= 0 ? 'text-success' : 'text-danger'}">
                ${item.margin_percent}%
            </td>
        </tr>
    `).join('');
}
