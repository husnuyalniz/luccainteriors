// modules/excelImport.js
// Uses SheetJS (xlsx) loaded via CDN in admin.html
import { store } from './storage.js';
import { showToast, escapeHtml } from './ui.js';

export function parsePriceSheet(arrayBuffer){
  const wb = XLSX.read(arrayBuffer, { type:'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
  // Expect columns: Dealer Code | Product Code | Price
  const normalized = rows.map(r => ({
    dealerCode: String(r['Dealer Code'] ?? r['dealerCode'] ?? r['DealerCode'] ?? '').trim(),
    productCode: String(r['Product Code'] ?? r['productCode'] ?? r['ProductCode'] ?? '').trim(),
    price: Number(r['Price'] ?? r['price'] ?? 0),
  })).filter(x => x.dealerCode && x.productCode && !Number.isNaN(x.price));
  return normalized;
}

export function applyDealerPrices(items){
  const prices = store.dealerPrices.get();
  for (const it of items){
    if (!prices[it.dealerCode]) prices[it.dealerCode] = {};
    prices[it.dealerCode][it.productCode] = it.price;
  }
  store.dealerPrices.set(prices);
  showToast(`Imported ${items.length} prices`);
}

export function importPricesModal(){
  return `
  <div class="modal-backdrop">
    <div class="modal-box wide">
      <div class="modal-head">
        <h2 class="modal-heading">Import Prices (Excel)</h2>
        <button class="modal-close" data-close>×</button>
      </div>
      <div class="modal-body">
        <div style="padding:18px;border:1px solid var(--gray-300);margin-bottom:18px">
          <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">
            Expected columns
          </div>
          <div style="font-size:12px;color:var(--gray-600)">
            Dealer Code | Product Code | Price
          </div>
        </div>

        <input type="file" id="price-file" accept=".xlsx,.xls" class="form-input" />
        <div id="price-preview" style="margin-top:18px"></div>

        <div class="modal-footer">
          <button class="btn" id="btn-apply" disabled>Apply Import</button>
          <button class="btn btn-outline" data-close>Cancel</button>
        </div>
      </div>
    </div>
  </div>`;
}
