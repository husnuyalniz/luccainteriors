// modules/orders.js
import { store } from './storage.js';

export function listOrders(){ return store.orders.get(); }
export function saveOrders(list){ store.orders.set(list); }

export function updateOrderStatus(id, status){
  const orders = listOrders();
  const updated = orders.map(o => o.id === id ? { ...o, status } : o);
  saveOrders(updated);
}

export function addOrder(order){
  const orders = listOrders();
  orders.unshift(order);
  saveOrders(orders);
}

export function nextOrderId(){
  return 'PO-' + Math.random().toString(36).slice(2,8).toUpperCase();
}

export function bumpVersion(existing){
  return { ...existing, version: (existing.version||1)+1, date: new Date().toISOString(), status:'pending' };
}
