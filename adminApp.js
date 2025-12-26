// modules/adminApp.js - Tiles of Lucca Admin Panel
import { requireAuth, logout, goBack } from './auth.js';
import { store, addNotification, getStockBadge, formatPrice, getBoxPrice } from './storage.js';
import { showToast, openModal, closeModal, fmtMoney, escapeHtml, updateBadge } from './ui.js';
import { generatePDFBlobUrl } from './poPdf.js';
import { importPricesModal, parsePriceSheet, applyDealerPrices } from './excelImport.js';
import { updateOrderStatus as setOrderStatus } from './orders.js';
import { saveImageFiles, getImageUrl, deleteImages } from './images.js';

const currentUser = requireAuth(['admin','superadmin','viewer']);
if (!currentUser) throw new Error('Unauthorized');
const roleNorm = String(currentUser.role||'').trim().toLowerCase();
const isViewer = roleNorm === 'viewer';
const canEdit = !isViewer;
const isSuperAdmin = roleNorm === 'superadmin';

function applyBranding(){
  const s = store.settings.get();
  const img = document.getElementById('brand-logo-img');
  const txt = document.getElementById('brand-logo-text');
  if (txt) txt.textContent = (s.brandName || 'TILES OF LUCCA');
  if (img && s.brandLogoDataUrl){
    img.src = s.brandLogoDataUrl;
    img.classList.remove('hidden');
    if (txt) txt.classList.add('hidden');
  } else {
    if (img) img.classList.add('hidden');
    if (txt) txt.classList.remove('hidden');
  }
}

document.getElementById('user-name').textContent = currentUser.dealerName;
document.getElementById('btn-logout').addEventListener('click', logout);
const brandBtn = document.getElementById('btn-brand');
if (brandBtn){ brandBtn.addEventListener('click', openBrandModal); }
document.getElementById('btn-back').addEventListener('click', goBack);

let currentTab = 'products';

function applyReadOnlyLock(){
  if (!isViewer) return;
  document.querySelectorAll('.modal-backdrop input, .modal-backdrop select, .modal-backdrop textarea, .modal-backdrop button.btn')
    .forEach(el=>{
      if (el.matches('[data-close]')) return;
      if (el.tagName === 'BUTTON'){
        el.disabled = true;
        el.style.opacity = '0.5';
        el.style.cursor = 'not-allowed';
        return;
      }
      el.disabled = true;
      el.style.background = 'var(--gray-100)';
    });
}

function init(){
  applyBranding();
  maybeSeedLowStockNotif();
  renderStats();
  renderTabs();
  renderTab();
  wireNotif();
}
init();

function getState(){
  return {
    products: store.products.get(),
    users: store.users.get(),
    dealerProducts: store.dealerProducts.get(),
    categories: store.categories.get(),
    orders: store.orders.get(),
    settings: store.settings.get(),
    notifications: store.notifications.get(),
  };
}

function maybeSeedLowStockNotif(){
  const { products, settings, notifications } = getState();
  const lowCount = products.filter(p => p.stock > 0 && p.stock <= settings.lowStockThreshold).length;
  if (lowCount > 0 && notifications.length === 0){
    addNotification('Low Stock Alert', `${lowCount} product${lowCount>1?'s':''} running low on inventory`);
  }
}

