// modules/poPdf.js
// Uses jsPDF (loaded via CDN in admin.html/dealer.html)
import { fmtMoney } from './ui.js';

import { store } from './storage.js';
export function generatePDFBlobUrl(order){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const settings = store.settings.get();
  const brandLogo = settings.brandLogoDataUrl || '';
  const brandName = settings.brandName || 'LUCCA';
  const dealerLogo = order.dealerLogoDataUrl || '';

  // Header logos / brand
  if (brandLogo){
    try { doc.addImage(brandLogo, 'PNG', 20, 10, 55, 18); } catch(e){ try{ doc.addImage(brandLogo,'JPEG',20,10,55,18);}catch(_){ } }
  } else {
    doc.setFontSize(24);
    doc.setFont(undefined,'bold');
    doc.text(String(brandName).toUpperCase(), 20, 20);
    doc.setFontSize(10);
    doc.setFont(undefined,'normal');
    doc.text('Interior', 20, 26);
  }
  if (dealerLogo){
    try { doc.addImage(dealerLogo, 'PNG', 145, 10, 45, 18); } catch(e){ try{ doc.addImage(dealerLogo,'JPEG',145,10,45,18);}catch(_){ } }
  }

  // If brand logo exists, still add the 'Interior' subline for identity
  if (brandLogo){
    doc.setFontSize(10);
    doc.setFont(undefined,'normal');
    doc.text('Interior', 20, 30);
  }


  doc.setFontSize(16);
  doc.setFont(undefined,'bold');
  doc.text('PURCHASE ORDER', 105, 20, { align:'center' });

  doc.setFontSize(10);
  doc.setFont(undefined,'normal');
  doc.text(`PO Number: ${order.id}${order.version>1?` (v${order.version})`:''}`, 150, 30);
  doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 150, 36);

  let y = 50;
  doc.setFontSize(11); doc.setFont(undefined,'bold'); doc.text('DEALER', 20, y);
  doc.setFontSize(10); doc.setFont(undefined,'normal');
  y += 7;
  doc.text(`${order.dealerName} (${order.dealerCode})`, 20, y);


  y += 10;
    // BILLING (left) + SHIPPING (right)
  const leftX = 20;
  const rightX = 110;
  const colW = 80;

  const startY = y;
  doc.setFontSize(11); doc.setFont(undefined,'bold');
  doc.text('BILLING', leftX, startY);
  doc.text('SHIPPING', rightX, startY);

  doc.setFontSize(10); doc.setFont(undefined,'normal');
  const contentY = startY + 7;

  const billCompany = order.billCompany || order.dealerName || '';
  const billLine1 = `${billCompany}`;
  const billLine2 = `${order.billingContactName || ''} | ${order.billingPhone || ''}`;
  const billLine3 = `${order.billingEmail || ''}`;
  const billAddr = [order.billAddress, order.billCity, order.billState, order.billZip, order.billCountry].filter(Boolean).join(', ');

  const shipLine1 = `${order.shippingContactName || ''} | ${order.shippingPhone || ''}`;
  const shipLine2 = `${order.shippingEmail || ''}`;
  const shipCompany = order.shipCompany || '';
  const shipAddr = [order.shipAddress, order.shipCity, order.shipState, order.shipZip, order.shipCountry].filter(Boolean).join(', ');
  const shipDelivery = [
    order.deliveryType ? `Delivery: ${String(order.deliveryType).toUpperCase()}` : '',
    (order.liftGate ? 'Lift Gate: YES' : 'Lift Gate: NO')
  ].filter(Boolean).join(' • ');
  const shipNotes = order.shipNotes || '';

  function writeBlock(x, y0, lines){
    let yy = y0;
    for (const line of lines){
      const t = String(line || '').trim();
      if (!t) continue;
      const split = doc.splitTextToSize(t, colW);
      doc.text(split, x, yy);
      yy += (split.length * 6);
    }
    return yy;
  }

  const billLines = [billLine1, billLine2, billLine3, billAddr];
  const shipLines = [shipCompany, shipLine1, shipLine2, shipAddr, shipDelivery, shipNotes ? `Notes: ${shipNotes}` : ''];

  const billEndY = writeBlock(leftX, contentY, billLines);
  const shipEndY = writeBlock(rightX, contentY, shipLines);

  y = Math.max(billEndY, shipEndY) + 8;y += 12;
  doc.setFontSize(11); doc.setFont(undefined,'bold'); doc.text('ITEMS', 20, y);
  y += 8;
  doc.setFontSize(9); doc.setFont(undefined,'bold');
  doc.text('Code', 20, y);
  doc.text('Name', 45, y);
  doc.text('Qty', 140, y, {align:'right'});
  doc.text('Price', 165, y, {align:'right'});
  y += 5;
  doc.setFont(undefined,'normal');
  doc.line(20, y, 190, y);
  y += 6;

  let total = 0;
  for (const it of order.items){
    const line = Number(it.price) * Number(it.quantity);
    total += line;
    doc.text(String(it.code), 20, y);
    doc.text(String(it.name).slice(0,42), 45, y);
    doc.text(String(it.quantity), 140, y, {align:'right'});
    doc.text('$'+fmtMoney(it.price), 165, y, {align:'right'});
    y += 6;
    if (y > 260){ doc.addPage(); y = 30; }
  }

  y += 6;
  doc.setFont(undefined,'bold');
  doc.text('TOTAL', 140, y, {align:'right'});
  doc.text('$'+fmtMoney(total), 190, y, {align:'right'});

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}