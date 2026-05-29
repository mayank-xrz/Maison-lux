import { store } from '../state.js';
import { showToast } from '../components/toast.js';
import { getProduct } from '../utils.js';

export function updateCart(id, delta) {
  const cart = { ...(store.get('cart') || {}) };
  const prev = cart[id] || 0;
  const next = Math.max(0, prev + delta);
  if (next === 0) { delete cart[id]; } else { cart[id] = next; }

  // Optimistic update
  store.set('cart', cart);

  if (delta > 0 && prev === 0) {
    const p = getProduct(id);
    showToast(`${p?.name || 'Item'} added`, 'success', 3000, {
      label: 'Undo',
      onClick: () => {
        const c = { ...(store.get('cart') || {}) };
        delete c[id];
        store.set('cart', c);
        showToast('Removed from cart', 'info', 2000);
      }
    });
  }
}

export function clearCart() { store.set('cart', {}); }