function wireNotif(){
  const btn = document.getElementById('notif-btn');
  btn.addEventListener('click', ()=>{
    const { notifications } = getState();
    const html = `
      <div class="modal-backdrop">
        <div class="modal-box">
          <div class="modal-head">
            <h2 class="modal-heading">Notifications</h2>
            <button class="modal-close" data-close>×</button>
          </div>
          <div class="modal-body">
            ${notifications.length===0 ? '<div class="empty-zone"><div class="empty-ico">🔔</div><div class="empty-msg">No notifications</div></div>' :
              notifications.map(n=>`
                <div style="padding:14px 0;border-bottom:1px solid var(--gray-200)">
                  <div style="font-size:13px;font-weight:600">${escapeHtml(n.title)}</div>
                  <div style="font-size:12px;color:var(--gray-600);margin-top:4px">${escapeHtml(n.text)}</div>
                  <div style="font-size:10px;color:var(--gray-500);margin-top:6px">${new Date(n.time).toLocaleString()}</div>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>`;
    openModal(html);
    applyReadOnlyLock();
    document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));
    const list = store.notifications.get().map(n=>({ ...n, read:true }));
    store.notifications.set(list);
    updateNotifBadge();
  });
  updateNotifBadge();
}

function updateNotifBadge(){
  const badge = document.getElementById('notif-badge');
  const count = store.notifications.get().filter(n=>!n.read).length;
  updateBadge(badge, count);
}

function renderStats(){
  const { products, users, categories, orders, settings } = getState();
  const dealers = users.filter(u=>u.role==='dealer');
  const pending = orders.filter(o=>o.status==='pending');
  const lowCount = products.filter(p => p.stock>0 && p.stock <= settings.lowStockThreshold).length;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-box" data-tab="products"><div class="stat-number">${products.length}</div><div class="stat-text">Products</div></div>
    <div class="stat-box" data-tab="categories"><div class="stat-number">${categories.length}</div><div class="stat-text">Categories</div></div>
    <div class="stat-box" data-tab="dealers"><div class="stat-number">${dealers.length}</div><div class="stat-text">Dealers</div></div>
    <div class="stat-box ${pending.length>0?'alert':''}" data-tab="orders"><div class="stat-number ${pending.length>0?'alert':''}">${pending.length}</div><div class="stat-text">Pending Orders</div></div>
    <div class="stat-box ${lowCount>0?'alert':''}" data-tab="products"><div class="stat-number ${lowCount>0?'alert':''}">${lowCount}</div><div class="stat-text">Low Stock</div></div>
  `;
  document.querySelectorAll('.stat-box[data-tab]').forEach(el=>{
    el.addEventListener('click', ()=>switchTab(el.getAttribute('data-tab')));
  });
}

function renderTabs(){
  const { orders } = getState();
  const pendingCount = orders.filter(o=>o.status==='pending').length;
  document.getElementById('tab-nav').innerHTML = `
    <button class="tab-item ${currentTab==='products'?'active':''}" data-tab="products">Products</button>
    <button class="tab-item ${currentTab==='categories'?'active':''}" data-tab="categories">Categories</button>
    <button class="tab-item ${currentTab==='dealers'?'active':''}" data-tab="dealers">Dealers</button>
    ${currentUser.role==='superadmin' ? `<button class="tab-item ${currentTab==='admins'?'active':''}" data-tab="admins">Admins</button>` : ''}
    <button class="tab-item ${currentTab==='orders'?'active':''}" data-tab="orders">
      Orders ${pendingCount>0?`<span class="tab-badge">${pendingCount}</span>`:''}
    </button>
    <button class="tab-item ${currentTab==='settings'?'active':''}" data-tab="settings">Settings</button>
  `;
  document.querySelectorAll('.tab-item').forEach(b=>b.addEventListener('click', ()=>switchTab(b.dataset.tab)));
}

function switchTab(tab){
  currentTab = tab;
  renderTabs();
  renderTab();
}

function renderTab(){
  const root = document.getElementById('tab-content');
  if (currentTab==='products') return renderProducts(root);
  if (currentTab==='categories') return renderCategories(root);
  if (currentTab==='dealers') return renderDealers(root);
  if (currentTab==='admins') return renderAdmins(root);
  if (currentTab==='orders') return renderOrders(root);
  if (currentTab==='settings') return renderSettings(root);
}

function renderProducts(root){
  const { products, settings } = getState();
  const showBox = settings.showBoxPricing;
  root.innerHTML = `
    <div class="content-section">
      <div class="section-top">
        <h2 class="section-heading">Product Catalog</h2>
        <button class="btn btn-sm" id="btn-new-product" ${canEdit?'':'disabled'}>+ Add Product</button>
      </div>
      <table class="data-grid">
        <thead><tr>
          <th>SKU</th>
          <th>Product Name</th>
          <th>Category</th>
          <th>Size</th>
          <th>Price</th>
          ${showBox ? '<th>Box Price</th>' : ''}
          <th>Stock</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          ${products.map(p=>{
            const badge = getStockBadge(p.stock);
            const boxPrice = (p.price * (p.boxSize || 1)).toFixed(2);
            return `
              <tr>
                <td><strong>${escapeHtml(p.sku || p.code)}</strong></td>
                <td>${escapeHtml(p.name)}</td>
                <td>${escapeHtml(p.category)}</td>
                <td>${escapeHtml(p.size || '—')}</td>
                <td>$${fmtMoney(p.price)}</td>
                ${showBox ? `<td>$${fmtMoney(boxPrice)}</td>` : ''}
                <td><span class="product-stock-badge ${badge.cls}">${badge.txt}</span> <small>${p.stock}</small></td>
                <td>
                  <div class="action-group">
                    <button class="btn btn-sm btn-outline" data-edit="${escapeHtml(p.code)}" ${canEdit?'':'disabled'}>Edit</button>
                    <button class="btn btn-sm btn-danger" data-del="${escapeHtml(p.code)}" ${canEdit?'':'disabled'}>Delete</button>
                  </div>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${products.length===0 ? '<div class="empty-zone"><div class="empty-ico">📦</div><div class="empty-msg">No Products Yet</div></div>' : ''}
    </div>
  `;
  document.getElementById('btn-new-product').addEventListener('click', ()=>openProductModal(null));
  root.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', ()=>openProductModal(products.find(p=>p.code===b.dataset.edit))));
  root.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>deleteProduct(b.dataset.del)));
}

function openProductModal(product){
  const isEdit = !!product;
  const categories = store.categories.get();
  openModal(`
    <div class="modal-backdrop">
      <div class="modal-box wide">
        <div class="modal-head">
          <h2 class="modal-heading">${isEdit?'Edit Product':'Add New Product'}</h2>
          <button class="modal-close" data-close>×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
              <label class="form-label">SKU *</label>
              <input id="prod-sku" class="form-input" value="${escapeHtml(product?.sku||'')}" placeholder="Z4001" />
            </div>

          <div class="form-group">
            <label class="form-label">Product Name *</label>
            <input id="prod-name" class="form-input" value="${escapeHtml(product?.name||'')}" placeholder="4x4 Zellige White" />
          </div>

          <div class="field-row">
            <div class="form-group">
              <label class="form-label">Category *</label>
              <select id="prod-category" class="form-select">
                <option value="">Select Category</option>
                ${categories.map(c=>`<option value="${escapeHtml(c)}" ${product?.category===c?'selected':''}>${escapeHtml(c)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Subcategory</label>
              <input id="prod-subcategory" class="form-input" value="${escapeHtml(product?.subcategory||'')}" placeholder="4x4 Zellige" />
            </div>
          </div>

          <div class="field-row-3">
            <div class="form-group">
              <label class="form-label">Size</label>
              <input id="prod-size" class="form-input" value="${escapeHtml(product?.size||'')}" placeholder="4&quot;x4&quot;" />
            </div>
            <div class="form-group">
              <label class="form-label">Thickness</label>
              <input id="prod-thickness" class="form-input" value="${escapeHtml(product?.thickness||'')}" placeholder="3/8&quot;" />
            </div>
            <div class="form-group">
              <label class="form-label">Finish</label>
              <input id="prod-finish" class="form-input" value="${escapeHtml(product?.finish||'')}" placeholder="Glossy, Honed, Matte" />
            </div>
          </div>

          <div class="field-row-3">
            <div class="form-group">
              <label class="form-label">Material</label>
              <input id="prod-material" class="form-input" value="${escapeHtml(product?.material||'')}" placeholder="Clay, Marble, Porcelain" />
            </div>
            <div class="form-group">
              <label class="form-label">Stock *</label>
              <input id="prod-stock" type="number" class="form-input" value="${product?.stock ?? ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Box Size (sqft)</label>
              <input id="prod-boxsize" type="number" step="0.01" class="form-input" value="${product?.boxSize ?? ''}" placeholder="5.33" />
            </div>
          </div>

          <div style="background:var(--gray-50);padding:20px;margin:20px 0;border:1px solid var(--gray-200)">
            <div style="font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;color:var(--gray-600)">Pricing (per sqft)</div>
            <div class="field-row">
              <div class="form-group">
                <label class="form-label">Base Price (USD) *</label>
                <input id="prod-price" type="number" step="0.01" class="form-input" value="${product?.price ?? ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Tier 1 Price</label>
                <input id="tier1-price" type="number" step="0.01" class="form-input" value="${product?.tierPrices?.Tier1 ?? ''}" />
              </div>
            </div>
            <div class="field-row-3">
              <div class="form-group">
                <label class="form-label">Tier 2 Price</label>
                <input id="tier2-price" type="number" step="0.01" class="form-input" value="${product?.tierPrices?.Tier2 ?? ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Tier 3 Price</label>
                <input id="tier3-price" type="number" step="0.01" class="form-input" value="${product?.tierPrices?.Tier3 ?? ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Tier 4 Price</label>
                <input id="tier4-price" type="number" step="0.01" class="form-input" value="${product?.tierPrices?.Tier4 ?? ''}" />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea id="prod-desc" class="form-textarea" placeholder="Detailed product description...">${escapeHtml(product?.description||'')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Product Images</label>
            <input id="prod-images" type="file" class="form-input" multiple accept="image/*" />
            <div id="prod-images-preview" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px"></div>
          </div>

          <div class="modal-footer">
            <button class="btn" id="btn-save" ${canEdit?'':'disabled'}>${isEdit?'Update Product':'Add Product'}</button>
            <button class="btn btn-outline" data-close>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `);
  applyReadOnlyLock();

  // Image preview handling
  let keepImageIds = (product?.imageIds || []).slice();
  const preview = document.getElementById('prod-images-preview');
  const fileInput = document.getElementById('prod-images');

  async function renderImagePreview(){
    if (!preview) return;
    const parts = [];
    for (const id of keepImageIds){
      const src = await getImageUrl(id);
      if (!src) continue;
      parts.push(`<div style="position:relative;border:1px solid var(--gray-300);width:80px;height:80px;overflow:hidden">
        <img src="${src}" style="width:100%;height:100%;object-fit:cover" />
        <button type="button" data-rmimg="${escapeHtml(id)}" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border:none;background:var(--red);color:white;cursor:pointer;font-size:12px">×</button>
      </div>`);
    }
    window.__lucca_keepImageIds = keepImageIds.slice();
    preview.innerHTML = parts.length ? parts.join('') : '<span style="font-size:11px;color:var(--gray-500)">No images uploaded</span>';
    preview.querySelectorAll('[data-rmimg]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-rmimg');
        keepImageIds = keepImageIds.filter(x=>x!==id);
        await deleteImages([id]);
        renderImagePreview();
      });
    });
  }

  if (fileInput){
    fileInput.addEventListener('change', async ()=>{
      const ids = await saveImageFiles(fileInput.files);
      keepImageIds = keepImageIds.concat(ids);
      fileInput.value = '';
      renderImagePreview();
    });
  }
  renderImagePreview();

  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));
  document.getElementById('btn-save').addEventListener('click', ()=>saveProduct(isEdit, product?.code || null));
}

