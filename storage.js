// modules/storage.js - Tiles of Lucca
export const KEYS = {
  USERS: 'lucca_users',
  PRODUCTS: 'lucca_products',
  DEALER_PRODUCTS: 'lucca_dealerProducts',
  CATEGORIES: 'lucca_categories',
  FAVORITES: 'lucca_favorites',
  ORDERS: 'lucca_orders',
  DEALER_PRICES: 'lucca_dealerPrices',
  SETTINGS: 'lucca_settings',
  NOTIFICATIONS: 'lucca_notifications',
};

export const initUsers = [
  { username:'superadmin', password:'superadmin', role:'superadmin', dealerCode:'SUPER', dealerName:'Super Admin', email:'superadmin@tilesoflucca.com', phone:'+1 201-340-4823' },
  { username:'admin1', password:'admin1', role:'admin', dealerCode:'ADMIN1', dealerName:'Admin One', email:'admin1@tilesoflucca.com', phone:'+1 201-340-4824' },
  { username:'viewer1', password:'viewer1', role:'viewer', dealerCode:'VIEW001', dealerName:'Viewer One', email:'viewer1@tilesoflucca.com', phone:'+1 201-340-4825' },
  {
    username:'dealer1', password:'dealer1', role:'dealer', dealerCode:'DLR001', dealerName:'Manhattan Stone & Tile',
    tier:'Tier1', email:'orders@manhattanstone.com', phone:'+1 212-555-0100', altPhone:'+1 212-555-0101',
    contactPerson:'John Smith', address:'245 5th Avenue, Suite 200', city:'New York', state:'NY', zipCode:'10016',
    country:'USA', adminNotes:'VIP dealer since 2020\nPayment terms: Net 60\nCredit limit: $150,000\nPreferred: Zellige, Terrazzo'
    , billCompany:'Manhattan Stone & Tile LLC', billName:'John Smith', billPhone:'+1 212-555-0100', billEmail:'accounts@manhattanstone.com'
    , billAddress:'245 5th Avenue, Suite 200', billCity:'New York', billState:'NY', billZip:'10016', billCountry:'USA'
    , billingContactName:'John Smith', billingPhone:'+1 212-555-0100', billingEmail:'accounts@manhattanstone.com'
  },
  {
    username:'dealer2', password:'dealer2', role:'dealer', dealerCode:'DLR002', dealerName:'LA Design Materials',
    tier:'Tier2', email:'purchasing@ladesignmaterials.com', phone:'+1 310-555-0200', altPhone:'',
    contactPerson:'Sarah Johnson', address:'8500 Melrose Avenue', city:'Los Angeles', state:'CA', zipCode:'90069',
    country:'USA', adminNotes:'Interior design focused\nNet 30 terms\nSpecializes in Natural Stone'
    , billCompany:'LA Design Materials Inc', billName:'Sarah Johnson', billPhone:'+1 310-555-0200', billEmail:'sarah@ladesignmaterials.com'
    , billAddress:'8500 Melrose Avenue', billCity:'Los Angeles', billState:'CA', billZip:'90069', billCountry:'USA'
    , billingContactName:'Sarah Johnson', billingPhone:'+1 310-555-0200', billingEmail:'sarah@ladesignmaterials.com'
  },
  {
    username:'dealer3', password:'dealer3', role:'dealer', dealerCode:'DLR003', dealerName:'Miami Tile Gallery',
    tier:'Tier3', email:'info@miamitile.com', phone:'+1 305-555-0300', altPhone:'',
    contactPerson:'Carlos Rodriguez', address:'2000 Biscayne Blvd', city:'Miami', state:'FL', zipCode:'33137',
    country:'USA', adminNotes:'New dealer - 2024\nNet 15 terms\nResidential projects'
    , billCompany:'Miami Tile Gallery LLC', billName:'Carlos Rodriguez', billPhone:'+1 305-555-0300', billEmail:'carlos@miamitile.com'
    , billAddress:'2000 Biscayne Blvd', billCity:'Miami', billState:'FL', billZip:'33137', billCountry:'USA'
    , billingContactName:'Carlos Rodriguez', billingPhone:'+1 305-555-0300', billingEmail:'carlos@miamitile.com'
  }
];

