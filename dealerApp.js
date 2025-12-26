// modules/dealerApp.js - Tiles of Lucca Dealer Portal
import { requireAuth, logout, goBack } from './auth.js';
import { store, getDisplayPrice, getStockBadge, getBoxPrice } from './storage.js';
import { getProductPrimaryImageUrl } from './images.js';
import { showToast, openModal, closeModal, fmtMoney, escapeHtml, updateBadge } from './ui.js';
import { generatePDFBlobUrl } from './poPdf.js';
import { addOrder, nextOrderId, bumpVersion } from './orders.js';

const currentUser = requireAuth('dealer');
if (!currentUser) throw new Error('Unauthorized');

function applyBranding(){
  const s = store.settings.get();
  const img = document.getElementById('brand-logo-img');
  const txt = document.getElementById('brand-logo-text');
  if (txt) txt.textContent = (s.brandName || 'TILES OF LUCCA');
  if (img && s.brandLogoDataUrl){ img.src = s.brandLogoDataUrl; img.classList.remove('hidden'); if (txt) txt.classList.add('hidden'); }
}
applyBranding();

document.getElementById('user-name').textContent = currentUser.dealerName;
document.getElementById('user-code').textContent = currentUser.dealerCode + ' • ' + (currentUser.tier || 'Tier1');
document.getElementById('btn-logout').addEventListener('click', logout);
document.getElementById('btn-back').addEventListener('click', goBack);

const cartBtn = document.getElementById('cart-btn');
const cartBadge = document.getElementById('cart-badge');
const notifBadge = document.getElementById('notif-badge');

let cart = [];
let currentView = 'products';
let selectedCategory = 'all';

function getMyData(){
  const products = store.products.get();
  const dealerProducts = store.dealerProducts.get();
  const favorites = store.favorites.get();
  const orders = store.orders.get();
  const settings = store.settings.get();
  const myProducts = products.filter(p => (dealerProducts[currentUser.dealerCode]||[]).includes(p.code));
  const myFavs = favorites[currentUser.dealerCode] || [];
  const myOrders = orders.filter(o=>o.dealerCode===currentUser.dealerCode);
  return { products, myProducts, myFavs, myOrders, favorites, settings };
}

function getUserRecord(){
  const users = store.users.get();
  return users.find(u=>u.role==='dealer' && u.dealerCode===currentUser.dealerCode) || currentUser;
}

function init(){ renderStats(); renderView(); updateCartBadge(); wireNotif(); }
init();

cartBtn.addEventListener('click', showCartModal);
const profileBtn = document.getElementById('profile-btn');
if (profileBtn){ profileBtn.addEventListener('click', showProfileModal); }