function saveProduct(isEdit, existingCode=null){
  if (!canEdit){ showToast('Read-only access', 'error'); return; }
  const sku = document.getElementById('prod-sku').value.trim();
  const code = (isEdit && existingCode) ? String(existingCode) : (()=>{
    const raw = String(sku||'').trim();
    const up = raw.toUpperCase().replace(/\s+/g,'');
    if (!up) return '';
    return up.startsWith('MB-LI-') ? up : ('MB-LI-' + up);
  })();
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value;
  const subcategory = document.getElementById('prod-subcategory').value.trim();
  const size = document.getElementById('prod-size').value.trim();
  const thickness = document.getElementById('prod-thickness').value.trim();
  const finish = document.getElementById('prod-finish').value.trim();
  const material = document.getElementById('prod-material').value.trim();
  const price = Number(document.getElementById('prod-price').value);
  const stock = Number(document.getElementById('prod-stock').value);
  const boxSize = Number(document.getElementById('prod-boxsize').value) || 1;
  const description = document.getElementById('prod-desc').value.trim();

  const tier1 = Number(document.getElementById('tier1-price')?.value);
  const tier2 = Number(document.getElementById('tier2-price')?.value);
  const tier3 = Number(document.getElementById('tier3-price')?.value);
  const tier4 = Number(document.getElementById('tier4-price')?.value);
  const tierPrices = {
    Tier1: Number.isNaN(tier1) || tier1===0 ? price : tier1,
    Tier2: Number.isNaN(tier2) || tier2===0 ? price : tier2,
    Tier3: Number.isNaN(tier3) || tier3===0 ? price : tier3,
    Tier4: Number.isNaN(tier4) || tier4===0 ? price : tier4,
  };
  const imageIds = (window.__lucca_keepImageIds || []).slice();

  if (!code || !sku || !name || !category || !description || Number.isNaN(price) || Number.isNaN(stock)){
    showToast('Please fill all required fields', 'error'); return;
  }

  let products = store.products.get();
  const productData = { 
    code, sku, name, category, subcategory, size, thickness, finish, material,
    price, stock, boxSize, description, tierPrices, imageIds, 
    unit: 'sqft', images: []
  };

  if (isEdit){
    products = products.map(p=>p.code===code ? { ...p, ...productData } : p);
    showToast('Product updated');
  } else {
    if (products.some(p=>p.code===code)){
      showToast('Product code already exists', 'error'); return;
    }
    products.push(productData);
    showToast('Product added');
  }
  store.products.set(products);
  closeModal();
  refresh();
}

function deleteProduct(code){
  if (!canEdit){ showToast('Read-only access', 'error'); return; }
  if (!confirm('Delete this product?')) return;
  const existing = store.products.get().find(p=>p.code===code);
  if (existing?.imageIds?.length){ deleteImages(existing.imageIds); }
  const products = store.products.get().filter(p=>p.code!==code);
  store.products.set(products);
  showToast('Product deleted');
  refresh();
}

