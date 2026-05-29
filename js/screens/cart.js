import { store } from '../state.js';
import { esc, fmt, fmtInt, calcCart, getCouponDiscount, cartItems } from '../utils.js';
import { navigateTo } from '../router.js';
import { updateCart } from '../actions/cart.js';
import { showToast } from '../components/toast.js';
import { getCartSuggestions } from '../features/recommendations.js';
import { awardPoints } from '../features/dynamicPricing.js';

function doSubmitOrder(container) {
  const items = cartItems();
  if (!items.length) return;
  const { subtotal, taxes, convFee, deliveryFee, couponDiscount, totalPayable } = calcCart();
  const orderId = 'ORD-' + Date.now();
  const cartSnapshot = { ...(store.get('cart') || {}) };
  const order = {
    id: orderId,
    timestamp: Date.now(),
    itemsSummary: items.map(i => `${i.name} × ${i.qty}`).join(', '),
    cartSnapshot,
    subtotal, taxes, convFee, deliveryFee,
    discountApplied: couponDiscount,
    totalPayable,
    status: 'Placed',
    deliveryPin: (store.get('profile') || {}).pincode || '560001',
    etaMinutes: 35,
    addressName: (store.get('profile') || {}).savedAddress || '',
    paymentMethod: store.get('selectedPaymentMethod') || 'Wallet',
    deliverySlot: store.get('selectedDeliverySlot') || 'Express (10-45 mins)',
  };

  const orders = [order, ...(store.get('orders') || [])];
  store.set('orders', orders);

  const earned = awardPoints(totalPayable);

  const profile = store.get('profile') || {};
  if (store.get('selectedPaymentMethod') === 'Wallet') {
    store.set('profile', { ...profile, walletBalance: Math.max(0, (profile.walletBalance||0) - totalPayable) });
  }

  store.update({ cart: {}, appliedCoupon: null, couponError: null, activeOrderId: orderId });

  // Progressive status updates
  const statuses = ['Confirmed','Packed','Out for Delivery','Delivered'];
  const delays = [5000, 12000, 20000, 35000];
  statuses.forEach((status, i) => {
    setTimeout(() => {
      const currentOrders = store.get('orders') || [];
      const idx = currentOrders.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        const updated = [...currentOrders];
        updated[idx] = { ...updated[idx], status };
        store.set('orders', updated);
      }
    }, delays[i]);
  });

  showToast(`Order placed! +${Math.round(earned)} loyalty points`, 'success');
  navigateTo('tracking', { orderId });
}