function renderStats(){
  const { myProducts, myFavs, myOrders } = getMyData();
  const categories = [...new Set(myProducts.map(p=>p.category))];
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-box" data-view="products"><div class="stat-number">${myProducts.length}</div><div class="stat-text">Products</div></div>
    <div class="stat-box" data-view="products"><div class="stat-number">${categories.length}</div><div class="stat-text">Categories</div></div>
    <div class="stat-box" data-view="products"><div class="stat-number">${myFavs.length}</div><div class="stat-text">Favorites</div></div>
    <div class="stat-box" data-view="orders"><div class="stat-number">${myOrders.length}</div><div class="stat-text">Orders</div></div>
  `;
  document.querySelectorAll('.stat-box[data-view]').forEach(el=>el.addEventListener('click', ()=>switchView(el.dataset.view)));
}

function switchView(view){ currentView = view; renderView(); }
function renderView(){ if (currentView==='orders') return renderOrders(); return renderProducts(); }

function renderProducts(){
  const { myProducts, myFavs, settings } = getMyData();
  const categories = [...new Set(myProducts.map(p=>p.category))];
  const showBox = settings.showBoxPricing;

  document.getElementById('view-selector').innerHTML = `
    <div style="display:flex;gap:12px;margin-bottom:35px;flex-wrap:wrap">
      <div class="category-chip ${selectedCategory==='all'?'active':''}" data-cat="all">All (${myProducts.length})</div>
      ${categories.map(cat=>`<div class="category-chip ${selectedCategory===cat?'active':''}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)} (${myProducts.filter(p=>p.category===cat).length})</div>`).join('')}
      <div class="category-chip ${selectedCategory==='favorites'?'active':''}" data-cat="favorites">♥ Favorites (${myFavs.length})</div>
    </div>
  `;
  document.querySelectorAll('[data-cat]').forEach(x=>x.addEventListener('click', ()=>{ selectedCategory=x.dataset.cat; renderProducts(); }));

  const filtered = myProducts.filter(p=>{
    if (selectedCategory==='favorites') return myFavs.includes(p.code);
    if (selectedCategory==='all') return true;
    return p.category === selectedCategory;
  });

  let html = '<div class="product-grid">';
  filtered.forEach(p=>{
    const isFav = myFavs.includes(p.code);
    const badge = getStockBadge(p.stock);
    const displayPrice = getDisplayPrice(currentUser, p);
    const boxPrice = displayPrice * (p.boxSize || 1);
    const isSpecial = displayPrice !== Number(p.price);
    html += `
      <div class="product-card">
        <button data-fav="${escapeHtml(p.code)}" class="product-fav ${isFav?'active':''}">${isFav ? '♥' : '♡'}</button>
        <div class="product-image">${(p.imageIds?.length) ? `<img data-pimg="${escapeHtml(p.code)}" src="" />` : 'NO IMAGE'}</div>
        <div class="product-info">
          <div class="product-meta"><span class="product-sku">${escapeHtml(p.sku || p.code)}</span><span class="product-stock-badge ${badge.cls}">${badge.txt}</span></div>
          <div class="product-name">${escapeHtml(p.name)}</div>
          <div class="product-category">${escapeHtml(p.subcategory || p.category)}</div>
          <div class="product-specs">${p.size?`<span>${escapeHtml(p.size)}</span>`:''}${p.finish?`<span>${escapeHtml(p.finish)}</span>`:''}</div>
          <div class="product-footer">
            <div class="product-pricing">
              ${isSpecial?`<div class="product-price-original">$${fmtMoney(p.price)}/sqft</div><div class="product-savings">Your Price</div>`:''}
              <div class="product-price-unit">$${fmtMoney(displayPrice)}/sqft</div>
              ${showBox && p.boxSize?`<div class="product-price-box">$${fmtMoney(boxPrice)}/box</div>`:''}
            </div>
            <button class="btn btn-sm" data-add="${escapeHtml(p.code)}" ${p.stock===0?'disabled':''}>${p.stock===0?'Out of Stock':'Add to Cart'}</button>
          </div>
        </div>
      </div>`;
  });
  html += '</div>';
  document.getElementById('main-view').innerHTML = filtered.length ? html : '<div class="empty-zone"><div class="empty-ico">📦</div><div class="empty-msg">No Products</div></div>';
  hydrateProductImages(filtered);
  document.querySelectorAll('[data-fav]').forEach(b=>b.addEventListener('click', ()=>toggleFavorite(b.dataset.fav)));
  document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click', ()=>addToCart(b.dataset.add)));
}

async function hydrateProductImages(list){
  await Promise.all(list.map(async (p)=>{
    const el = document.querySelector(`img[data-pimg="${p.code}"]`);
    if (!el) return;
    const src = await getProductPrimaryImageUrl(p);
    if (src) el.src = src;
  }));
}

function toggleFavorite(code){
  const all = store.favorites.get();
  const list = all[currentUser.dealerCode] || [];
  const i = list.indexOf(code);
  if (i>-1){ list.splice(i,1); showToast('Removed from favorites'); }
  else { list.push(code); showToast('Added to favorites'); }
  all[currentUser.dealerCode] = list;
  store.favorites.set(all);
  renderProducts(); renderStats();
}

function addToCart(code){
  const { myProducts } = getMyData();
  const p = myProducts.find(x=>x.code===code);
  if (!p) return;
  const price = getDisplayPrice(currentUser, p);
  const existing = cart.find(i=>i.code===code);
  if (existing) existing.quantity++;
  else cart.push({ code:p.code, sku:p.sku||p.code, name:p.name, price:Number(price), quantity:1, boxSize:p.boxSize||1 });
  updateCartBadge();
  showToast('Added to cart');
}

function updateCartBadge(){ updateBadge(cartBadge, cart.reduce((s,i)=>s+i.quantity,0)); }

function showCartModal(){
  if (cart.length===0){ showToast('Cart is empty','error'); return; }
  const u = getUserRecord();
  const totalSqft = cart.reduce((s,i)=>s+(i.quantity*i.boxSize),0);
  const totalAmt = cart.reduce((s,i)=>s+(i.price*i.boxSize*i.quantity),0);
  openModal(`
    <div class="modal-backdrop"><div class="modal-box wide">
      <div class="modal-head"><h2 class="modal-heading">Shopping Cart</h2><button class="modal-close" data-close>×</button></div>
      <div class="modal-body">
        <table class="data-grid"><thead><tr><th>Product</th><th>$/sqft</th><th>Box</th><th>Qty</th><th>Sqft</th><th>Total</th><th></th></tr></thead>
        <tbody>${cart.map((it,idx)=>`<tr>
          <td><strong>${escapeHtml(it.name)}</strong><br><small>${escapeHtml(it.sku)}</small></td>
          <td>$${fmtMoney(it.price)}</td><td>${it.boxSize}</td>
          <td><button data-q="${idx}" data-d="-1" class="btn btn-sm btn-outline" style="padding:4px 8px">−</button> ${it.quantity} <button data-q="${idx}" data-d="1" class="btn btn-sm btn-outline" style="padding:4px 8px">+</button></td>
          <td>${fmtMoney(it.quantity*it.boxSize)}</td><td><strong>$${fmtMoney(it.price*it.boxSize*it.quantity)}</strong></td>
          <td><button class="btn btn-sm btn-danger" data-rm="${idx}">×</button></td>
        </tr>`).join('')}</tbody>
        <tfoot><tr style="background:var(--gray-50)"><td colspan="4" style="text-align:right"><strong>Totals:</strong></td><td><strong>${fmtMoney(totalSqft)} sqft</strong></td><td><strong>$${fmtMoney(totalAmt)}</strong></td><td></td></tr></tfoot>
        </table>
        <div class="modal-footer"><button class="btn" id="btn-po">Generate PO</button><button class="btn btn-outline" id="btn-clear">Clear</button><button class="btn btn-outline" data-close>Continue</button></div>
      </div>
    </div></div>
  `);
  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));
  document.querySelectorAll('[data-rm]').forEach(b=>b.addEventListener('click', ()=>{ cart.splice(Number(b.dataset.rm),1); updateCartBadge(); cart.length===0?closeModal():showCartModal(); }));
  document.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click', ()=>{ const idx=Number(b.dataset.q),d=Number(b.dataset.d),q=cart[idx].quantity+d; if(q<1)return; cart[idx].quantity=q; showCartModal(); }));
  document.getElementById('btn-clear').addEventListener('click', ()=>{ if(!confirm('Clear cart?'))return; cart=[]; updateCartBadge(); closeModal(); showToast('Cart cleared'); });
  document.getElementById('btn-po').addEventListener('click', showPOForm);
}

let editingOrderId = null;
function getEditingOrder(){ return editingOrderId ? store.orders.get().find(o=>o.id===editingOrderId) : null; }

function showPOForm(){
  const existing = getEditingOrder();
  const urec = getUserRecord();
  const billName = existing?.billingContactName ?? urec.billName ?? '';
  const billPhone = existing?.billingPhone ?? urec.billPhone ?? '';
  const billEmail = existing?.billingEmail ?? urec.billEmail ?? '';
  const shipName = existing?.shippingContactName ?? '';
  const shipPhone = existing?.shippingPhone ?? '';
  const shipEmail = existing?.shippingEmail ?? '';
  const shipCompany = existing?.shipCompany ?? urec.dealerName ?? '';
  const shipAddress = existing?.shipAddress ?? urec.address ?? '';
  const shipCity = existing?.shipCity ?? urec.city ?? '';
  const shipState = existing?.shipState ?? urec.state ?? '';
  const shipZip = existing?.shipZip ?? urec.zipCode ?? '';
  const deliveryType = existing?.deliveryType ?? 'commercial';
  const liftGate = Boolean(existing?.liftGate ?? false);
  const shipNotes = existing?.shipNotes ?? '';

  closeModal();
  openModal(`
    <div class="modal-backdrop"><div class="modal-box wide">
      <div class="modal-head"><h2 class="modal-heading">${editingOrderId?'Edit PO':'Generate PO'}</h2><button class="modal-close" data-close>×</button></div>
      <div class="modal-body">
        <div style="background:var(--gray-50);padding:20px;border:1px solid var(--gray-200);margin-bottom:20px">
          <div style="font-size:10px;font-weight:600;letter-spacing:2px;margin-bottom:12px;color:var(--gray-600)">BILLING (Admin Managed)</div>
          <div class="field-row">
            <div class="form-group"><label class="form-label">Name</label><input id="bill-name" class="form-input" disabled value="${escapeHtml(billName)}" /></div>
            <div class="form-group"><label class="form-label">Phone</label><input id="bill-phone" class="form-input" disabled value="${escapeHtml(billPhone)}" /></div>
          </div>
          <div class="form-group"><label class="form-label">Email</label><input id="bill-email" class="form-input" disabled value="${escapeHtml(billEmail)}" /></div>
        </div>
        <div style="background:var(--gray-50);padding:20px;border:1px solid var(--gray-200);margin-bottom:20px">
          <div style="font-size:10px;font-weight:600;letter-spacing:2px;margin-bottom:12px;color:var(--gray-600)">SHIPPING</div>
          <div class="field-row">
            <div class="form-group"><label class="form-label">Contact Name *</label><input id="ship-name" class="form-input" value="${escapeHtml(shipName)}" /></div>
            <div class="form-group"><label class="form-label">Phone *</label><input id="ship-phone" class="form-input" value="${escapeHtml(shipPhone)}" /></div>
          </div>
          <div class="form-group"><label class="form-label">Email *</label><input id="ship-email" class="form-input" value="${escapeHtml(shipEmail)}" /></div>
          <div class="form-group"><label class="form-label">Company</label><input id="ship-company" class="form-input" value="${escapeHtml(shipCompany)}" /></div>
          <div class="form-group"><label class="form-label">Address *</label><input id="ship-address" class="form-input" value="${escapeHtml(shipAddress)}" /></div>
          <div class="field-row-3">
            <div class="form-group"><label class="form-label">City *</label><input id="ship-city" class="form-input" value="${escapeHtml(shipCity)}" /></div>
            <div class="form-group"><label class="form-label">State *</label><input id="ship-state" class="form-input" value="${escapeHtml(shipState)}" /></div>
            <div class="form-group"><label class="form-label">ZIP *</label><input id="ship-zip" class="form-input" value="${escapeHtml(shipZip)}" /></div>
          </div>
        </div>
        <div style="background:var(--gray-50);padding:20px;border:1px solid var(--gray-200);margin-bottom:20px">
          <div style="font-size:10px;font-weight:600;letter-spacing:2px;margin-bottom:12px;color:var(--gray-600)">DELIVERY</div>
          <div style="display:flex;gap:20px;align-items:center;margin-bottom:12px">
            <label><input type="radio" name="deliveryType" value="commercial" ${deliveryType==='commercial'?'checked':''} /> Commercial</label>
            <label><input type="radio" name="deliveryType" value="residential" ${deliveryType==='residential'?'checked':''} /> Residential</label>
            <label><input type="checkbox" id="lift-gate" ${liftGate?'checked':''} /> Lift Gate Required</label>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><textarea id="ship-notes" class="form-textarea">${escapeHtml(shipNotes)}</textarea></div>
        </div>
        <div class="modal-footer"><button class="btn" id="btn-submit-po">${editingOrderId?'Update':'Create'} PO</button><button class="btn btn-outline" data-close>Cancel</button></div>
      </div>
    </div></div>
  `);
  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', ()=>{ closeModal(); editingOrderId=null; }));
  document.getElementById('btn-submit-po').addEventListener('click', submitPO);
}

function submitPO(){
  const billName = document.getElementById('bill-name').value.trim();
  const billPhone = document.getElementById('bill-phone').value.trim();
  const billEmail = document.getElementById('bill-email').value.trim();
  const shipName = document.getElementById('ship-name').value.trim();
  const shipPhone = document.getElementById('ship-phone').value.trim();
  const shipEmail = document.getElementById('ship-email').value.trim();
  const shipCompany = document.getElementById('ship-company')?.value.trim() || '';
  const shipAddress = document.getElementById('ship-address')?.value.trim() || '';
  const shipCity = document.getElementById('ship-city')?.value.trim() || '';
  const shipState = document.getElementById('ship-state')?.value.trim() || '';
  const shipZip = document.getElementById('ship-zip')?.value.trim() || '';
  const deliveryType = document.querySelector('input[name="deliveryType"]:checked')?.value || 'commercial';
  const liftGate = Boolean(document.getElementById('lift-gate')?.checked);
  const shipNotes = document.getElementById('ship-notes')?.value.trim() || '';
  const urec = getUserRecord();
  const billCompany = urec.billCompany || urec.dealerName || '';
  const billAddress = urec.billAddress || urec.address || '';
  const billCity = urec.billCity || urec.city || '';
  const billState = urec.billState || urec.state || '';
  const billZip = urec.billZip || urec.zipCode || '';

  if (!shipName||!shipPhone||!shipEmail||!shipAddress||!shipCity||!shipState||!shipZip){
    showToast('Please fill all required fields','error'); return;
  }

  const totalSqft = cart.reduce((s,i)=>s+(i.quantity*i.boxSize),0);
  const total = cart.reduce((s,i)=>s+(i.price*i.boxSize*i.quantity),0);

  if (editingOrderId){
    const orders = store.orders.get();
    const existing = orders.find(o=>o.id===editingOrderId);
    if (!existing){ showToast('Order not found','error'); return; }
    const updated = bumpVersion({ ...existing, items:cart.map(x=>({...x})), total, totalSqft,
      billingContactName:billName, billingPhone:billPhone, billingEmail:billEmail, billCompany, billAddress, billCity, billState, billZip, billCountry:'USA',
      shippingContactName:shipName, shippingPhone:shipPhone, shippingEmail:shipEmail, shipCompany, shipAddress, shipCity, shipState, shipZip, shipCountry:'USA',
      deliveryType, liftGate, shipNotes
    });
    store.orders.set([updated, ...orders.filter(o=>o.id!==editingOrderId)]);
    showToast('PO updated');
    editingOrderId = null; cart = []; updateCartBadge(); closeModal(); renderStats(); renderView();
    return;
  }

  const order = {
    id: nextOrderId(), version: 1, dealerCode: currentUser.dealerCode, dealerName: currentUser.dealerName,
    dealerLogoDataUrl: currentUser.logoDataUrl || '', date: new Date().toISOString(), status: 'pending',
    items: cart.map(x=>({...x})), total, totalSqft,
    billingContactName:billName, billingPhone:billPhone, billingEmail:billEmail, billCompany, billAddress, billCity, billState, billZip, billCountry:'USA',
    shippingContactName:shipName, shippingPhone:shipPhone, shippingEmail:shipEmail, shipCompany, shipAddress, shipCity, shipState, shipZip, shipCountry:'USA',
    deliveryType, liftGate, shipNotes
  };
  addOrder(order);
  showToast('PO created');
  cart = []; updateCartBadge(); closeModal(); renderStats(); renderView();
}

function renderOrders(){
  const { myOrders } = getMyData();
  document.getElementById('view-selector').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:35px">
      <h2 style="font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase">My Orders</h2>
      <button class="btn btn-sm btn-outline" id="btn-back-products">← Back to Products</button>
    </div>
  `;
  document.getElementById('btn-back-products').addEventListener('click', ()=>switchView('products'));

  document.getElementById('main-view').innerHTML = `
    <table class="data-grid"><thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Sqft</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${myOrders.map(o=>`<tr>
      <td class="clickable" data-view="${escapeHtml(o.id)}"><strong>${escapeHtml(o.id)}</strong>${o.version>1?` (v${o.version})`:''}</td>
      <td>${new Date(o.date).toLocaleDateString()}</td><td>${o.items.length}</td><td>${fmtMoney(o.totalSqft||0)}</td>
      <td><strong>$${fmtMoney(o.total)}</strong></td><td><span class="status-badge status-${o.status}">${o.status.toUpperCase()}</span></td>
      <td>${o.status==='pending'?`<button class="btn btn-sm" data-edit="${escapeHtml(o.id)}">Edit</button>`:''}</td>
    </tr>`).join('')}</tbody></table>
    ${myOrders.length===0?'<div class="empty-zone"><div class="empty-ico">📋</div><div class="empty-msg">No Orders</div></div>':''}
  `;
  document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click', ()=>viewOrder(el.dataset.view)));
  document.querySelectorAll('[data-edit]').forEach(el=>el.addEventListener('click', ()=>editOrder(el.dataset.edit)));
}

