// modules/auth.js
export function getCurrentUser(){
  const raw = sessionStorage.getItem('currentUser');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function requireAuth(requiredRole=null){
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return null; }

  // requiredRole can be:
  // - null (any logged-in user)
  // - string (single role)
  // - array of strings (any-of roles)
  if (requiredRole){
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(user.role)){
      window.location.href = 'index.html';
      return null;
    }
  }
  return user;
}

export function logout(){
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

export function goBack(){
  if (confirm('Go back to previous page? Any unsaved changes will be lost.')) window.history.back();
}