export const initProducts = [
  // ZELLIGE COLLECTION
  { code:'MB-LI-Z4001', sku:'Z4001', name:'4x4 Zellige White', category:'Zellige', subcategory:'4x4 Zellige', 
    price:18.50, unit:'sqft', boxSize:5.33, boxPrice:98.61, stock:450, 
    description:'Hand-cut Moroccan zellige tiles in pure white. Each piece unique with natural color variations.', 
    finish:'Glossy', size:'4"x4"', thickness:'3/8"', material:'Clay',
    images:[], tierPrices:{Tier1:18.50,Tier2:19.25,Tier3:20.00,Tier4:21.50}, imageIds:[] },
  
  { code:'MB-LI-Z4002', sku:'Z4002', name:'4x4 Zellige Sea Green', category:'Zellige', subcategory:'4x4 Zellige',
    price:19.75, unit:'sqft', boxSize:5.33, boxPrice:105.27, stock:280,
    description:'Traditional zellige in stunning sea green. Artisan-made in Fez, Morocco.',
    finish:'Glossy', size:'4"x4"', thickness:'3/8"', material:'Clay',
    images:[], tierPrices:{Tier1:19.75,Tier2:20.50,Tier3:21.25,Tier4:22.75}, imageIds:[] },

  { code:'MB-LI-Z4003', sku:'Z4003', name:'4x4 Zellige Midnight Blue', category:'Zellige', subcategory:'4x4 Zellige',
    price:21.00, unit:'sqft', boxSize:5.33, boxPrice:111.93, stock:195,
    description:'Deep midnight blue zellige with characteristic undulating surface.',
    finish:'Glossy', size:'4"x4"', thickness:'3/8"', material:'Clay',
    images:[], tierPrices:{Tier1:21.00,Tier2:21.75,Tier3:22.50,Tier4:24.00}, imageIds:[] },

  { code:'MB-LI-Z2601', sku:'Z2601', name:'2x6 Zellige Terracotta', category:'Zellige', subcategory:'2x6 Zellige',
    price:22.50, unit:'sqft', boxSize:4.0, boxPrice:90.00, stock:320,
    description:'Warm terracotta zellige in elongated 2x6 format. Perfect for backsplashes.',
    finish:'Glossy', size:'2"x6"', thickness:'3/8"', material:'Clay',
    images:[], tierPrices:{Tier1:22.50,Tier2:23.25,Tier3:24.00,Tier4:25.50}, imageIds:[] },

  // TERRAZZO COLLECTION
  { code:'MB-LI-T001', sku:'T001', name:'Terrazzo Bianco Classico', category:'Terrazzo', subcategory:'Terrazzo Tiles',
    price:32.00, unit:'sqft', boxSize:10.76, boxPrice:344.32, stock:180,
    description:'Classic Italian terrazzo with white marble chips on white cement base. Timeless elegance.',
    finish:'Honed', size:'16"x16"', thickness:'5/8"', material:'Cement/Marble',
    images:[], tierPrices:{Tier1:32.00,Tier2:33.50,Tier3:35.00,Tier4:37.50}, imageIds:[] },

  { code:'MB-LI-T002', sku:'T002', name:'Terrazzo Grigio Milano', category:'Terrazzo', subcategory:'Terrazzo Tiles',
    price:34.50, unit:'sqft', boxSize:10.76, boxPrice:371.22, stock:145,
    description:'Sophisticated grey terrazzo with mixed marble aggregate. Made in Italy.',
    finish:'Honed', size:'16"x16"', thickness:'5/8"', material:'Cement/Marble',
    images:[], tierPrices:{Tier1:34.50,Tier2:36.00,Tier3:37.50,Tier4:40.00}, imageIds:[] },

  { code:'MB-LI-T003', sku:'T003', name:'Terrazzo Rosa Venezia', category:'Terrazzo', subcategory:'Terrazzo Tiles',
    price:38.00, unit:'sqft', boxSize:10.76, boxPrice:408.88, stock:95,
    description:'Blush pink terrazzo with delicate marble chips. Venetian inspired design.',
    finish:'Honed', size:'16"x16"', thickness:'5/8"', material:'Cement/Marble',
    images:[], tierPrices:{Tier1:38.00,Tier2:39.50,Tier3:41.00,Tier4:44.00}, imageIds:[] },

  // NATURAL STONE
  { code:'MB-LI-NS101', sku:'NS101', name:'Carrara Marble Honed', category:'Natural Stone', subcategory:'Marble Tiles',
    price:28.00, unit:'sqft', boxSize:8.0, boxPrice:224.00, stock:520,
    description:'Premium Italian Carrara marble. Classic white with grey veining.',
    finish:'Honed', size:'12"x24"', thickness:'3/8"', material:'Marble',
    images:[], tierPrices:{Tier1:28.00,Tier2:29.50,Tier3:31.00,Tier4:33.00}, imageIds:[] },

  { code:'MB-LI-NS102', sku:'NS102', name:'Calacatta Gold Polished', category:'Natural Stone', subcategory:'Marble Tiles',
    price:45.00, unit:'sqft', boxSize:8.0, boxPrice:360.00, stock:85,
    description:'Luxurious Calacatta with distinctive gold veining. Statement piece.',
    finish:'Polished', size:'12"x24"', thickness:'3/8"', material:'Marble',
    images:[], tierPrices:{Tier1:45.00,Tier2:47.00,Tier3:49.00,Tier4:52.50}, imageIds:[] },

  { code:'MB-LI-NS103', sku:'NS103', name:'Nero Marquina Honed', category:'Natural Stone', subcategory:'Marble Tiles',
    price:35.00, unit:'sqft', boxSize:8.0, boxPrice:280.00, stock:210,
    description:'Deep black Spanish marble with striking white veins.',
    finish:'Honed', size:'12"x24"', thickness:'3/8"', material:'Marble',
    images:[], tierPrices:{Tier1:35.00,Tier2:36.50,Tier3:38.00,Tier4:40.50}, imageIds:[] },

  { code:'MB-LI-NS201', sku:'NS201', name:'Classic Travertine Filled', category:'Natural Stone', subcategory:'Travertine Tiles',
    price:15.50, unit:'sqft', boxSize:8.0, boxPrice:124.00, stock:680,
    description:'Warm ivory travertine with filled and honed finish. Versatile classic.',
    finish:'Filled & Honed', size:'12"x12"', thickness:'3/8"', material:'Travertine',
    images:[], tierPrices:{Tier1:15.50,Tier2:16.25,Tier3:17.00,Tier4:18.25}, imageIds:[] },

  { code:'MB-LI-NS202', sku:'NS202', name:'Noce Travertine Tumbled', category:'Natural Stone', subcategory:'Travertine Tiles',
    price:14.00, unit:'sqft', boxSize:8.0, boxPrice:112.00, stock:540,
    description:'Rich walnut brown travertine with tumbled antique finish.',
    finish:'Tumbled', size:'12"x12"', thickness:'3/8"', material:'Travertine',
    images:[], tierPrices:{Tier1:14.00,Tier2:14.75,Tier3:15.50,Tier4:16.75}, imageIds:[] },

  // CERAMIC
  { code:'MB-LI-C001', sku:'C001', name:'Block White Matte', category:'Ceramic', subcategory:'Block Tiles',
    price:8.50, unit:'sqft', boxSize:12.0, boxPrice:102.00, stock:1200,
    description:'Clean white ceramic with subtle texture. Contemporary minimalist design.',
    finish:'Matte', size:'4"x12"', thickness:'5/16"', material:'Ceramic',
    images:[], tierPrices:{Tier1:8.50,Tier2:8.95,Tier3:9.40,Tier4:10.10}, imageIds:[] },

  { code:'MB-LI-C002', sku:'C002', name:'Bold Subway Sage', category:'Ceramic', subcategory:'Bold Subway Tiles',
    price:9.25, unit:'sqft', boxSize:10.0, boxPrice:92.50, stock:890,
    description:'Modern subway tile in sophisticated sage green. Glossy finish.',
    finish:'Glossy', size:'3"x12"', thickness:'5/16"', material:'Ceramic',
    images:[], tierPrices:{Tier1:9.25,Tier2:9.70,Tier3:10.15,Tier4:10.90}, imageIds:[] },

  { code:'MB-LI-C003', sku:'C003', name:'Chelsea Hexagon Black', category:'Ceramic', subcategory:'Chelsea Tiles',
    price:12.00, unit:'sqft', boxSize:8.5, boxPrice:102.00, stock:450,
    description:'Striking black hexagon tiles. Perfect for accent walls and floors.',
    finish:'Matte', size:'6" Hex', thickness:'5/16"', material:'Ceramic',
    images:[], tierPrices:{Tier1:12.00,Tier2:12.50,Tier3:13.00,Tier4:14.00}, imageIds:[] },

  // PORCELAIN
  { code:'MB-LI-P001', sku:'P001', name:'Heritage Cement Grey', category:'Porcelain', subcategory:'Heritage Tiles',
    price:11.50, unit:'sqft', boxSize:11.0, boxPrice:126.50, stock:720,
    description:'Encaustic-look porcelain with cement tile pattern. Durable and easy care.',
    finish:'Matte', size:'8"x8"', thickness:'3/8"', material:'Porcelain',
    images:[], tierPrices:{Tier1:11.50,Tier2:12.00,Tier3:12.50,Tier4:13.50}, imageIds:[] },

  { code:'MB-LI-P002', sku:'P002', name:'Stardust Eclipse Ocean Blue', category:'Porcelain', subcategory:'Stardust Tiles',
    price:14.00, unit:'sqft', boxSize:10.5, boxPrice:147.00, stock:380,
    description:'Terrazzo-inspired porcelain in ocean blue. Indoor/outdoor rated.',
    finish:'Matte', size:'24"x24"', thickness:'3/8"', material:'Porcelain',
    images:[], tierPrices:{Tier1:14.00,Tier2:14.75,Tier3:15.50,Tier4:16.50}, imageIds:[] },

  { code:'MB-LI-P003', sku:'P003', name:'Clay Terracotta Look', category:'Porcelain', subcategory:'Clay Tiles',
    price:10.75, unit:'sqft', boxSize:11.0, boxPrice:118.25, stock:560,
    description:'Authentic terracotta appearance in durable porcelain. Rustic charm.',
    finish:'Natural', size:'12"x12"', thickness:'3/8"', material:'Porcelain',
    images:[], tierPrices:{Tier1:10.75,Tier2:11.25,Tier3:11.75,Tier4:12.65}, imageIds:[] },

  // TERRACOTTA
  { code:'MB-LI-TC001', sku:'TC001', name:'Cotto Umbria Natural', category:'Terracotta', subcategory:'Terracotta Tiles',
    price:18.00, unit:'sqft', boxSize:6.0, boxPrice:108.00, stock:290,
    description:'Authentic Italian terracotta from Umbria. Hand-made, naturally aged.',
    finish:'Natural', size:'6"x12"', thickness:'5/8"', material:'Terracotta',
    images:[], tierPrices:{Tier1:18.00,Tier2:18.90,Tier3:19.80,Tier4:21.25}, imageIds:[] },

  { code:'MB-LI-TC002', sku:'TC002', name:'Terracotta Hexagon Antique', category:'Terracotta', subcategory:'Terracotta Tiles',
    price:22.00, unit:'sqft', boxSize:5.5, boxPrice:121.00, stock:165,
    description:'Reclaimed-look terracotta hexagons. Old-world Mediterranean character.',
    finish:'Antiqued', size:'8" Hex', thickness:'3/4"', material:'Terracotta',
    images:[], tierPrices:{Tier1:22.00,Tier2:23.10,Tier3:24.20,Tier4:26.00}, imageIds:[] },

  // MOSAIC
  { code:'MB-LI-M001', sku:'M001', name:'Piano Carrara Mosaic', category:'Natural Stone', subcategory:'Piano Mosaic Tiles',
    price:42.00, unit:'sqft', boxSize:4.8, boxPrice:201.60, stock:125,
    description:'Geometric piano key pattern in Carrara marble. Elegant statement piece.',
    finish:'Honed', size:'12"x12" Sheet', thickness:'3/8"', material:'Marble',
    images:[], tierPrices:{Tier1:42.00,Tier2:44.00,Tier3:46.00,Tier4:49.50}, imageIds:[] },

  { code:'MB-LI-M002', sku:'M002', name:'Mosaico Piazza Verde Alpi', category:'Natural Stone', subcategory:'Mosaico Piazza Tiles',
    price:48.00, unit:'sqft', boxSize:4.8, boxPrice:230.40, stock:78,
    description:'Piazza pattern mosaic in Verde Alpi and Carrara marble combination.',
    finish:'Honed', size:'12"x12" Sheet', thickness:'3/8"', material:'Marble',
    images:[], tierPrices:{Tier1:48.00,Tier2:50.00,Tier3:52.00,Tier4:56.00}, imageIds:[] },

  // SLABS
  { code:'MB-LI-SL001', sku:'SL001', name:'Terrazzo Slab Bianco', category:'Slabs', subcategory:'Terrazzo Slabs',
    price:85.00, unit:'sqft', boxSize:1, boxPrice:85.00, stock:45,
    description:'Large format terrazzo slab for countertops and feature walls. Custom cut available.',
    finish:'Polished', size:'120"x60"', thickness:'3/4"', material:'Terrazzo',
    images:[], tierPrices:{Tier1:85.00,Tier2:89.00,Tier3:93.00,Tier4:100.00}, imageIds:[] },

  { code:'MB-LI-SL002', sku:'SL002', name:'Calacatta Marble Slab', category:'Slabs', subcategory:'Natural Stone Slabs',
    price:125.00, unit:'sqft', boxSize:1, boxPrice:125.00, stock:22,
    description:'Premium Calacatta marble slab with dramatic veining. Bookmatched pairs available.',
    finish:'Polished', size:'110"x65"', thickness:'3/4"', material:'Marble',
    images:[], tierPrices:{Tier1:125.00,Tier2:131.00,Tier3:137.00,Tier4:147.00}, imageIds:[] }
];

