import { store } from '../state.js';
import { PRODUCTS } from '../data.js';
import { esc, fmt, cartCount } from '../utils.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';
import { clearStorage } from '../storage.js';

export function render(container) {
  const profile = store.get('profile') || {};
  const customCoupons = store.get('customCoupons') || [];
  const orders = store.get('orders') || [];
  const wishlist = store.get('wishlist') || [];

  container.innerHTML = `
    <div style="padding-bottom:20px">
      <div class="screen-header">
        <button class="back-btn" data-action="go-profile" aria-label="Back to profile">‹</button>
        <div>
          <h1 style="font-size:17px">⚙️ Admin Debug Panel</h1>
          <div style="font-size:10px;color:var(--text-muted)">Developer testing tools</div>
        </div>
      </div>
      <div style="padding:0 16px">

        <div class="card" style="padding:16px;margin-bottom:14px">
          <div style="font-family:var(--font-serif);font-size:17px;margin-bottom:4px">💰 Wallet Credit Injector</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Add mock credits to the luxury wallet for offline checkout testing.</div>
          <div style="display:flex;gap:8px">
            <input class="glass-input" id="wallet-amount" type="number" value="${esc(store.get('adminWalletInput')||'1500')}" style="flex:1" aria-label="Wallet credit amount" min="1">
            <button class="btn-gold" style="padding:10px 16px" data-action="inject-wallet">Inject</button>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:8px">Current balance: <span style="color:var(--gold)">${fmt(profile.walletBalance||0)}</span></div>
        </div>

        <div class="card" style="padding:16px;margin-bottom:14px">
          <div style="font-family:var(--font-serif);font-size:17px;margin-bottom:4px">🎟 Coupon Registry</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Register custom promo codes (₹100 flat discount).</div>
          <div style="display:flex;gap:8px">
            <input class="glass-input" id="coupon-code-input" placeholder="e.g. ULTRA99" style="flex:1" aria-label="Coupon code" autocomplete="off">
            <button class="btn-gold" style="padding:10px 16px" data-action="register-coupon">Register</button>
          </div>
          ${customCoupons.length ? `
          <div style="margin-top:12px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Registered codes:</div>
            ${customCoupons.map(c => `<span style="display:inline-block;background:rgba(212,175,55,0.1);border:1px solid var(--dark-border);border-radius:8px;padding:3px 10px;font-size:11px;color:var(--gold);margin:3px">${esc(c)}</span>`).join('')}
          </div>` : ''}
        </div>

        <div class="card" style="padding:16px;margin-bottom:14px">
          <div style="font-family:var(--font-serif);font-size:17px;margin-bottom:4px">🌐 Product Database</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Force-reload all ${PRODUCTS.length} luxury SKUs into the catalog.</div>
          <button class="btn-gold" style="width:100%;padding:12px;font-size:13px" data-action="reseed-products">🌐 Force Reseed Products</button>
          <div id="reseed-msg" style="display:none;margin-top:10px;padding:10px;background:rgba(76,175,125,0.1);border:1px solid var(--success);border-radius:10px;color:var(--success);font-size:12px;text-align:center" role="status">
            ✓ Database populated with ${PRODUCTS.length} detailed SKUs!
          </div>
        </div>

        <div class="card" style="padding:16px;margin-bottom:14px">
          <div style="font-family:var(--font-serif);font-size:17px;margin-bottom:8px">📊 App State</div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.8">
            <div>Cart items: <span style="color:var(--gold)">${cartCount()}</span></div>
            <div>Orders placed: <span style="color:var(--gold)">${orders.length}</span></div>
            <div>Wishlist items: <span style="color:var(--gold)">${wishlist.length}</span></div>
            <div>Loyalty: <span style="color:var(--gold)">${esc(profile.loyaltyTier||'Silver')} · ${profile.loyaltyPoints||0} pts</span></div>
            <div>Theme: <span style="color:var(--gold)">${store.get('isDarkTheme')?'Dark':'Light'}</span></div>
          </div>
        </div>

        <div class="card" style="padding:16px">
          <div style="font-family:var(--font-serif);font-size:17px;margin-bottom:4px;color:var(--error)">🗑 Reset App</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Clear all localStorage data and reset to defaults.</div>
          <button style="width:100%;padding:12px;background:rgba(224,82,82,0.15);border:1px solid var(--error);border-radius:12px;color:var(--error);cursor:pointer;font-size:13px;font-weight:600" data-action="reset-app">Clear All Data</button>
        </div>
      </div>
    </div>`;

  container.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    switch (el.dataset.action) {
      case 'go-profile': navigateTo('profile'); break;
      case 'inject-wallet': {
        const input = container.querySelector('#wallet-amount');
        const amount = parseFloat(input?.value);
        if (isNaN(amount) || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
        store.set('adminWalletInput', String(amount), { noPersist:true });
        const pr = { ...(store.get('profile')||{}), walletBalance: (store.get('profile')?.walletBalance||0) + amount };
        store.set('profile', pr);
        showToast(`${fmt(amount)} injected to Lux Wallet`, 'success');
        render(container);
        break;
      }
      case 'register-coupon': {
        const input = container.querySelector('#coupon-code-input');
        const code = input?.value.trim().toUpperCase();
        if (!code || code.length < 3) { showToast('Enter a valid coupon code', 'error'); return; }
        const existing = store.get('customCoupons') || [];
        if (existing.includes(code)) { showToast('Code already registered', 'info'); return; }
        store.set('customCoupons', [...existing, code]);
        showToast(`${code} registered! (₹100 flat off)`, 'success');
        render(container);
        break;
      }
      case 'reseed-products': {
        const msg = container.querySelector('#reseed-msg');
        if (msg) msg.style.display = 'block';
        showToast(`${PRODUCTS.length} SKUs confirmed in catalog`, 'success');
        break;
      }
      case 'reset-app': {
        if (confirm('Reset all app data? This cannot be undone.')) {
          clearStorage();
          window.location.reload();
        }
        break;
      }
    }
  });
}