function viewOrder(orderId){
  const order = store.orders.get().find(o=>o.id===orderId);
  if (!order) return;
  const url = generatePDFBlobUrl(order);
  openModal(`
    <div class="modal-backdrop"><div class="modal-box wide">
      <div class="modal-head"><h2 class="modal-heading">PO ${escapeHtml(order.id)}${order.version>1?` (v${order.version})`:''}</h2><button class="modal-close" data-close>×</button></div>
      <div class="modal-body">
        <iframe src="${url}" style="width:100%;height:500px;border:1px solid var(--gray-200)"></iframe>
        <div class="modal-footer"><a class="btn btn-outline" href="${url}" download="${escapeHtml(order.id)}.pdf">Download PDF</a><button class="btn btn-outline" data-close>Close</button></div>
      </div>
    </div></div>
  `);
  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', ()=>{ URL.revokeObjectURL(url); closeModal(); }));
}

function editOrder(orderId){
  const order = store.orders.get().find(o=>o.id===orderId);
  if (!order) return;
  cart = order.items.map(i=>({...i}));
  updateCartBadge();
  editingOrderId = orderId;
  showPOForm();
}

function showProfileModal(){
  const u = getUserRecord();
  openModal(`
    <div class="modal-backdrop"><div class="modal-box wide">
      <div class="modal-head"><h2 class="modal-heading">Company Profile</h2><button class="modal-close" data-close>×</button></div>
      <div class="modal-body">
        <div style="background:var(--gray-50);padding:20px;border:1px solid var(--gray-200);margin-bottom:20px">
          <div style="font-size:10px;font-weight:600;letter-spacing:2px;margin-bottom:12px;color:var(--gray-600)">BILLING (Admin Managed - Read Only)</div>
          <div class="field-row">
            <div class="form-group"><label class="form-label">Company</label><input class="form-input" disabled value="${escapeHtml(u.billCompany||u.dealerName||'')}" /></div>
            <div class="form-group"><label class="form-label">Contact</label><input class="form-input" disabled value="${escapeHtml(u.billName||'')}" /></div>
          </div>
          <div class="field-row">
            <div class="form-group"><label class="form-label">Phone</label><input class="form-input" disabled value="${escapeHtml(u.billPhone||'')}" /></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" disabled value="${escapeHtml(u.billEmail||'')}" /></div>
          </div>
        </div>
        <div style="background:var(--gray-50);padding:20px;border:1px solid var(--gray-200);margin-bottom:20px">
          <div style="font-size:10px;font-weight:600;letter-spacing:2px;margin-bottom:12px;color:var(--gray-600)">SHIPPING DEFAULTS</div>
          <div class="field-row">
            <div class="form-group"><label class="form-label">Company</label><input id="p-ship-company" class="form-input" value="${escapeHtml(u.shipCompany||u.dealerName||'')}" /></div>
            <div class="form-group"><label class="form-label">Contact</label><input id="p-ship-name" class="form-input" value="${escapeHtml(u.shipName||'')}" /></div>
          </div>
          <div class="field-row">
            <div class="form-group"><label class="form-label">Phone</label><input id="p-ship-phone" class="form-input" value="${escapeHtml(u.shipPhone||'')}" /></div>
            <div class="form-group"><label class="form-label">Email</label><input id="p-ship-email" class="form-input" value="${escapeHtml(u.shipEmail||'')}" /></div>
          </div>
          <div class="form-group"><label class="form-label">Address</label><input id="p-ship-address" class="form-input" value="${escapeHtml(u.shipAddress||u.address||'')}" /></div>
          <div class="field-row-3">
            <div class="form-group"><label class="form-label">City</label><input id="p-ship-city" class="form-input" value="${escapeHtml(u.shipCity||u.city||'')}" /></div>
            <div class="form-group"><label class="form-label">State</label><input id="p-ship-state" class="form-input" value="${escapeHtml(u.shipState||u.state||'')}" /></div>
            <div class="form-group"><label class="form-label">ZIP</label><input id="p-ship-zip" class="form-input" value="${escapeHtml(u.shipZip||u.zipCode||'')}" /></div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn" id="p-save">Save Defaults</button><button class="btn btn-outline" data-close>Close</button></div>
      </div>
    </div></div>
  `);
  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));
  document.getElementById('p-save').addEventListener('click', saveProfileDefaults);
}

