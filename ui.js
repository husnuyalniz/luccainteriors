// modules/ui.js
export function showToast(message, type='success'){
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}

const MODAL_ID = 'modal-container';

export function closeModal(){
  const modal = document.getElementById(MODAL_ID);
  if (modal) modal.innerHTML = '';
}

export function openModal(html){
  const modal = document.getElementById(MODAL_ID);
  if (!modal) { console.warn('Missing #'+MODAL_ID); return; }
  modal.innerHTML = html;
}

export function fmtMoney(n){
  const x = Number(n || 0);
  return x.toLocaleString(undefined,{minimumFractionDigits:0, maximumFractionDigits:2});
}

export function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

export function updateBadge(el, count){
  if (!el) return;
  if (count > 0){
    el.textContent = String(count);
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}
