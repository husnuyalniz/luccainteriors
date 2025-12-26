// modules/login.js
import { store } from './storage.js';

function applyBranding(){
  const s = store.settings.get();
  const img = document.getElementById('brand-logo-img');
  const txt = document.getElementById('brand-logo-text');
  if (txt) txt.textContent = (s.brandName || 'LUCCA');
  if (img && s.brandLogoDataUrl){
    img.src = s.brandLogoDataUrl; img.classList.remove('hidden');
    if (txt) txt.classList.add('hidden');
  }
}
applyBranding();


document.getElementById('login-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  const users = store.users.get();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user){
    const err = document.getElementById('error-message');
    err.innerHTML = '<div class="message-box message-error">Invalid credentials</div>';
    setTimeout(()=>err.innerHTML='', 2500);
    return;
  }

  sessionStorage.setItem('currentUser', JSON.stringify(user));
  window.location.href = (user.role === 'admin' || user.role === 'superadmin' || user.role === 'viewer') ? 'admin.html' : 'dealer.html';
});