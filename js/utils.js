import { BASE_COUPONS, PRODUCTS } from './data.js';
import { store } from './state.js';

export const fmt = n => '₹' + Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
export const fmtInt = n => '₹' + Number(n).toLocaleString('en-IN');
export const fmtDate = ts => new Date(ts).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'});
export const fmtTime = d => { const t = d instanceof Date ? d : new Date(typeof d === 'number' ? d : Date.now()); return String(t.getHours()).padStart(2,'0') + ':' + String(t.getMinutes()).padStart(2,'0'); };

export const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

export function stars(rating, size = 12) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(rating);
    const half = !filled && i - 0.5 <= rating;
    s += `<span style="font-size:${size}px;color:${filled||half?'var(--gold)':'var(--dark-border)'}">${filled ? '★' : half ? '⯨' : '★'}</span>`;
  }
  return s;
}

export const hexToRgba = (hex, a) => {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
};

export function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function throttle(fn, ms) {
  let last = 0; return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } };
}

/** Fuzzy match: returns true if all chars of query appear in order in target */
export function fuzzyMatch(target, query) {
  if (!query) return true;
  const t = target.toLowerCase(), q = query.toLowerCase();
  let ti = 0, qi = 0;
  while (ti < t.length && qi < q.length) { if (t[ti] === q[qi]) qi++; ti++; }
  return qi === q.length;
}

export function getProduct(id) {
  return PRODUCTS.find(p => p.id === id) || null;
}

export function cartCount() {
  const cart = store.get('cart') || {};
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

export function cartItems() {
  const cart = store.get('cart') || {};
  return Object.entries(cart).filter(([,q]) => q > 0).map(([id, qty]) => {
    const p = getProduct(id);
    return p ? { ...p, qty } : null;
  }).filter(Boolean);
}

export function getCouponDiscount(code, subtotal) {
  const customCoupons = store.get('customCoupons') || [];
  const all = { ...BASE_COUPONS };
  customCoupons.forEach(c => { all[c] = { type: 'flat', value: 100 }; });
  const coupon = all[code?.toUpperCase()];
  if (!coupon) return null;
  if (coupon.type === 'flat') return coupon.value;
  if (coupon.type === 'percent') return Math.round(subtotal * coupon.value / 100);
  return 0;
}

export function calcCart() {
  const items = cartItems();
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const totalMrp = items.reduce((a, i) => a + i.mrp * i.qty, 0);
  const savings = totalMrp - subtotal;
  const taxes = subtotal * 0.12;
  const convFee = (subtotal + taxes) * 0.005;
  const profile = store.get('profile') || {};
  const freeDelivery = subtotal > 1500 || ['Gold','Platinum'].includes(profile.loyaltyTier);
  const deliveryFee = freeDelivery ? 0 : 29;
  const couponCode = store.get('appliedCoupon');
  const couponDiscount = couponCode ? (getCouponDiscount(couponCode, subtotal) || 0) : 0;
  const totalPayable = Math.max(0, subtotal + taxes + convFee + deliveryFee - couponDiscount);
  return { subtotal, totalMrp, savings, taxes, convFee, deliveryFee, freeDelivery, couponDiscount, totalPayable };
}

/** Points multiplier by tier */
export function loyaltyMultiplier(tier) {
  return { Silver: 1.0, Gold: 1.5, Platinum: 2.0 }[tier] || 1.0;
}

/** Compute new tier from points total */
export function calcTier(points) {
  if (points >= 3000) return 'Platinum';
  if (points >= 1000) return 'Gold';
  return 'Silver';
}
