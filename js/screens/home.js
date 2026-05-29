import { store } from '../state.js';
import { PRODUCTS, CATEGORIES } from '../data.js';
import { esc, fmtInt, debounce, fuzzyMatch } from '../utils.js';
import { renderProductCard } from '../components/productCard.js';
import { updateCart } from '../actions/cart.js';
import { navigateTo } from '../router.js';
import { showModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { getPersonalisedFeed } from '../features/recommendations.js';

function buildGrid(container) {
  const q = store.get('searchQuery') || '';
  const cat = store.get('selectedCategory') || 'All';
  const vegan = store.get('filterVegan');
  const organic = store.get('filterOrganic');
  const keto = store.get('filterKeto');

  const filtered = PRODUCTS.filter(p => {
    if (cat !== 'All' && p.category !== cat) return false;
    if (q && !fuzzyMatch(p.name, q) && !fuzzyMatch(p.brand, q)) return false;
    if (vegan && !p.isDietVegan) return false;
    if (organic && !p.isDietOrganic) return false;
    if (keto && !p.isDietKeto) return false;
    return true;
  });

  const grid = container.querySelector('#product-grid');
  if (!grid) return;
  if (!filtered.length) {
    grid.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-muted)"><div style="font-size:40px;margin-bottom:12px">✦</div><div style="font-family:var(--font-serif);font-size:18px;color:var(--gold)">No luxury items found</div><div style="font-size:13px;margin-top:6px">Try adjusting your filters</div></div>`;
    return;
  }
  grid.innerHTML = `<div class="product-grid">${filtered.map((p,i) => renderProductCard(p,i)).join('')}</div>`;
}

const debouncedSearch = debounce((container, val) => {
  store.set('searchQuery', val, { noPersist: true });
  buildGrid(container);
}, 220);

function showPincodeDialog() {
  const pincode = store.get('checkedPincode') || '560001';
  const html = `
    <div style="font-family:var(--font-serif);font-size:20px;font-weight:700;margin-bottom:8px">Check Serviceability</div>
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Maison Lux delivers exclusively to Bangalore (560xxx). Enter your 6-digit pincode.</div>
    <input class="glass-input" id="pincode-input" type="text" inputmode="numeric" maxlength="6" placeholder="e.g. 560001" value="${esc(pincode)}" style="margin-bottom:8px">
    <div id="pincode-error" style="color:var(--error);font-size:12px;margin-bottom:12px;min-height:16px"></div>
    <div style="display:flex;gap:10px">
      <button class="btn-gold" style="flex:1;padding:12px" data-action="apply-pincode">Apply</button>
      <button style="flex:1;padding:12px;background:none;border:1px solid var(--dark-border);border-radius:24px;color:var(--text-muted);cursor:pointer" data-action="close-modal">Back</button>
    </div>`;
  showModal(html);
  document.getElementById('pincode-input')?.focus();
}

export function render(container) {
  const cat = store.get('selectedCategory') || 'All';
  const q = store.get('searchQuery') || '';
  const vegan = store.get('filterVegan');
  const organic = store.get('filterOrganic');
  const keto = store.get('filterKeto');
  const pincode = store.get('checkedPincode') || '560001';
  const serviceable = store.get('isServiceable') !== false;
  const pincodeColor = serviceable ? 'var(--success)' : 'var(--error)';
  const pincodeText = serviceable ? `📍 Delivering to Bangalore (${esc(pincode)})` : `⚠️ Out of service area (${esc(pincode)})`;

  const filtered = PRODUCTS.filter(p => {
    if (cat !== 'All' && p.category !== cat) return false;
    if (q && !fuzzyMatch(p.name, q) && !fuzzyMatch(p.brand, q)) return false;
    if (vegan && !p.isDietVegan) return false;
    if (organic && !p.isDietOrganic) return false;
    if (keto && !p.isDietKeto) return false;
    return true;
  });

  const gridHtml = !filtered.length
    ? `<div style="text-align:center;padding:40px 20px;color:var(--text-muted)"><div style="font-size:40px;margin-bottom:12px">✦</div><div style="font-family:var(--font-serif);font-size:18px;color:var(--gold)">No luxury items found</div><div style="font-size:13px;margin-top:6px">Try adjusting your filters</div></div>`
    : `<div class="product-grid">${filtered.map((p,i) => renderProductCard(p,i)).join('')}</div>`;

  container.innerHTML = `
    <div style="padding-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 8px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--bronze),var(--gold));display:flex;align-items:center;justify-content:center;font-family:var(--font-serif);font-weight:700;color:#000;font-size:15px;flex-shrink:0" aria-hidden="true">ML</div>
          <div>
            <div style="font-family:var(--font-serif);font-size:20px;font-weight:700;line-height:1">Maison Lux</div>
            <div style="font-size:10px;color:var(--gold);letter-spacing:1px">The world, delivered.</div>
          </div>
        </div>
        <button class="btn-gold" style="padding:8px 14px;font-size:12px" data-action="toggle-theme" aria-label="Toggle theme">
          ${store.get('isDarkTheme') ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <div style="padding:0 16px 8px">
        <div class="pill-bar" data-action="show-pincode" role="button" tabindex="0" aria-label="Change delivery pincode" style="border-color:${pincodeColor}30;cursor:pointer">
          <span style="font-size:13px;color:${pincodeColor}">${pincodeText}</span>
          <span style="margin-left:auto;color:var(--text-muted);font-size:11px">Change ›</span>
        </div>
      </div>

      <div style="padding:0 16px 10px;position:relative">
        <span style="position:absolute;left:28px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none" aria-hidden="true">🔍</span>
        <input class="glass-input" id="home-search" style="padding-left:44px" placeholder="Search truffles, wagyu, serums..."
          value="${esc(q)}" aria-label="Search products" autocomplete="off">
      </div>

      <div class="hero-banner" data-action="go-ar" role="button" tabindex="0" aria-label="Open AR Mirror">
        <div style="flex:1">
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--gold);margin-bottom:6px">⚡ LIVE COSMETICS TRIAL</div>
          <div style="font-family:var(--font-serif);font-size:17px;font-weight:600;line-height:1.3">Try Gold &amp; Crimson shades in real-time camera reflection.</div>
        </div>
        <div><button class="btn-gold" style="padding:10px 16px;font-size:12px;white-space:nowrap" tabindex="-1">AR Mirror</button></div>
      </div>

      <div class="scroll-row" style="padding:10px 16px" role="tablist" aria-label="Product categories">
        ${CATEGORIES.map(c => `<div class="cat-tab ${cat===c?'active':''}" data-action="select-cat" data-cat="${esc(c)}" role="tab" aria-selected="${cat===c}" tabindex="${cat===c?'0':'-1'}">${esc(c)}</div>`).join('')}
      </div>

      <div style="display:flex;gap:8px;padding:0 16px 10px" role="group" aria-label="Diet filters">
        <div class="diet-chip ${vegan?'active':''}" data-action="toggle-vegan" role="checkbox" aria-checked="${vegan}" tabindex="0">🌱 Vegan</div>
        <div class="diet-chip ${organic?'active':''}" data-action="toggle-organic" role="checkbox" aria-checked="${organic}" tabindex="0">🍊 Organic</div>
        <div class="diet-chip ${keto?'active':''}" data-action="toggle-keto" role="checkbox" aria-checked="${keto}" tabindex="0">🥑 Keto</div>
      </div>

      <div id="product-grid">${gridHtml}</div>
    </div>`;

  // Search input listener
  const searchInput = container.querySelector('#home-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => debouncedSearch(container, e.target.value));
  }

  // Event delegation
  container.addEventListener('click', handleHomeClick);
  container.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const el = e.target.closest('[data-action]');
      if (el) { e.preventDefault(); el.click(); }
    }
  });
}

