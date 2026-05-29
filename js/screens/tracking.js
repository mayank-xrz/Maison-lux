import { store } from '../state.js';
import { esc, fmt, fmtDate } from '../utils.js';
import { navigateTo } from '../router.js';
import { showModal, closeModal } from '../components/modal.js';

const STATUS_MAP = { Placed:0, Confirmed:1, Packed:2, 'Out for Delivery':3, Delivered:4 };
const STEPS = [
  ['Order Placed', 'Your luxury curation has been confirmed.'],
  ['Confirmed', 'Assigned to Maison concierge packer.'],
  ['Packed & Sealed', 'Sealed in premium black packaging.'],
  ['Out for Delivery', 'Your rider is en route through Bangalore.'],
  ['Delivered', 'Bespoke package delivered. Enjoy! 🎁'],
];

function initCanvas(container, order) {
  const canvas = container.querySelector('#tracking-canvas');
  if (!canvas) return;
  const stepIndex = STATUS_MAP[order.status] || 0;
  const t = stepIndex / 4;
  let rafId = null;

  function draw() {
    if (!document.getElementById('tracking-canvas')) { if (rafId) cancelAnimationFrame(rafId); return; }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    const p0={x:W*0.12,y:H*0.2}, p1={x:W*0.4,y:H*0.15}, p2={x:W*0.6,y:H*0.85}, p3={x:W*0.88,y:H*0.8};
    ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.bezierCurveTo(p1.x,p1.y,p2.x,p2.y,p3.x,p3.y);
    ctx.strokeStyle = 'rgba(192,160,96,0.25)'; ctx.lineWidth = 3; ctx.stroke();
    if (t > 0) {
      ctx.beginPath(); ctx.moveTo(p0.x,p0.y);
      for (let s = 0; s <= 60*t; s++) {
        const u=s/60;
        ctx.lineTo(Math.pow(1-u,3)*p0.x+3*Math.pow(1-u,2)*u*p1.x+3*(1-u)*u*u*p2.x+u*u*u*p3.x,
                   Math.pow(1-u,3)*p0.y+3*Math.pow(1-u,2)*u*p1.y+3*(1-u)*u*u*p2.y+u*u*u*p3.y);
      }
      ctx.strokeStyle='var(--gold)'; ctx.lineWidth=3; ctx.stroke();
    }
    const cx=Math.pow(1-t,3)*p0.x+3*Math.pow(1-t,2)*t*p1.x+3*(1-t)*t*t*p2.x+t*t*t*p3.x;
    const cy=Math.pow(1-t,3)*p0.y+3*Math.pow(1-t,2)*t*p1.y+3*(1-t)*t*t*p2.y+t*t*t*p3.y;
    const pulse=Math.sin(Date.now()/400)*4;
    ctx.beginPath(); ctx.arc(cx,cy,10+pulse,0,Math.PI*2); ctx.fillStyle='rgba(212,175,55,0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,7,0,Math.PI*2); ctx.fillStyle='var(--gold)'; ctx.fill();
    ctx.font='18px serif'; ctx.fillText('📦',p0.x-10,p0.y+6); ctx.fillText('📍',p3.x-10,p3.y+6);
    store.set('trackingAnimFrame', rafId = requestAnimationFrame(draw), { noPersist:true });
  }
  draw();
}