function renderCategories(root){
  const categories = store.categories.get();
  root.innerHTML = `
    <div class="content-section">
      <div class="section-top">
        <h2 class="section-heading">Category Management</h2>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:30px">
        ${categories.map(cat=>`
          <div class="category-chip" style="display:inline-flex;align-items:center;gap:12px;padding:12px 20px">
            ${escapeHtml(cat)}
            <span data-rm="${escapeHtml(cat)}" style="${canEdit?'cursor:pointer':'cursor:not-allowed;opacity:0.4'};font-weight:600;font-size:16px">×</span>
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:12px;max-width:400px">
        <input id="new-category" class="form-input" placeholder="New category name" />
        <button class="btn btn-sm" id="btn-add-cat" ${canEdit?'':'disabled'}>Add</button>
      </div>
    </div>
  `;
  root.querySelectorAll('[data-rm]').forEach(x=>x.addEventListener('click', ()=>removeCategory(x.dataset.rm)));
  document.getElementById('btn-add-cat').addEventListener('click', addCategory);
}

function addCategory(){
  if (!canEdit){ showToast('Read-only access', 'error'); return; }
  const input = document.getElementById('new-category');
  const name = input.value.trim();
  if (!name) return;
  const categories = store.categories.get();
  if (categories.includes(name)){
    showToast('Category already exists', 'error'); return;
  }
  categories.push(name);
  categories.sort();
  store.categories.set(categories);
  input.value='';
  showToast('Category added');
  refresh();
}

function removeCategory(name){
  if (!canEdit){ showToast('Read-only access', 'error'); return; }
  if (!confirm(`Remove category "${name}"?`)) return;
  const categories = store.categories.get().filter(c=>c!==name);
  store.categories.set(categories);
  showToast('Category removed');
  refresh();
}

function renderDealers(root){
  const users = store.users.get();
  const dealers = users.filter(u=>u.role==='dealer');
  const dealerProducts = store.dealerProducts.get();
  root.innerHTML = `
    <div class="content-section">
      <div class="section-top">
        <h2 class="section-heading">Dealer Accounts</h2>
        <div style="display:flex;gap:12px">
          <button class="btn btn-sm btn-outline" id="btn-import" ${canEdit?'':'disabled'}>Import Prices</button>
          <button class="btn btn-sm" id="btn-new-dealer" ${canEdit?'':'disabled'}>+ Add Dealer</button>
        </div>
      </div>
      <table class="data-grid">
        <thead><tr><th>Code</th><th>Company Name</th><th>Tier</th><th>Contact</th><th>Products</th><th>Actions</th></tr></thead>
        <tbody>
          ${dealers.map(d=>`
            <tr>
              <td><strong>${escapeHtml(d.dealerCode)}</strong></td>
              <td>${escapeHtml(d.dealerName)}<br><small style="color:var(--gray-500)">${escapeHtml(d.email||'')}</small></td>
              <td><span class="status-badge status-approved">${escapeHtml(d.tier||'—')}</span></td>
              <td>${escapeHtml(d.contactPerson||d.dealerName)}<br><small style="color:var(--gray-500)">${escapeHtml(d.phone||'')}</small></td>
              <td>${(dealerProducts[d.dealerCode]||[]).length} assigned</td>
              <td>
                <div class="action-group">
                  <button class="btn btn-sm btn-outline" data-assign="${escapeHtml(d.dealerCode)}" ${canEdit?'':'disabled'}>Assign</button>
                  <button class="btn btn-sm btn-outline" data-edit="${escapeHtml(d.dealerCode)}" ${canEdit?'':'disabled'}>Edit</button>
                  <button class="btn btn-sm btn-danger" data-del="${escapeHtml(d.dealerCode)}" ${canEdit?'':'disabled'}>Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
      ${dealers.length===0 ? '<div class="empty-zone"><div class="empty-ico">👥</div><div class="empty-msg">No Dealers Yet</div></div>' : ''}
    </div>
  `;
  document.getElementById('btn-new-dealer').addEventListener('click', ()=>openDealerModal(null));
  document.getElementById('btn-import').addEventListener('click', ()=>openImportPrices());
  root.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', ()=>openDealerModal(dealers.find(d=>d.dealerCode===b.dataset.edit))));
  root.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>deleteDealer(b.dataset.del)));
  root.querySelectorAll('[data-assign]').forEach(b=>b.addEventListener('click', ()=>openAssignModal(dealers.find(d=>d.dealerCode===b.dataset.assign))));
}

function renderAdmins(root){
  const users = store.users.get();
  const admins = users.filter(u => u.role==='admin' || u.role==='superadmin' || u.role==='viewer');
  
  if (currentUser.role !== 'superadmin'){
    root.innerHTML = '<div class="content-section"><div class="empty-zone"><div class="empty-ico">🔒</div><div class="empty-msg">Super Admin Access Required</div></div></div>';
    return;
  }

  root.innerHTML = `
    <div class="content-section">
      <div class="section-top">
        <h2 class="section-heading">Admin Users</h2>
        <button class="btn btn-sm" id="btn-new-admin">+ Add Admin</button>
      </div>
      <div class="message-box" style="border-color:var(--gray-300);color:var(--gray-600);background:var(--gray-50);text-align:left">
        <strong>Roles:</strong> Super Admin (full access) • Admin (manage products/dealers) • Viewer (read-only)
      </div>
      <table class="data-grid">
        <thead><tr><th>Role</th><th>Username</th><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
        <tbody>
          ${admins.map(a=>`
            <tr>
              <td><span class="status-badge ${a.role==='superadmin'?'status-delivered':a.role==='viewer'?'status-pending':'status-approved'}">${escapeHtml(a.role)}</span></td>
              <td><strong>${escapeHtml(a.username)}</strong></td>
              <td>${escapeHtml(a.dealerName||'—')}</td>
              <td>${escapeHtml(a.email||'—')}</td>
              <td>
                <div class="action-group">
                  <button class="btn btn-sm btn-outline" data-edit-admin="${escapeHtml(a.username)}">Edit</button>
                  ${a.role==='superadmin' ? '' : `<button class="btn btn-sm btn-danger" data-del-admin="${escapeHtml(a.username)}">Delete</button>`}
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-new-admin').addEventListener('click', ()=>openAdminModal(null));
  root.querySelectorAll('[data-edit-admin]').forEach(b=>b.addEventListener('click', ()=>{
    const u = users.find(x=>x.username===b.dataset.editAdmin);
    openAdminModal(u || null);
  }));
  root.querySelectorAll('[data-del-admin]').forEach(b=>b.addEventListener('click', ()=>deleteAdminUser(b.dataset.delAdmin)));
}

