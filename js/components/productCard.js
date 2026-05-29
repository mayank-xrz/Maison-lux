import { store } from '../state.js';
import { esc, fmtInt } from '../utils.js';

export function renderProductCard(p, index = 0) {
  const qty = (store.get('cart') || {})[p.id] || 0;
  return `
    <div class="card product-card anim-card" style="animation-delay:${index*60}ms;cursor:pointer"
      data-action="view-product" data-id="${p.id}" role="button" tabindex="0"
      aria-label="${esc(p.name)} — ${fmtInt(p.price)}">
      <div class="product-card-image">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="img-overlay" aria-hidden="true"></div>
        ${p.colorHex
          ? `<div style="position:relative;z-index:3;width:32px;height:32px;border-radius:50%;background:${p.colorHex};border:2px solid var(--gold)" aria-hidden="true"></div>`
          : `<span style="position:relative;z-index:3;font-size:28px" aria-hidden="true">${p.flag}</span>`}
        <div class="country-chip" aria-hidden="true">${esc(p.country)}</div>
      </div>
      <div class="product-card-body">
        <div class="brand-label">${esc(p.brand)}</div>
        <div class="product-name">${esc(p.name)}</div>
        <div class="price-row">
          <span class="price-gold">${fmtInt(p.price)}</span>
          <div data-cart-control="${p.id}">
            ${qty > 0
              ? `<div class="qty-stepper" role="group" aria-label="Quantity for ${esc(p.name)}">
                  <button data-action="cart-dec" data-id="${p.id}" aria-label="Remove one">−</button>
                  <span aria-live="polite">${qty}</span>
                  <button data-action="cart-inc" data-id="${p.id}" aria-label="Add one">+</button>
                </div>`
              : `<button class="btn-gold add-btn" data-action="cart-add" data-id="${p.id}" aria-label="Add ${esc(p.name)} to cart">ADD</button>`}
          </div>
        </div>
      </div>
    </div>`;
}