export function render(container) {
  const orderId = store.get('navigationOrder');
  const orders = store.get('orders') || [];
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:40px" aria-hidden="true">📦</div><div style="margin-top:12px">Order not found.</div><button class="btn-gold" style="margin-top:16px;padding:10px 24px" data-action="go-home">Back to Home</button></div>`;
    container.addEventListener('click', e => { if (e.target.closest('[data-action="go-home"]')) navigateTo('home'); });
    return;
  }

  const stepIndex = STATUS_MAP[order.status] || 0;
  const eta = stepIndex >= 4 ? 'Delivered' : `${Math.max(0, 25 - stepIndex*5)} Mins`;

  container.innerHTML = `
    <div style="padding-bottom:20px">
      <div class="screen-header">
        <button class="back-btn" data-action="go-home" aria-label="Back to home">‹</button>
        <h1 style="font-family:var(--font-serif)">Live Tracking</h1>
      </div>
      <div style="padding:0 16px">
        <div class="card" style="margin-bottom:16px;overflow:hidden">
          <canvas id="tracking-canvas" style="width:100%;height:220px;display:block" aria-label="Delivery route map"></canvas>
          <div style="padding:12px 14px">
            <div style="font-family:var(--font-serif);font-size:18px;color:var(--gold)">Express ETA: ${esc(eta)}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Route: Maison Dark Store → ${esc(order.deliveryPin)}</div>
          </div>
        </div>

        <div class="card" style="padding:16px;margin-bottom:16px">
          ${STEPS.map(([title, sub], i) => {
            const done = i < stepIndex, current = i === stepIndex;
            return `<div style="display:flex;gap:14px;padding:8px;border-radius:10px;background:${current?'rgba(212,175,55,0.05)':'transparent'}">
              <div style="display:flex;flex-direction:column;align-items:center">
                <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;${done?'background:var(--gold);color:#000':current?'border:2px solid var(--gold);animation:pulse-ring 1.5s infinite;color:var(--gold)':'border:2px solid var(--dark-border);color:var(--text-muted)'}" aria-hidden="true">${done?'✓':i+1}</div>
                ${i<STEPS.length-1?`<div style="width:2px;flex:1;min-height:20px;background:${done?'var(--gold)':'var(--dark-border)'};margin-top:4px"></div>`:''}
              </div>
              <div style="padding-top:4px;padding-bottom:${i<STEPS.length-1?'20px':'0'}">
                <div style="font-weight:600;font-size:13px;color:${done||current?'var(--gold)':'var(--text-muted)'}">${esc(title)}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${esc(sub)}</div>
              </div>
            </div>`;
          }).join('')}
        </div>

        <div class="card" style="padding:16px;margin-bottom:16px">
          <div style="font-family:var(--font-serif);font-size:16px;margin-bottom:12px">Order Summary</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.8">
            <div><span style="color:var(--text-primary);font-weight:600">Order ID:</span> ${esc(order.id)}</div>
            <div><span style="color:var(--text-primary);font-weight:600">Total:</span> <span style="color:var(--gold)">${fmt(order.totalPayable)}</span></div>
            <div><span style="color:var(--text-primary);font-weight:600">Items:</span> ${esc(order.itemsSummary)}</div>
            <div><span style="color:var(--text-primary);font-weight:600">Address:</span> ${esc(order.addressName)}</div>
            <div><span style="color:var(--text-primary);font-weight:600">Payment:</span> ${esc(order.paymentMethod)}</div>
          </div>
        </div>

        ${stepIndex >= 3 ? `
        <div class="card" style="padding:16px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:14px">
            <div class="driver-avatar" aria-hidden="true">RK</div>
            <div style="flex:1">
              <div style="font-family:var(--font-serif);font-size:16px;font-weight:600">Rajesh Kumar</div>
              <div style="font-size:11px;color:var(--text-muted)">Concierge Rider · ${esc(order.status)}</div>
              <div style="font-size:13px;margin-top:2px" aria-label="Rating 4.9 out of 5">⭐⭐⭐⭐⭐ <span style="font-size:11px;color:var(--text-muted)">4.9</span></div>
            </div>
            <button class="btn-gold" style="padding:9px 14px;font-size:12px" data-action="driver-chat">📨 Message</button>
          </div>
        </div>` : ''}
      </div>
    </div>`;

  container.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'go-home') { if (store.get('trackingAnimFrame')) { cancelAnimationFrame(store.get('trackingAnimFrame')); store.set('trackingAnimFrame', null, { noPersist:true }); } navigateTo('home'); }
    if (el.dataset.action === 'driver-chat') showDriverChat();
  });

  initCanvas(container, order);
}

function showDriverChat() {
  const msgs = store.get('driverMessages') || [];
  function msgHtml(list) {
    return list.map(m => `<div style="display:flex;flex-direction:column;align-items:${m.sender==='user'?'flex-end':'flex-start'};margin-bottom:10px">
      <div class="${m.sender==='user'?'chat-bubble-user':'chat-bubble-ai'}">${esc(m.content)}</div>
    </div>`).join('');
  }
  const html = `
    <div style="font-family:var(--font-serif);font-size:18px;margin-bottom:16px">📨 Message Rider</div>
    <div id="driver-msgs" style="max-height:240px;overflow-y:auto;margin-bottom:12px">${msgHtml(msgs)}</div>
    <div style="display:flex;gap:8px">
      <input class="glass-input" id="driver-msg-input" placeholder="Type a message..." style="flex:1" aria-label="Message to driver" autocomplete="off">
      <button class="btn-gold" style="padding:10px 14px" id="driver-send-btn">▶</button>
    </div>`;
  showModal(html);

  setTimeout(() => {
    const input = document.getElementById('driver-msg-input');
    const btn = document.getElementById('driver-send-btn');
    const msgsEl = document.getElementById('driver-msgs');
    if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;

    const doSend = () => {
      if (!input?.value.trim()) return;
      const text = input.value.trim();
      input.value = '';
      const updated = [...(store.get('driverMessages')||[]), { sender:'user', content:text, time:Date.now() }];
      store.set('driverMessages', updated);
      if (msgsEl) { msgsEl.innerHTML = msgHtml(updated); msgsEl.scrollTop = msgsEl.scrollHeight; }
      const replies = ["Got it!", "Sure, I'll call when nearby.", "Will be there shortly.", "Thank you! 🙏"];
      setTimeout(() => {
        const reply = replies[Math.floor(Math.random()*replies.length)];
        const withReply = [...(store.get('driverMessages')||[]), { sender:'driver', content:reply, time:Date.now() }];
        store.set('driverMessages', withReply);
        if (msgsEl) { msgsEl.innerHTML = msgHtml(withReply); msgsEl.scrollTop = msgsEl.scrollHeight; }
      }, 1500);
    };
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });
    if (btn) btn.addEventListener('click', doSend);
  }, 50);
}