function openAdminModal(user){
  const isEdit = !!user;
  openModal(`
    <div class="modal-backdrop">
      <div class="modal-box">
        <div class="modal-head">
          <h2 class="modal-heading">${isEdit?'Edit Admin':'Add Admin User'}</h2>
          <button class="modal-close" data-close>×</button>
        </div>
        <div class="modal-body">
          <div class="field-row">
            <div class="form-group">
              <label class="form-label">Username *</label>
              <input id="adm-username" class="form-input" value="${escapeHtml(user?.username||'')}" ${isEdit?'disabled':''} />
            </div>
            <div class="form-group">
              <label class="form-label">Role *</label>
              <select id="adm-role" class="form-select">
                ${['superadmin','admin','viewer'].map(r=>`<option value="${r}" ${(user?.role||'admin')===r?'selected':''}>${r==='superadmin'?'Super Admin':(r==='viewer'?'Viewer':'Admin')}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field-row">
            <div class="form-group">
              <label class="form-label">Display Name *</label>
              <input id="adm-name" class="form-input" value="${escapeHtml(user?.dealerName||'')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Password ${isEdit?'(leave blank to keep)':'*'}</label>
              <input id="adm-password" type="password" class="form-input" value="" />
            </div>
          </div>
          <div class="field-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input id="adm-email" type="email" class="form-input" value="${escapeHtml(user?.email||'')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input id="adm-phone" class="form-input" value="${escapeHtml(user?.phone||'')}" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" id="btn-save-admin">${isEdit?'Update':'Add Admin'}</button>
            <button class="btn btn-outline" data-close>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `);
  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));
  document.getElementById('btn-save-admin').addEventListener('click', ()=>saveAdminUser(isEdit, user?.username));
}

function saveAdminUser(isEdit, existingUsername){
  if (currentUser.role !== 'superadmin'){
    showToast('Restricted', 'error');
    return;
  }
  const username = document.getElementById('adm-username').value.trim();
  const name = document.getElementById('adm-name').value.trim();
  const password = document.getElementById('adm-password').value;
  const email = document.getElementById('adm-email').value.trim();
  const phone = document.getElementById('adm-phone').value.trim();
  const role = document.getElementById('adm-role')?.value || 'admin';

  if (!username || !name){
    showToast('Please fill required fields', 'error');
    return;
  }
  if (!isEdit && !password){
    showToast('Password is required', 'error');
    return;
  }

  const users = store.users.get();

  if (isEdit){
    const existing = users.find(u => u.username === existingUsername);
    if (existing?.role === 'superadmin' && role !== 'superadmin'){
      const superCount = users.filter(u => u.role === 'superadmin').length;
      if (superCount <= 1){
        showToast('Cannot change role: at least one Super Admin required', 'error');
        return;
      }
    }
  }

  if (!isEdit){
    if (users.some(u => u.username === username)){
      showToast('Username already exists', 'error');
      return;
    }
    users.push({
      username, password, role,
      dealerCode: role === 'viewer' ? 'VIEW' : 'ADMIN',
      dealerName: name, email, phone
    });
    store.users.set(users);
    showToast('Admin user added');
  } else {
    const updated = users.map(u => {
      if (u.username !== existingUsername) return u;
      return { ...u, dealerName: name, email, phone, role, password: password ? password : u.password };
    });
    store.users.set(updated);
    showToast('Admin user updated');
  }
  closeModal();
  refresh();
}

function deleteAdminUser(username){
  if (currentUser.role !== 'superadmin'){ showToast('Restricted','error'); return; }
  if (username === currentUser.username){ showToast('Cannot delete your own account','error'); return; }
  
  const users = store.users.get();
  const target = users.find(u=>u.username===username);
  if (target?.role==='superadmin'){
    const superCount = users.filter(u=>u.role==='superadmin').length;
    if (superCount <= 1){ showToast('Cannot delete the last Super Admin','error'); return; }
  }
  if (!confirm(`Delete admin "${username}"?`)) return;
  store.users.set(users.filter(x=>x.username!==username));
  showToast('Admin deleted');
  refresh();
}

function openImportPrices(){
  openModal(importPricesModal());
  applyReadOnlyLock();
  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));

  const priceFileInput = document.getElementById('price-file');
  const preview = document.getElementById('price-preview');
  const btnApply = document.getElementById('btn-apply');
  let parsed = [];

  priceFileInput.addEventListener('change', async ()=>{
    const file = priceFileInput.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    try{
      parsed = parsePriceSheet(buf);
      if (parsed.length===0){
        preview.innerHTML = '<div class="message-box message-error">No valid rows found</div>';
        btnApply.disabled = true;
        return;
      }
      preview.innerHTML = `
        <table class="data-grid" style="margin-top:12px">
          <thead><tr><th>Dealer</th><th>Product</th><th>Price</th></tr></thead>
          <tbody>
            ${parsed.slice(0,50).map(r=>`<tr><td>${escapeHtml(r.dealerCode)}</td><td>${escapeHtml(r.productCode)}</td><td>$${fmtMoney(r.price)}</td></tr>`).join('')}
          </tbody>
        </table>
        ${parsed.length>50 ? `<div style="font-size:11px;color:var(--gray-600);margin-top:10px">Showing first 50 of ${parsed.length} rows</div>`:''}
      `;
      btnApply.disabled = false;
    }catch(e){
      preview.innerHTML = '<div class="message-box message-error">Failed to parse file</div>';
      btnApply.disabled = true;
    }
  });

  btnApply.addEventListener('click', ()=>{
    applyDealerPrices(parsed);
    closeModal();
  });
}

function openAssignModal(dealer){
  const products = store.products.get();
  const map = store.dealerProducts.get();
  const assigned = new Set(map[dealer.dealerCode] || []);

  openModal(`
    <div class="modal-backdrop">
      <div class="modal-box wide">
        <div class="modal-head">
          <h2 class="modal-heading">Assign Products → ${escapeHtml(dealer.dealerName)}</h2>
          <button class="modal-close" data-close>×</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom:16px">
            <button class="btn btn-sm btn-outline" id="btn-select-all">Select All</button>
            <button class="btn btn-sm btn-outline" id="btn-select-none">Select None</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;max-height:400px;overflow-y:auto">
            ${products.map(p=>`
              <label style="border:1px solid var(--gray-200);padding:14px;display:flex;gap:12px;align-items:flex-start;cursor:pointer;background:var(--white)">
                <input type="checkbox" class="assign-chk" value="${escapeHtml(p.code)}" ${assigned.has(p.code)?'checked':''} />
                <div>
                  <div style="font-size:13px;font-weight:500">${escapeHtml(p.name)}</div>
                  <div style="font-size:10px;color:var(--gray-500)">${escapeHtml(p.sku || p.code)} • ${escapeHtml(p.category)}</div>
                </div>
              </label>`).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn" id="btn-save-assign" ${canEdit?'':'disabled'}>Save Assignments</button>
            <button class="btn btn-outline" data-close>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `);
  applyReadOnlyLock();

  document.getElementById('btn-select-all').addEventListener('click', ()=>{
    document.querySelectorAll('.assign-chk').forEach(c=>c.checked=true);
  });
  document.getElementById('btn-select-none').addEventListener('click', ()=>{
    document.querySelectorAll('.assign-chk').forEach(c=>c.checked=false);
  });

  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));
  document.getElementById('btn-save-assign').addEventListener('click', ()=>{
    const selected = Array.from(document.querySelectorAll('.assign-chk')).filter(x=>x.checked).map(x=>x.value);
    const dp = store.dealerProducts.get();
    dp[dealer.dealerCode] = selected;
    store.dealerProducts.set(dp);
    showToast(`${selected.length} products assigned`);
    closeModal();
    refresh();
  });
}

function openDealerModal(dealer){
  const isEdit = !!dealer;
  openModal(`
    <div class="modal-backdrop">
      <div class="modal-box wide">
        <div class="modal-head">
          <h2 class="modal-heading">${isEdit?'Edit Dealer':'Add New Dealer'}</h2>
          <button class="modal-close" data-close>×</button>
        </div>
        <div class="modal-body">
          <div class="field-row">
            <div class="form-group">
              <label class="form-label">Dealer Code *</label>
              <input id="dlr-code" class="form-input" value="${escapeHtml(dealer?.dealerCode||'DLR')}" ${isEdit?'disabled':''} />
            </div>
            <div class="form-group">
              <label class="form-label">Pricing Tier *</label>
              <select id="dlr-tier" class="form-select">
                ${['Tier1','Tier2','Tier3','Tier4'].map(t=>`<option value="${t}" ${(dealer?.tier||'Tier1')===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Company Name *</label>
            <input id="dlr-name" class="form-input" value="${escapeHtml(dealer?.dealerName||'')}" />
          </div>
          <div class="field-row">
            <div class="form-group">
              <label class="form-label">Username *</label>
              <input id="dlr-username" class="form-input" value="${escapeHtml(dealer?.username||'')}" ${isEdit?'disabled':''} />
            </div>
            <div class="form-group">
              <label class="form-label">Password *</label>
              <input id="dlr-password" type="password" class="form-input" value="${escapeHtml(dealer?.password||'')}" />
            </div>
          </div>
          <div class="field-row">
            <div class="form-group">
              <label class="form-label">Contact Person</label>
              <input id="dlr-contact" class="form-input" value="${escapeHtml(dealer?.contactPerson||'')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input id="dlr-email" type="email" class="form-input" value="${escapeHtml(dealer?.email||'')}" />
            </div>
          </div>
          <div class="field-row">
            <div class="form-group">
              <label class="form-label">Phone *</label>
              <input id="dlr-phone" class="form-input" value="${escapeHtml(dealer?.phone||'')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Alt Phone</label>
              <input id="dlr-altphone" class="form-input" value="${escapeHtml(dealer?.altPhone||'')}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address *</label>
            <input id="dlr-address" class="form-input" value="${escapeHtml(dealer?.address||'')}" />
          </div>
          <div class="field-row-3">
            <div class="form-group">
              <label class="form-label">City *</label>
              <input id="dlr-city" class="form-input" value="${escapeHtml(dealer?.city||'')}" />
            </div>
            <div class="form-group">
              <label class="form-label">State *</label>
              <input id="dlr-state" class="form-input" value="${escapeHtml(dealer?.state||'')}" />
            </div>
            <div class="form-group">
              <label class="form-label">ZIP *</label>
              <input id="dlr-zip" class="form-input" value="${escapeHtml(dealer?.zipCode||'')}" />
            </div>
          </div>

          <div class="admin-notes-section">
            <div class="admin-notes-label">Billing Defaults</div>
            <div class="field-row">
              <div class="form-group">
                <label class="form-label">Billing Company</label>
                <input id="bill-company" class="form-input" value="${escapeHtml(dealer?.billCompany||dealer?.dealerName||'')}" />
              </div>
              <div class="form-group">
                <label class="form-label">Billing Contact</label>
                <input id="bill-name" class="form-input" value="${escapeHtml(dealer?.billName||'')}" />
              </div>
            </div>
            <div class="field-row">
              <div class="form-group">
                <label class="form-label">Billing Phone</label>
                <input id="bill-phone" class="form-input" value="${escapeHtml(dealer?.billPhone||'')}" />
              </div>
              <div class="form-group">
                <label class="form-label">Billing Email</label>
                <input id="bill-email" class="form-input" value="${escapeHtml(dealer?.billEmail||'')}" />
              </div>
            </div>
          </div>

          <div class="admin-notes-section">
            <div class="admin-notes-label">Internal Notes</div>
            <textarea id="dlr-notes" class="form-textarea">${escapeHtml(dealer?.adminNotes||'')}</textarea>
          </div>

          <div class="modal-footer">
            <button class="btn" id="btn-save-dealer" ${canEdit?'':'disabled'}>${isEdit?'Update Dealer':'Add Dealer'}</button>
            <button class="btn btn-outline" data-close>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `);
  applyReadOnlyLock();
  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));
  document.getElementById('btn-save-dealer').addEventListener('click', ()=>saveDealer(isEdit));
}

function saveDealer(isEdit){
  if (!canEdit){ showToast('Read-only access', 'error'); return; }
  const code = document.getElementById('dlr-code').value.trim();
  const tier = document.getElementById('dlr-tier').value;
  const name = document.getElementById('dlr-name').value.trim();
  const username = document.getElementById('dlr-username').value.trim();
  const password = document.getElementById('dlr-password').value;
  const contactPerson = document.getElementById('dlr-contact').value.trim();
  const email = document.getElementById('dlr-email').value.trim();
  const phone = document.getElementById('dlr-phone').value.trim();
  const altPhone = document.getElementById('dlr-altphone').value.trim();
  const address = document.getElementById('dlr-address').value.trim();
  const city = document.getElementById('dlr-city').value.trim();
  const state = document.getElementById('dlr-state').value.trim();
  const zipCode = document.getElementById('dlr-zip').value.trim();
  const adminNotes = document.getElementById('dlr-notes').value.trim();
  const billCompany = document.getElementById('bill-company')?.value.trim() || name;
  const billName = document.getElementById('bill-name')?.value.trim() || '';
  const billPhone = document.getElementById('bill-phone')?.value.trim() || phone;
  const billEmail = document.getElementById('bill-email')?.value.trim() || email;

  if (!code||!name||!username||!password||!email||!phone||!address||!city||!state||!zipCode){
    showToast('Please fill all required fields', 'error'); return;
  }

  const users = store.users.get();
  const dealerData = { 
    role:'dealer', dealerCode:code, tier, dealerName:name, username, password, 
    contactPerson, email, phone, altPhone, address, city, state, zipCode, country:'USA', 
    adminNotes, billCompany, billName, billPhone, billEmail,
    billAddress: address, billCity: city, billState: state, billZip: zipCode, billCountry: 'USA',
    billingContactName: billName, billingPhone: billPhone, billingEmail: billEmail
  };

  if (isEdit){
    store.users.set(users.map(u=>u.dealerCode===code?{...u,...dealerData}:u));
    showToast('Dealer updated');
  } else {
    if (users.some(u=>u.username===username) || users.some(u=>u.dealerCode===code)){
      showToast('Dealer code or username already exists', 'error'); return;
    }
    users.push(dealerData);
    store.users.set(users);
    const dp = store.dealerProducts.get();
    dp[code] = [];
    store.dealerProducts.set(dp);
    showToast('Dealer added');
  }
  closeModal();
  refresh();
}

function deleteDealer(code){
  if (!canEdit){ showToast('Read-only access', 'error'); return; }
  if (!confirm('Delete this dealer?')) return;
  store.users.set(store.users.get().filter(u=>u.dealerCode!==code));
  const dp = store.dealerProducts.get();
  delete dp[code];
  store.dealerProducts.set(dp);
  showToast('Dealer deleted');
  refresh();
}

function renderOrders(root){
  const orders = store.orders.get();
  root.innerHTML = `
    <div class="content-section">
      <div class="section-top">
        <h2 class="section-heading">Purchase Orders</h2>
      </div>
      <table class="data-grid">
        <thead><tr><th>Order ID</th><th>Dealer</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${orders.map(o=>`
            <tr>
              <td class="clickable" data-view="${escapeHtml(o.id)}"><strong>${escapeHtml(o.id)}</strong>${o.version>1?` (v${o.version})`:''}</td>
              <td>${escapeHtml(o.dealerName)}<br><small style="color:var(--gray-500)">${escapeHtml(o.dealerCode)}</small></td>
              <td>${o.items.length} items</td>
              <td><strong>$${fmtMoney(o.total)}</strong></td>
              <td>${new Date(o.date).toLocaleDateString()}</td>
              <td><span class="status-badge status-${escapeHtml(o.status)}">${escapeHtml(o.status).toUpperCase()}</span></td>
              <td>
                <select class="form-select" style="font-size:11px;padding:8px" data-status="${escapeHtml(o.id)}">
                  ${['pending','approved','preparing','delivered','rejected'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
                </select>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
      ${orders.length===0 ? '<div class="empty-zone"><div class="empty-ico">📋</div><div class="empty-msg">No Orders Yet</div></div>' : ''}
    </div>
  `;
  root.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click', ()=>viewOrder(el.dataset.view)));
  root.querySelectorAll('select[data-status]').forEach(sel=>sel.addEventListener('change', ()=>{
    if (!canEdit){
      showToast('Read-only access', 'error');
      const o = store.orders.get().find(x=>x.id===sel.dataset.status);
      if (o) sel.value = o.status;
      return;
    }
    setOrderStatus(sel.dataset.status, sel.value);
    showToast('Status updated');
    refresh();
  }));
}

function viewOrder(orderId){
  const order = store.orders.get().find(o=>o.id===orderId);
  if (!order) return;
  const url = generatePDFBlobUrl(order);
  openModal(`
    <div class="modal-backdrop">
      <div class="modal-box wide">
        <div class="modal-head">
          <h2 class="modal-heading">Order ${escapeHtml(order.id)}${order.version>1?` (v${order.version})`:''}</h2>
          <button class="modal-close" data-close>×</button>
        </div>
        <div class="modal-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
            <div style="background:var(--gray-50);padding:16px;border:1px solid var(--gray-200)">
              <div style="font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;color:var(--gray-600)">Dealer</div>
              <div style="font-size:14px;font-weight:500">${escapeHtml(order.dealerName)}</div>
              <div style="font-size:12px;color:var(--gray-600)">${escapeHtml(order.dealerCode)}</div>
            </div>
            <div style="background:var(--gray-50);padding:16px;border:1px solid var(--gray-200)">
              <div style="font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;color:var(--gray-600)">Summary</div>
              <div style="font-size:12px">Items: <strong>${order.items.length}</strong></div>
              <div style="font-size:12px">Total: <strong>$${fmtMoney(order.total)}</strong></div>
              <div style="font-size:12px">Status: <strong>${order.status.toUpperCase()}</strong></div>
            </div>
          </div>
          <iframe src="${url}" style="width:100%;height:500px;border:1px solid var(--gray-200)"></iframe>
          <div class="modal-footer">
            <a class="btn btn-outline" href="${url}" download="${escapeHtml(order.id)}.pdf">Download PDF</a>
            <button class="btn btn-outline" data-close>Close</button>
          </div>
        </div>
      </div>
    </div>
  `);
  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', ()=>{
    URL.revokeObjectURL(url);
    closeModal();
  }));
}

function renderSettings(root){
  const settings = store.settings.get();
  root.innerHTML = `
    <div class="content-section">
      <div class="section-top">
        <h2 class="section-heading">System Settings</h2>
      </div>
      <div style="max-width:600px">
        <div class="form-group">
          <label class="form-label">Low Stock Threshold (sqft)</label>
          <input id="set-lowstock" type="number" class="form-input" value="${settings.lowStockThreshold||50}" />
          <div style="font-size:11px;color:var(--gray-500);margin-top:6px">Products with stock below this will be flagged as "Low Stock"</div>
        </div>
        <div class="form-group">
          <label class="form-label">Show Box Pricing</label>
          <select id="set-boxpricing" class="form-select">
            <option value="true" ${settings.showBoxPricing?'selected':''}>Yes - Show box prices in product list</option>
            <option value="false" ${!settings.showBoxPricing?'selected':''}>No - Only show per sqft pricing</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Company Address</label>
          <input id="set-address" class="form-input" value="${escapeHtml(settings.companyAddress||'')}" />
        </div>
        <div class="field-row">
          <div class="form-group">
            <label class="form-label">Company Phone</label>
            <input id="set-phone" class="form-input" value="${escapeHtml(settings.companyPhone||'')}" />
          </div>
          <div class="form-group">
            <label class="form-label">Company Email</label>
            <input id="set-email" class="form-input" value="${escapeHtml(settings.companyEmail||'')}" />
          </div>
        </div>
        <button class="btn" id="btn-save-settings" ${canEdit?'':'disabled'}>Save Settings</button>
      </div>
    </div>
  `;
  document.getElementById('btn-save-settings').addEventListener('click', ()=>{
    if (!canEdit){ showToast('Read-only access', 'error'); return; }
    const s = store.settings.get();
    s.lowStockThreshold = Number(document.getElementById('set-lowstock').value) || 50;
    s.showBoxPricing = document.getElementById('set-boxpricing').value === 'true';
    s.companyAddress = document.getElementById('set-address').value.trim();
    s.companyPhone = document.getElementById('set-phone').value.trim();
    s.companyEmail = document.getElementById('set-email').value.trim();
    store.settings.set(s);
    showToast('Settings saved');
    refresh();
  });
}

function refresh(){
  renderStats();
  renderTabs();
  renderTab();
  updateNotifBadge();
}

function openBrandModal(){
  if (!canEdit){ showToast('Viewer accounts are read-only','error'); return; }
  const s = store.settings.get();
  openModal(`
    <div class="modal-backdrop">
      <div class="modal-box">
        <div class="modal-head">
          <h2 class="modal-heading">Brand Settings</h2>
          <button class="modal-close" data-close>×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Brand Name</label>
            <input id="brand-name" class="form-input" value="${escapeHtml(s.brandName||'TILES OF LUCCA')}" />
          </div>
          <div class="form-group">
            <label class="form-label">Brand Subtitle</label>
            <input id="brand-subtitle" class="form-input" value="${escapeHtml(s.brandSubtitle||'Extraordinary Tiles')}" />
          </div>
          <div class="form-group">
            <label class="form-label">Brand Logo</label>
            <input id="brand-file" type="file" class="form-input" accept="image/*" />
            <div id="brand-preview" style="margin-top:12px"></div>
          </div>
          <div class="modal-footer">
            <button class="btn" id="btn-save-brand">Save</button>
            <button class="btn btn-outline" id="btn-remove-brand">Remove Logo</button>
            <button class="btn btn-outline" data-close>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `);

  const preview = document.getElementById('brand-preview');
  preview.innerHTML = s.brandLogoDataUrl
    ? `<img src="${escapeHtml(s.brandLogoDataUrl)}" style="max-width:200px;max-height:60px;object-fit:contain;border:1px solid var(--gray-300);padding:10px" />`
    : '<span style="font-size:11px;color:var(--gray-500)">No logo uploaded</span>';

  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));

  document.getElementById('brand-file').addEventListener('change', (e)=>{
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      preview.innerHTML = `<img src="${escapeHtml(String(reader.result))}" style="max-width:200px;max-height:60px;object-fit:contain;border:1px solid var(--gray-300);padding:10px" />`;
      preview.dataset.dataUrl = String(reader.result);
    };
    reader.readAsDataURL(f);
  });

  document.getElementById('btn-remove-brand').addEventListener('click', ()=>{
    const settings = store.settings.get();
    settings.brandLogoDataUrl = '';
    store.settings.set(settings);
    applyBranding();
    showToast('Logo removed');
    closeModal();
  });

  document.getElementById('btn-save-brand').addEventListener('click', ()=>{
    const settings = store.settings.get();
    settings.brandName = document.getElementById('brand-name').value.trim() || 'TILES OF LUCCA';
    settings.brandSubtitle = document.getElementById('brand-subtitle').value.trim() || 'Extraordinary Tiles';
    if (preview.dataset.dataUrl) settings.brandLogoDataUrl = preview.dataset.dataUrl;
    store.settings.set(settings);
    applyBranding();
    showToast('Brand settings saved');
    closeModal();
    refresh();
  });
}
