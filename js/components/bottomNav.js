import { store } from '../state.js';
import { navigateTo } from '../router.js';
import { cartCount } from '../utils.js';

const TABS = [
  { key:'home',      label:'Discover',   icon:'🧭' },
  { key:'concierge', label:'Concierge',  icon:'🛎' },
  { key:'tryon',     label:'AR Mirror',  icon:'📷' },
  { key:'cart',      label:'Cart',       icon:'🛍' },
  { key:'profile',   label:'Loyalty',    icon:'🛡' },
];

export function renderBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  const current = store.get('currentScreen');
  const count = cartCount();
  nav.innerHTML = TABS.map(t => `
    <button class="nav-tab ${current===t.key?'active':''}" data-nav="${t.key}" aria-label="${t.label}" aria-current="${current===t.key?'page':'false'}" style="background:none;border:none;cursor:pointer;color:inherit">
      <span class="nav-icon" style="position:relative;display:inline-block" aria-hidden="true">${t.icon}${t.key==='cart'&&count>0?`<span class="cart-badge" aria-label="${count} items">${count}</span>`:''}</span>
      <span class="nav-label">${t.label}</span>
    </button>`).join('');
  // Remove old listener and add fresh one
  const newNav = nav.cloneNode(true);
  nav.parentNode.replaceChild(newNav, nav);
  newNav.addEventListener('click', e => {
    const btn = e.target.closest('[data-nav]');
    if (btn) navigateTo(btn.dataset.nav);
  });
}