export function render(container) {
  const items = cartItems();
  const { subtotal, savings, taxes, convFee, deliveryFee, freeDelivery, couponDiscount, totalPayable } = calcCart();
  const appliedCoupon = store.get('appliedCoupon');
  const couponError = store.get('couponError');
  const paymentMethod = store.get('selectedPaymentMethod') || 'Wallet';
  const slot = store.get('selectedDeliverySlot') || 'Express (10-45 mins)';
  const profile = store.get('profile') || {};
  const suggestions = getCartSuggestions();

  if (!items.length) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:80%;padding:40px;text-align:center">
        <div style="font-size:64px;margin-bottom:16px;opacity:0.4" aria-hidden="true">🛍</div>
        <div style="font-family:var(--font-serif);font-size:24px;color:var(--text-muted)">Bespoke Cart is Empty</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:8px">Add luxury products from the Discover tab to begin your curation.</div>
        <button class="btn-gold" style="padding:12px 28px;margin-top:24px;font-size:14px" data-action="go-home">Explore Collection</button>
      </div>`;
    container.addEventListener('click', e => {
      if (e.target.closest('[data-action="go-home"]')) navigateTo('home');
    });
    return;
  }

  container.innerHTML = `
    <div style="padding-bottom:100px">
      <div class="screen-header"><h1 style="font-family:var(--font-serif)">Boutique Cart</h1></div>

      <div style="padding:0 16px">
        <div style="font-family:var(--font-serif);font-size:18px;margin-bottom:10px">Curation Items</div>
        ${items.map(item => `
          <div class="card" style="padding:14px;display:flex;align-items:center;gap:12px;margin-bottom:8px;cursor:pointer"
            data-action="view-product" data-id="${item.id}">
            <span style="font-size:28px;flex-shrink:0" aria-hidden="true">${item.flag}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:9px;font-weight:700;color:var(--gold);letter-spacing:1px">${esc(item.brand)}</div>
              <div style="font-family:var(--font-serif);font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(item.name)}</div>
              <div style="font-size:12px;color:var(--gold);font-weight:600">${fmt(item.price)} each</div>
            </div>
            <div data-stop-propagation="1">
              <div class="qty-stepper" role="group" aria-label="Quantity for ${esc(item.name)}">
                <button data-action="cart-dec" data-id="${item.id}" aria-label="Remove one">−</button>
                <span aria-live="polite">${item.qty}</span>
                <button data-action="cart-inc" data-id="${item.id}" aria-label="Add one">+</button>
              </div>
            </div>
          </div>`).join('')}
      </div>

      ${suggestions.length ? `
      <div style="padding:8px 16px">
        <div style="font-family:var(--font-serif);font-size:16px;margin-bottom:8px">You Might Also Like</div>
        <div class="scroll-row" style="padding:0;gap:10px">
          ${suggestions.map(p => `
            <div class="card" style="min-width:130px;flex-shrink:0;padding:10px;cursor:pointer" data-action="view-product" data-id="${p.id}">
              <span style="font-size:22px" aria-hidden="true">${p.flag}</span>
              <div style="font-size:11px;font-family:var(--font-serif);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</div>
              <div style="color:var(--gold);font-size:11px;font-weight:700">${fmtInt(p.price)}</div>
              <button class="btn-gold" style="width:100%;padding:5px;font-size:10px;margin-top:6px" data-action="cart-add" data-id="${p.id}">ADD</button>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <div style="padding:16px 16px 8px">
        <div style="font-family:var(--font-serif);font-size:18px;margin-bottom:10px">Delivery Slot</div>
        <div style="display:flex;gap:10px" role="radiogroup" aria-label="Delivery slot">
          ${['Express (10-45 mins)','Schedule Later'].map((s, i) => `
            <div class="delivery-slot ${slot===s?'active':''}" data-action="select-slot" data-slot="${esc(s)}" role="radio" aria-checked="${slot===s}" tabindex="${slot===s?'0':'-1'}">
              <div style="font-size:20px" aria-hidden="true">${i===0?'⚡':'🕐'}</div>
              <div style="font-size:12px;font-weight:600;color:${slot===s?'var(--gold)':'var(--text-muted)'};margin-top:4px">${i===0?'Express':'Schedule'}</div>
              <div style="font-size:10px;color:var(--text-muted)">${i===0?'10–45 mins':'Choose time'}</div>
            </div>`).join('')}
        </div>
      </div>

      <div style="padding:8px 16px">
        <div style="font-family:var(--font-serif);font-size:18px;margin-bottom:10px">Promo Code</div>
        ${appliedCoupon
          ? `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(76,175,125,0.1);border:1px solid var(--success);border-radius:12px">
              <span style="color:var(--success);font-size:13px;font-weight:600">✓ ${esc(appliedCoupon)} applied — saving ${fmt(couponDiscount)}</span>
              <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:12px" data-action="remove-coupon">Remove</button>
            </div>`
          : `<div style="display:flex;gap:8px">
              <input class="glass-input" id="coupon-input" placeholder="WELCOME, AMEXGOLD..." style="flex:1" aria-label="Promo code" autocomplete="off">
              <button class="btn-gold" style="padding:10px 16px;font-size:13px" data-action="apply-coupon">Apply</button>
            </div>
            ${couponError ? `<div style="color:var(--error);font-size:12px;margin-top:6px" role="alert">${esc(couponError)}</div>` : ''}`}
      </div>

      <div style="padding:8px 16px">
        <div style="font-family:var(--font-serif);font-size:18px;margin-bottom:10px">Payment</div>
        ${[
          ['Wallet', `Lux Wallet (Bal: ${fmt(profile.walletBalance||0)})`],
          ['UPI', 'Razorpay Instant UPI'],
          ['Card', 'Credit / Debit Cards'],
          ['COD', 'Cash on Delivery'],
        ].map(([key, label]) => `
          <div class="card payment-option ${paymentMethod===key?'selected':''}" style="margin-bottom:8px"
            data-action="select-payment" data-method="${key}" role="radio" aria-checked="${paymentMethod===key}" tabindex="${paymentMethod===key?'0':'-1'}">
            <div class="radio-dot" style="${paymentMethod===key?'background:var(--gold);border-color:var(--gold)':''}"></div>
            <div>
              <div style="font-weight:600;font-size:13px;color:${paymentMethod===key?'var(--gold)':'var(--text-primary)'}">${esc(key)}</div>
              <div style="font-size:11px;color:var(--text-muted)">${esc(label)}</div>
            </div>
          </div>`).join('')}
      </div>

      <div style="padding:8px 16px">
        <div class="card" style="padding:16px">
          <div style="font-family:var(--font-serif);font-size:18px;margin-bottom:12px">Bespoke Billing</div>
          <div class="billing-row"><span>Curation Subtotal</span><span>${fmt(subtotal)}</span></div>
          ${savings > 0 ? `<div class="billing-row"><span>Catalog Savings</span><span style="color:var(--success)">−${fmt(savings)}</span></div>` : ''}
          <div class="billing-row"><span>Blended GST (12%)</span><span>${fmt(taxes)}</span></div>
          <div class="billing-row"><span>Convenience Fee (0.5%)</span><span>${fmt(convFee)}</span></div>
          <div class="billing-row"><span>Express Delivery</span><span style="${freeDelivery?'color:var(--gold)':''}">${freeDelivery?'FREE':'₹29.00'}</span></div>
          ${couponDiscount > 0 ? `<div class="billing-row"><span>Promo: ${esc(appliedCoupon)}</span><span style="color:var(--success)">−${fmt(couponDiscount)}</span></div>` : ''}
          <div class="billing-row" style="border-top:1px solid var(--dark-border);margin-top:8px;padding-top:12px">
            <span style="font-weight:700;font-size:15px">Total Payable</span>
            <span class="billing-total">${fmt(totalPayable)}</span>
          </div>
        </div>
      </div>
    </div>

    <div style="position:absolute;bottom:0;left:0;right:0;padding:12px 16px 20px;background:rgba(13,13,13,0.95);backdrop-filter:blur(12px);border-top:1px solid var(--dark-border)">
      <button class="btn-gold" style="width:100%;padding:16px;font-size:15px;font-family:var(--font-serif)" data-action="place-order">
        Place Express Order · ${fmt(totalPayable)}
      </button>
    </div>`;

  container.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.closest('[data-stop-propagation]') && el.dataset.action !== 'cart-inc' && el.dataset.action !== 'cart-dec') return;

    const { action, id, slot: slotVal, method } = el.dataset;
    switch (action) {
      case 'go-home': navigateTo('home'); break;
      case 'view-product': if (!e.target.closest('[data-stop-propagation]')) navigateTo('detail', { productId: el.dataset.id }); break;
      case 'cart-inc': e.stopPropagation(); updateCart(el.dataset.id, 1); render(container); break;
      case 'cart-dec': e.stopPropagation(); updateCart(el.dataset.id, -1); render(container); break;
      case 'cart-add': updateCart(el.dataset.id, 1); render(container); break;
      case 'select-slot':
        store.set('selectedDeliverySlot', slotVal);
        render(container);
        break;
      case 'apply-coupon': {
        const input = container.querySelector('#coupon-input');
        const code = input?.value.trim().toUpperCase();
        const { subtotal: sub } = calcCart();
        const discount = getCouponDiscount(code, sub);
        if (discount !== null) {
          store.update({ appliedCoupon: code, couponError: null });
          showToast(`${code} applied!`, 'success');
        } else {
          store.update({ couponError: 'Invalid code. Try WELCOME, AMEXGOLD or MLUXMAYANK.', appliedCoupon: null });
        }
        render(container);
        break;
      }
      case 'remove-coupon':
        store.update({ appliedCoupon: null, couponError: null });
        render(container);
        break;
      case 'select-payment':
        store.set('selectedPaymentMethod', method);
        render(container);
        break;
      case 'place-order':
        doSubmitOrder(container);
        break;
    }
  });
}