function handleHomeClick(e) {
  const container = e.currentTarget;
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id, cat } = el.dataset;

  switch (action) {
    case 'toggle-theme': {
      const dark = !store.get('isDarkTheme');
      store.set('isDarkTheme', dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      render(container);
      break;
    }
    case 'show-pincode':
      showPincodeDialog();
      break;
    case 'go-ar':
      navigateTo('tryon');
      break;
    case 'select-cat':
      store.set('selectedCategory', cat, { noPersist: true });
      store.set('searchQuery', '', { noPersist: true });
      const si = container.querySelector('#home-search');
      if (si) si.value = '';
      buildGrid(container);
      container.querySelectorAll('.cat-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
      break;
    case 'toggle-vegan':
      store.set('filterVegan', !store.get('filterVegan'), { noPersist: true });
      el.classList.toggle('active');
      el.setAttribute('aria-checked', String(store.get('filterVegan')));
      buildGrid(container);
      break;
    case 'toggle-organic':
      store.set('filterOrganic', !store.get('filterOrganic'), { noPersist: true });
      el.classList.toggle('active');
      el.setAttribute('aria-checked', String(store.get('filterOrganic')));
      buildGrid(container);
      break;
    case 'toggle-keto':
      store.set('filterKeto', !store.get('filterKeto'), { noPersist: true });
      el.classList.toggle('active');
      el.setAttribute('aria-checked', String(store.get('filterKeto')));
      buildGrid(container);
      break;
    case 'view-product':
      navigateTo('detail', { productId: id });
      break;
    case 'cart-add':
    case 'cart-inc':
      e.stopPropagation();
      updateCart(id, 1);
      refreshCartControl(container, id);
      break;
    case 'cart-dec':
      e.stopPropagation();
      updateCart(id, -1);
      refreshCartControl(container, id);
      break;
    case 'apply-pincode': {
      const input = document.getElementById('pincode-input');
      const errEl = document.getElementById('pincode-error');
      const val = input?.value.trim();
      if (!val || !/^\d{6}$/.test(val)) {
        if (errEl) errEl.textContent = 'Please enter a valid 6-digit pincode.';
        return;
      }
      store.update({ checkedPincode: val, isServiceable: val.startsWith('560') });
      closeModal();
      render(container);
      showToast(store.get('isServiceable') ? `Delivering to ${val}` : `${val} is outside our service area`, store.get('isServiceable') ? 'success' : 'error');
      break;
    }
    case 'close-modal':
      closeModal();
      break;
  }
}

function refreshCartControl(container, id) {
  const qty = (store.get('cart') || {})[id] || 0;
  const ctrl = container.querySelector(`[data-cart-control="${id}"]`);
  if (!ctrl) return;
  const { esc: e, fmtInt: fi } = { esc, fmtInt };
  import('../data.js').then(m => {
    const p = m.PRODUCTS.find(x => x.id === id);
    ctrl.innerHTML = qty > 0
      ? `<div class="qty-stepper" role="group" aria-label="Quantity"><button data-action="cart-dec" data-id="${id}" aria-label="Remove one">−</button><span aria-live="polite">${qty}</span><button data-action="cart-inc" data-id="${id}" aria-label="Add one">+</button></div>`
      : `<button class="btn-gold add-btn" data-action="cart-add" data-id="${id}" aria-label="Add to cart">ADD</button>`;
  });
}