export const initDealerProducts = { 
  'DLR001': ['MB-LI-Z4001','MB-LI-Z4002','MB-LI-Z4003','MB-LI-Z2601','MB-LI-T001','MB-LI-T002','MB-LI-T003','MB-LI-NS101','MB-LI-NS102','MB-LI-NS103','MB-LI-NS201','MB-LI-NS202','MB-LI-M001','MB-LI-M002','MB-LI-SL001','MB-LI-SL002'],
  'DLR002': ['MB-LI-NS101','MB-LI-NS102','MB-LI-NS103','MB-LI-NS201','MB-LI-NS202','MB-LI-T001','MB-LI-T002','MB-LI-M001','MB-LI-SL002'],
  'DLR003': ['MB-LI-Z4001','MB-LI-Z4002','MB-LI-C001','MB-LI-C002','MB-LI-C003','MB-LI-P001','MB-LI-P002','MB-LI-P003','MB-LI-TC001','MB-LI-TC002']
};

export const initCategories = ['Zellige','Terrazzo','Natural Stone','Ceramic','Porcelain','Terracotta','Slabs'];

export const initSettings = { 
  lowStockThreshold: 50, 
  brandLogoDataUrl: "", 
  brandName: "TILES OF LUCCA",
  brandSubtitle: "Extraordinary Tiles",
  companyAddress: "500 Nordhoff Pl, Ste 6, Englewood, NJ 07631",
  companyPhone: "+1 201-340-4823",
  companyEmail: "info@tilesoflucca.com",
  currency: "USD",
  priceUnit: "sqft",
  showBoxPricing: true
};

