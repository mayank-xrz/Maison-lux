import { PRODUCTS, PRODUCT_PAIRINGS } from '../data.js';
import { store } from '../state.js';

/**
 * Products frequently bought alongside productId (from history + hardcoded pairings)
 * @param {string} productId
 * @returns {Array}
 */
export function getFrequentlyBoughtTogether(productId) {
  const orders = store.get('orders') || [];
  const coOccurrence = {};
  orders.forEach(order => {
    const ids = Object.keys(order.cartSnapshot || {});
    if (ids.includes(productId)) {
      ids.filter(id => id !== productId).forEach(id => { coOccurrence[id] = (coOccurrence[id] || 0) + 1; });
    }
  });
  const fromHistory = Object.entries(coOccurrence).sort((a,b)=>b[1]-a[1]).map(([id])=>id);
  const fromPairings = PRODUCT_PAIRINGS[productId] || [];
  const ids = [...new Set([...fromHistory, ...fromPairings])].slice(0, 4);
  return ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
}

/**
 * Personalised product feed based on order/wishlist history
 * Falls back to featured products if no history
 * @returns {Array}
 */
export function getPersonalisedFeed() {
  const orders = store.get('orders') || [];
  const wishlist = store.get('wishlist') || [];
  if (!orders.length && !wishlist.length) return PRODUCTS.slice(0, 8);

  const scores = {};
  const addScore = (id, pts) => { scores[id] = (scores[id] || 0) + pts; };

  orders.forEach(order => {
    Object.keys(order.cartSnapshot || {}).forEach(id => {
      const p = PRODUCTS.find(x => x.id === id);
      if (!p) return;
      PRODUCTS.filter(x => x.category === p.category && x.id !== id).forEach(x => addScore(x.id, 1));
      (PRODUCT_PAIRINGS[id] || []).forEach(pid => addScore(pid, 2));
    });
  });

  wishlist.forEach(id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    PRODUCTS.filter(x => x.category === p.category && x.id !== id).forEach(x => addScore(x.id, 1.5));
    (PRODUCT_PAIRINGS[id] || []).forEach(pid => addScore(pid, 1));
  });

  return PRODUCTS
    .filter(p => !wishlist.includes(p.id))
    .sort((a,b) => (scores[b.id]||0) - (scores[a.id]||0))
    .slice(0, 12);
}

/**
 * Cart cross-sell suggestions (not in cart, paired with cart items)
 * @returns {Array}
 */
export function getCartSuggestions() {
  const cart = store.get('cart') || {};
  const cartIds = Object.keys(cart);
  if (!cartIds.length) return [];
  const suggested = new Set();
  cartIds.forEach(id => { (PRODUCT_PAIRINGS[id] || []).forEach(pid => { if (!cartIds.includes(pid)) suggested.add(pid); }); });
  return [...suggested].map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 3);
}
