import { store } from '../state.js';
import { PRODUCTS } from '../data.js';
import { esc, fmt, fmtInt, stars, getProduct, cartItems } from '../utils.js';
import { navigateTo } from '../router.js';
import { updateCart } from '../actions/cart.js';
import { showToast } from '../components/toast.js';
import { getFrequentlyBoughtTogether } from '../features/recommendations.js';

export function render(container) {
  const productId = store.get('navigationDetail');
  const p = getProduct(productId);
  if (!p) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">Product not found.</div>`;
    return;
  }

  const wishlist = store.get('wishlist') || [];
  const inWishlist = wishlist.includes(p.id);
  const qty = (store.get('cart') || {})[p.id] || 0;
  const tab = store.get('detailTab') || 'description';
  const similar = getFrequentlyBoughtTogether(p.id);
  const dietBadges = [
    p.isDietVegan && '🌱 Vegan',
    p.isDietOrganic && '🍊 Organic',
    p.isDietKeto && '🥑 Keto',
    p.isDietGlutenFree && '🌾 Gluten-Free',
  ].filter(Boolean);

  const tabContent = {
    description: `<p style="font-size:14px;line-height:1.7;color:var(--text-muted)">${esc(p.description)}</p>`,
    ingredients: `<p style="font-size:14px;line-height:1.7;color:var(--text-muted)">${esc(p.ingredients)}</p>`,
    facts: `<p style="font-size:14px;line-height:1.7;color:var(--text-muted)">${esc(p.factsOrUsage)}</p>`,
  };

  container.innerHTML = `
    <div style="padding-bottom:90px">
      <div class="screen-header">
        <button class="back-btn" data-action="go-back" aria-label="Go back">‹</button>
        <h1 style="font-family:var(--font-serif);font-size:16px">${esc(p.brand)}</h1>
        <button style="background:none;border:none;cursor:pointer;font-size:24px;color:${inWishlist?'var(--gold)':'var(--text-muted)'}" data-action="toggle-wishlist" aria-label="${inWishlist?'Remove from':'Add to'} wishlist" aria-pressed="${inWishlist}">
          ${inWishlist ? '♥' : '♡'}
        </button>
      </div>

      <div class="card" style="margin:0 16px 16px;height:220px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="eager">
          <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.7))"></div>` : ''}
        <div style="position:relative;z-index:1">
          ${p.colorHex
            ? `<div style="width:80px;height:80px;border-radius:50%;background:${p.colorHex};border:3px solid var(--gold);box-shadow:0 0 30px ${p.colorHex}55" aria-hidden="true"></div>`
            : `<span style="font-size:64px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))" aria-hidden="true">${p.flag}</span>`}
        </div>
        <div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;font-size:11px;padding:4px 10px;border-radius:8px;z-index:1">${esc(p.country)}</div>
      </div>

      <div style="padding:0 16px 16px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--gold)">${esc(p.brand)}</span>
          <span style="font-size:10px;color:var(--text-muted)">${p.flag} ${esc(p.country)}</span>
        </div>
        <div style="font-family:var(--font-serif);font-size:22px;font-weight:700;line-height:1.3;margin-bottom:10px">${esc(p.name)}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span style="color:var(--gold);font-weight:700;font-size:22px">${fmtInt(p.price)}</span>
          <span style="color:var(--text-muted);text-decoration:line-through;font-size:14px">${fmtInt(p.mrp)}</span>
          <span style="background:rgba(76,175,125,0.15);color:var(--success);padding:3px 8px;border-radius:8px;font-size:11px;font-weight:700">${p.discount}% off</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px" aria-label="Rating: ${p.rating} out of 5">
          ${stars(p.rating, 14)}
          <span style="font-size:13px;font-weight:600">${p.rating}</span>
          <span style="font-size:12px;color:var(--text-muted)">(${p.reviewCount} reviews)</span>
        </div>
        ${dietBadges.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">${dietBadges.map(b=>`<span style="background:rgba(76,175,125,0.12);color:var(--success);padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600">${b}</span>`).join('')}</div>` : ''}

        <div style="display:flex;border-bottom:1px solid var(--dark-border);margin-bottom:14px" role="tablist">
          ${[['description','Description'],['ingredients','Ingredients'],['facts','Facts & Usage']].map(([key,label]) => `
            <button class="detail-tab ${tab===key?'active':''}" data-action="switch-tab" data-tab="${key}" role="tab" aria-selected="${tab===key}" tabindex="${tab===key?'0':'-1'}">${label}</button>`).join('')}
        </div>
        <div role="tabpanel">${tabContent[tab] || ''}</div>
      </div>

      <div style="padding:0 16px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-family:var(--font-serif);font-size:18px">Elite Reviews (${p.reviewCount})</div>
          <div style="font-size:13px;color:var(--gold)">★ ${p.rating} / 5.0</div>
        </div>
        ${[
          [5,'Absolute perfection.','@elara_lux','Maison Lux never disappoints. Delivered in immaculate condition.'],
          [5,'Worth every rupee.','@nirvaan_b','Delivered in perfect condition. The packaging alone is art.'],
          [4,'Luxurious experience.','@priya.k','Beautifully packaged. Will order again without hesitation.'],
        ].map(([r,title,user,body]) => `
          <div class="review-card card" style="margin-bottom:10px;padding:14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <div aria-label="Rating: ${r} stars">${stars(r,12)}</div>
              <span style="font-size:13px;font-weight:600">"${esc(title)}"</span>
            </div>
            <div style="font-size:12px;color:var(--gold);margin-bottom:4px">${esc(user)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${esc(body)}</div>
          </div>`).join('')}
      </div>

      ${similar.length ? `
      <div style="padding:0 0 16px">
        <div class="section-title" style="padding:0 16px 10px">Frequently Bought Together</div>
        <div class="scroll-row">
          ${similar.map(s => `
            <div class="card" style="min-width:120px;cursor:pointer;flex-shrink:0" data-action="view-similar" data-id="${s.id}" role="button" tabindex="0">
              <div style="height:70px;background:linear-gradient(135deg,#1a1a1a,#111);display:flex;align-items:center;justify-content:center;font-size:26px;position:relative;overflow:hidden">
                ${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.name)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="lazy"><div style="position:absolute;inset:0;background:rgba(0,0,0,0.3)"></div>` : ''}
                <span style="position:relative;z-index:1" aria-hidden="true">${s.flag}</span>
              </div>
              <div style="padding:8px">
                <div style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--font-serif)">${esc(s.name)}</div>
                <div style="color:var(--gold);font-size:11px;font-weight:600;margin-top:2px">${fmtInt(s.price)}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>` : ''}
    </div>

    <div style="position:absolute;bottom:0;left:0;right:0;padding:12px 16px 20px;background:rgba(13,13,13,0.95);backdrop-filter:blur(12px);border-top:1px solid var(--dark-border)">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="qty-stepper" style="background:var(--frosted);border:1px solid var(--dark-border)" role="group" aria-label="Quantity">
          <button data-action="cart-dec" aria-label="Remove one">−</button>
          <span aria-live="polite">${qty}</span>
          <button data-action="cart-inc" aria-label="Add one">+</button>
        </div>
        <button class="btn-gold" style="flex:1;padding:13px;font-size:14px;font-family:var(--font-serif)" data-action="add-to-cart">
          Add to Cart
        </button>
      </div>
      <div style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:6px">TOTAL COST ${fmt(p.price * (qty||1))}</div>
    </div>`;

  container.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, tab: tabKey, id } = el.dataset;
    switch (action) {
      case 'go-back': navigateTo('home'); break;
      case 'toggle-wishlist': {
        const wl = [...(store.get('wishlist')||[])];
        const idx = wl.indexOf(p.id);
        if (idx >= 0) { wl.splice(idx,1); showToast('Removed from wishlist', 'info'); }
        else { wl.push(p.id); showToast('Added to wishlist ♥', 'success'); }
        store.set('wishlist', wl);
        render(container);
        break;
      }
      case 'switch-tab':
        store.set('detailTab', tabKey, { noPersist:true });
        render(container);
        break;
      case 'cart-inc': updateCart(p.id, 1); render(container); break;
      case 'cart-dec': updateCart(p.id, -1); render(container); break;
      case 'add-to-cart': updateCart(p.id, 1); render(container); break;
      case 'view-similar':
        store.set('detailTab', 'description', { noPersist:true });
        navigateTo('detail', { productId: id });
        break;
    }
  });
}
