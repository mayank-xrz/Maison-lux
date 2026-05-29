import { store } from '../state.js';
import { esc, fmt, fmtDate } from '../utils.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';

const BOXES = [
  { id:'gourmet', title:'Gourmet Explorer Box', desc:'Monthly curated exotic groceries & snacks from 5 countries' },
  { id:'beauty', title:'Beauty Atelier Box', desc:'Bi-monthly luxury skincare & makeup discovery set' },
  { id:'prestige', title:'Prestige Annual Chest', desc:'Quarterly mega-box with full-size rare exclusives' },
];

export function render(container) {
  const pr = store.get('profile') || {};
  const orders = store.get('orders') || [];
  const tierStars = { Silver:1, Gold:2, Platinum:3 }[pr.loyaltyTier] || 1;
  const nextTier = pr.loyaltyTier === 'Platinum' ? null : pr.loyaltyTier === 'Gold' ? 3000 : 1000;
  const progress = nextTier ? Math.min(100, ((pr.loyaltyPoints||0) / nextTier) * 100) : 100;
  const mult = { Silver:'1.0×', Gold:'1.5×', Platinum:'2.0×' }[pr.loyaltyTier] || '1.0×';
  const initials = (pr.name||'ML').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const isDark = store.get('isDarkTheme');

  container.innerHTML = `
    <div style="padding-bottom:20px">
      <div class="screen-header"><h1 style="font-family:var(--font-serif)">Loyalty Circle</h1></div>

      <div class="card" style="margin:0 16px 16px;padding:20px;display:flex;align-items:center;gap:16px">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--bronze),var(--gold));display:flex;align-items:center;justify-content:center;font-family:var(--font-serif);font-size:22px;font-weight:700;color:#000;flex-shrink:0" aria-hidden="true">${esc(initials)}</div>
        <div>
          <div style="font-family:var(--font-serif);font-size:20px;font-weight:700">${esc(pr.name||'Guest')}</div>
          <div style="font-size:12px;color:var(--text-muted)">${esc(pr.email||'')}</div>
          <div style="font-size:12px;color:var(--text-muted)">${esc(pr.phone||'')}</div>
        </div>
      </div>

      <div class="tier-card" style="margin:0 16px 16px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div>
            <div style="font-family:var(--font-serif);font-size:32px;font-weight:700;color:var(--gold);letter-spacing:2px">${esc(pr.loyaltyTier||'Silver')}</div>
            <div style="color:var(--gold);font-size:18px;margin-bottom:12px" aria-label="${tierStars} stars">${'★'.repeat(tierStars)}${'☆'.repeat(3-tierStars)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <div style="font-size:9px;letter-spacing:1px;color:var(--text-muted)">LUXURY WALLET</div>
                <div style="font-family:var(--font-serif);font-size:18px;color:var(--gold)">${fmt(pr.walletBalance||0)}</div>
              </div>
              <div>
                <div style="font-size:9px;letter-spacing:1px;color:var(--text-muted)">LOYALTY POINTS</div>
                <div style="font-family:var(--font-serif);font-size:18px;color:var(--gold)">${pr.loyaltyPoints||0} PTS</div>
              </div>
              <div>
                <div style="font-size:9px;letter-spacing:1px;color:var(--text-muted)">MULTIPLIER</div>
                <div style="font-family:var(--font-serif);font-size:18px;color:var(--gold)">${mult}</div>
              </div>
            </div>
          </div>
        </div>
        ${nextTier ? `
        <div style="margin-top:16px">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-bottom:6px">
            <span>${esc(pr.loyaltyTier)} → ${pr.loyaltyTier==='Silver'?'Gold':'Platinum'}</span>
            <span>${pr.loyaltyPoints||0} / ${nextTier} pts</span>
          </div>
          <div class="progress-track" role="progressbar" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" style="width:${progress}%"></div>
          </div>
        </div>` : `<div style="margin-top:12px;font-size:12px;color:var(--gold)">✦ Platinum Elite — Maximum Privileges Unlocked</div>`}
      </div>

      <div style="padding:0 16px 16px">
        <div class="section-title" style="padding:0 0 10px">Lux Box Subscriptions</div>
        ${BOXES.map(b => `
          <div class="card" style="padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px">
            <div style="flex:1">
              <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;margin-bottom:4px">${esc(b.title)}</div>
              <div style="font-size:11px;color:var(--text-muted);line-height:1.4">${esc(b.desc)}</div>
            </div>
            ${pr.subscribedBoxType === b.id
              ? `<button style="background:rgba(76,175,125,0.15);color:var(--success);border:1px solid var(--success);border-radius:20px;padding:8px 12px;cursor:pointer;font-size:11px;font-weight:700;white-space:nowrap" data-action="unsubscribe-box" aria-pressed="true">✓ Subscribed</button>`
              : `<button class="btn-gold" style="padding:8px 14px;font-size:11px;white-space:nowrap" data-action="subscribe-box" data-box-id="${b.id}" data-box-title="${esc(b.title)}">Subscribe</button>`}
          </div>`).join('')}
      </div>

      <div class="card" style="margin:0 16px 16px;padding:18px">
        <div style="font-family:var(--font-serif);font-size:16px;margin-bottom:12px">Referral Code</div>
        <div style="font-family:monospace;font-size:20px;font-weight:700;color:var(--gold);letter-spacing:3px;background:var(--dark-bg);border:1px solid var(--dark-border);border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:12px" aria-label="Referral code: ${esc(pr.referralCode||'')}">${esc(pr.referralCode||'')}</div>
        <button class="btn-gold" style="width:100%;padding:12px;font-size:13px" data-action="share-referral">Share Referral Code</button>
      </div>

      <div style="padding:0 16px 16px">
        <div class="section-title" style="padding:0 0 10px">Recent Orders</div>
        ${orders.length === 0
          ? `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">No orders yet. Start your first luxury curation.</div>`
          : orders.map(o => {
              const badge = { Placed:'badge-placed', Confirmed:'badge-confirmed', Packed:'badge-packed', 'Out for Delivery':'badge-out', Delivered:'badge-delivered' }[o.status] || 'badge-placed';
              return `<div class="card" style="padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;cursor:pointer" data-action="view-order" data-order-id="${esc(o.id)}">
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${esc(o.id.slice(0,18))}...</div>
                  <div style="font-size:11px;color:var(--text-muted)">${fmtDate(o.timestamp)}</div>
                </div>
                <span class="order-status-badge ${badge}">${esc(o.status)}</span>
                <span style="color:var(--gold);font-weight:700;font-size:13px;white-space:nowrap">${fmt(o.totalPayable)}</span>
              </div>`;
            }).join('')}
      </div>

      <div class="card" style="margin:0 16px 16px;padding:16px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">📍 ${esc(pr.savedAddress||'')}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid var(--dark-border)">
          <span style="font-size:13px">Theme</span>
          <button class="btn-gold" style="padding:7px 16px;font-size:12px" data-action="toggle-theme">${isDark?'☀️ Light Mode':'🌙 Dark Mode'}</button>
        </div>
      </div>

      <div style="text-align:center;padding:8px 0 4px">
        <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:12px" data-action="go-admin">⚙️ Admin Panel →</button>
      </div>
    </div>`;

  container.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action } = el.dataset;
    switch (action) {
      case 'subscribe-box': {
        const id = el.dataset.boxId, title = el.dataset.boxTitle;
        const pr2 = { ...(store.get('profile')||{}), isSubscribedLuxBox:true, subscribedBoxType:id };
        store.set('profile', pr2);
        showToast(`Subscribed to ${title}!`, 'success');
        render(container);
        break;
      }
      case 'unsubscribe-box': {
        const pr2 = { ...(store.get('profile')||{}), isSubscribedLuxBox:false, subscribedBoxType:null };
        store.set('profile', pr2);
        showToast('Unsubscribed from Lux Box.', 'info');
        render(container);
        break;
      }
      case 'share-referral': {
        const code = (store.get('profile')||{}).referralCode || '';
        if (navigator.share) navigator.share({ title:'Maison Lux', text:`Use my code ${code} on Maison Lux.` });
        else navigator.clipboard?.writeText(code).then(() => showToast('Referral code copied!', 'success')).catch(() => showToast(`Code: ${code}`, 'info'));
        break;
      }
      case 'view-order':
        navigateTo('tracking', { orderId: el.dataset.orderId });
        break;
      case 'toggle-theme': {
        const dark = !store.get('isDarkTheme');
        store.set('isDarkTheme', dark);
        document.documentElement.setAttribute('data-theme', dark?'dark':'light');
        render(container);
        break;
      }
      case 'go-admin':
        navigateTo('admin');
        break;
    }
  });
}