function saveProfileDefaults(){
  const fields = {
    shipCompany: document.getElementById('p-ship-company').value.trim(),
    shipName: document.getElementById('p-ship-name').value.trim(),
    shipPhone: document.getElementById('p-ship-phone').value.trim(),
    shipEmail: document.getElementById('p-ship-email').value.trim(),
    shipAddress: document.getElementById('p-ship-address').value.trim(),
    shipCity: document.getElementById('p-ship-city').value.trim(),
    shipState: document.getElementById('p-ship-state').value.trim(),
    shipZip: document.getElementById('p-ship-zip').value.trim()
  };
  persistUserFields(fields);
  showToast('Defaults saved');
  closeModal();
}

function persistUserFields(fields){
  const users = store.users.get();
  const updated = users.map(u => u.dealerCode === currentUser.dealerCode ? { ...u, ...fields } : u);
  store.users.set(updated);
}

function wireNotif(){
  document.getElementById('notif-btn').addEventListener('click', ()=>{
    const all = store.notifications.get().filter(n=>!n.dealerCode || n.dealerCode===currentUser.dealerCode);
    openModal(`
      <div class="modal-backdrop"><div class="modal-box">
        <div class="modal-head"><h2 class="modal-heading">Notifications</h2><button class="modal-close" data-close>×</button></div>
        <div class="modal-body">
          ${all.length===0?'<div class="empty-zone"><div class="empty-ico">🔔</div><div class="empty-msg">No notifications</div></div>':
            all.map(n=>`<div style="padding:14px 0;border-bottom:1px solid var(--gray-200)">
              <div style="font-size:13px;font-weight:600">${escapeHtml(n.title)}</div>
              <div style="font-size:12px;color:var(--gray-600);margin-top:4px">${escapeHtml(n.text)}</div>
              <div style="font-size:10px;color:var(--gray-500);margin-top:6px">${new Date(n.time).toLocaleString()}</div>
            </div>`).join('')}
        </div>
      </div></div>
    `);
    document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click', closeModal));
    store.notifications.set(store.notifications.get().map(n=>({...n,read:true})));
    updateNotif();
  });
  updateNotif();
}

function updateNotif(){
  const count = store.notifications.get().filter(n=>!n.read && (!n.dealerCode || n.dealerCode===currentUser.dealerCode)).length;
  updateBadge(notifBadge, count);
}
