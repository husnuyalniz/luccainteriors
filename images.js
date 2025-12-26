// modules/images.js
// Client-side image "uploads" using IndexedDB (no backend required).
// Stores Blobs in IDB and returns ids. Products store only the ids in localStorage.
//
// NOTE: Object URLs should be revoked when not needed; we cache URLs and reuse them
// during the session for performance.

const DB_NAME = 'lucca_media';
const DB_VERSION = 1;
const STORE = 'images';

let _dbPromise = null;
let _urlCache = new Map(); // id -> objectURL

function openDB(){
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = ()=>{
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)){
        db.createObjectStore(STORE, { keyPath:'id' });
      }
    };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
  return _dbPromise;
}

function txStore(mode='readonly'){
  return openDB().then(db=>{
    const tx = db.transaction(STORE, mode);
    return tx.objectStore(STORE);
  });
}

function makeId(){
  // reasonably unique for demo use
  return 'img_' + Math.random().toString(36).slice(2,10) + '_' + Date.now().toString(36);
}

export async function saveImageFiles(fileList){
  const files = Array.from(fileList || []);
  if (files.length === 0) return [];
  const store = await txStore('readwrite');
  const ids = [];
  await Promise.all(files.map(async (file)=>{
    const id = makeId();
    ids.push(id);
    const rec = { id, name:file.name, type:file.type || 'application/octet-stream', blob:file, createdAt: Date.now() };
    await new Promise((resolve, reject)=>{
      const req = store.put(rec);
      req.onsuccess = ()=>resolve();
      req.onerror = ()=>reject(req.error);
    });
  }));
  return ids;
}

export async function deleteImages(ids){
  const list = Array.from(ids || []).filter(Boolean);
  if (list.length === 0) return;
  const store = await txStore('readwrite');
  await Promise.all(list.map(async (id)=>{
    // revoke cached URL if exists
    const url = _urlCache.get(id);
    if (url){
      URL.revokeObjectURL(url);
      _urlCache.delete(id);
    }
    await new Promise((resolve, reject)=>{
      const req = store.delete(id);
      req.onsuccess = ()=>resolve();
      req.onerror = ()=>reject(req.error);
    });
  }));
}

export async function getImageUrl(id){
  if (!id) return null;
  if (_urlCache.has(id)) return _urlCache.get(id);
  const store = await txStore('readonly');
  const rec = await new Promise((resolve, reject)=>{
    const req = store.get(id);
    req.onsuccess = ()=>resolve(req.result || null);
    req.onerror = ()=>reject(req.error);
  });
  if (!rec?.blob) return null;
  const url = URL.createObjectURL(rec.blob);
  _urlCache.set(id, url);
  return url;
}

export async function getProductPrimaryImageUrl(product){
  // product.images can still contain URL strings; prefer those first.
  const direct = (product?.images || product?.imageUrl ? (product.images?.[0] || product.imageUrl) : null);
  if (direct) return direct;
  const id = product?.imageIds?.[0];
  if (!id) return null;
  return await getImageUrl(id);
}

export function clearImageUrlCache(){
  for (const url of _urlCache.values()){
    try { URL.revokeObjectURL(url); } catch {}
  }
  _urlCache.clear();
}