function readJSON(key, fallback){
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
function writeJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

export const store = {
  users: { get: ()=>readJSON(KEYS.USERS, initUsers), set: (v)=>writeJSON(KEYS.USERS,v) },
  products: { get: ()=>readJSON(KEYS.PRODUCTS, initProducts), set: (v)=>writeJSON(KEYS.PRODUCTS,v) },
  dealerProducts: { get: ()=>readJSON(KEYS.DEALER_PRODUCTS, initDealerProducts), set: (v)=>writeJSON(KEYS.DEALER_PRODUCTS,v) },
  categories: { get: ()=>readJSON(KEYS.CATEGORIES, initCategories), set: (v)=>writeJSON(KEYS.CATEGORIES,v) },
  favorites: { get: ()=>readJSON(KEYS.FAVORITES, {}), set: (v)=>writeJSON(KEYS.FAVORITES,v) },
  orders: { get: ()=>readJSON(KEYS.ORDERS, []), set: (v)=>writeJSON(KEYS.ORDERS,v) },
  dealerPrices: { get: ()=>readJSON(KEYS.DEALER_PRICES, {}), set: (v)=>writeJSON(KEYS.DEALER_PRICES,v) },
  settings: { get: ()=>readJSON(KEYS.SETTINGS, initSettings), set: (v)=>writeJSON(KEYS.SETTINGS,v) },
  notifications: { get: ()=>readJSON(KEYS.NOTIFICATIONS, []), set: (v)=>writeJSON(KEYS.NOTIFICATIONS,v) },
};

export function getPrice(dealerCode, productCode, basePrice){
  const prices = store.dealerPrices.get();
  const v = prices?.[dealerCode]?.[productCode];
  return (v == null ? Number(basePrice) : Number(v));
}

export function getDisplayPrice(user, product){
  const prices = store.dealerPrices.get();
  const override = prices?.[user?.dealerCode]?.[product?.code];
  if (override != null && override !== '') return Number(override);
  const tier = user?.tier;
  const tierPrice = product?.tierPrices?.[tier];
  if (tierPrice != null && tierPrice !== '') return Number(tierPrice);
  return Number(product?.price ?? 0);
}

export function getBoxPrice(user, product){
  const unitPrice = getDisplayPrice(user, product);
  const boxSize = product?.boxSize || 1;
  return unitPrice * boxSize;
}

export function formatPrice(amount, includeUnit = true){
  const settings = store.settings.get();
  const formatted = Number(amount).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
  if (includeUnit && settings.priceUnit){
    return `$${formatted}/${settings.priceUnit}`;
  }
  return `$${formatted}`;
}

export function getStockBadge(stock){
  const { lowStockThreshold=50 } = store.settings.get() || {};
  if (stock === 0) return { cls:'stock-none', txt:'Out of Stock' };
  if (stock <= lowStockThreshold) return { cls:'stock-low', txt:'Low Stock' };
  return { cls:'stock-ok', txt:'In Stock' };
}

export function addNotification(title, text, dealerCode=null){
  const list = store.notifications.get();
  const notif = { id: Date.now(), title, text, time: new Date().toISOString(), read:false, dealerCode };
  list.unshift(notif);
  store.notifications.set(list);
  return notif;
}
