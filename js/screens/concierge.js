import { store } from '../state.js';
import { PRODUCTS } from '../data.js';
import { esc, fmtInt, fmtTime, getProduct } from '../utils.js';
import { navigateTo } from '../router.js';
import { updateCart } from '../actions/cart.js';
import { showToast } from '../components/toast.js';

function renderBubble(msg) {
  const isUser = msg.sender === 'user';
  const time = fmtTime(msg.timestamp);
  const productRefs = [];
  const content = msg.content.replace(/\b(p_[a-z_]+)\b/g, match => {
    const prod = getProduct(match);
    if (prod) { productRefs.push(prod); return `<strong>${esc(prod.name)}</strong>`; }
    return esc(match);
  });
  const productCards = productRefs.map(p => `
    <div class="card" style="padding:10px;display:flex;align-items:center;gap:10px;margin-top:6px;cursor:pointer" data-action="view-product" data-id="${p.id}" role="button" tabindex="0">
      <span style="font-size:20px" aria-hidden="true">${p.flag}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</div>
        <div style="font-size:11px;color:var(--gold)">${fmtInt(p.price)}</div>
      </div>
      <span style="color:var(--gold);font-size:12px;font-weight:600;flex-shrink:0">View ›</span>
    </div>`).join('');
  return `
    <div style="display:flex;flex-direction:column;align-items:${isUser?'flex-end':'flex-start'}">
      <div class="${isUser?'chat-bubble-user':'chat-bubble-ai'}" role="${isUser?'log':''}">${isUser ? esc(msg.content) : content}</div>
      ${!isUser && productCards ? productCards : ''}
      <div class="chat-time" style="text-align:${isUser?'right':'left'}">${esc(time)}</div>
    </div>`;
}

function getSimulatedResponse(prompt) {
  const lower = prompt.toLowerCase();
  if (/hello|hi|hey/.test(lower)) return `Good day! I'm delighted to assist you in Bangalore. Whether you seek a rare Miyazaki mango (p_mango), our finest Kobe Wagyu (p_wagyu_steak), or a bespoke skincare ritual, I am entirely at your service. How may I curate for you today?`;
  if (/truffle|alba/.test(lower)) return `An excellent choice. Our Italian White Truffle from Alba (p_truffle) is among the rarest ingredients on earth. Hand-foraged in Piedmont, it commands ₹12,500 — and worth every rupee. Shall I add it to your curation?`;
  if (/wagyu|kobe|beef/.test(lower)) return `For the discerning carnivore, I recommend our A5 Kagoshima Wagyu Ribeye (p_wagyu_steak) — a BMS-10 masterpiece, or the A5 Kobe Wagyu Slidettes (p_wagyu_sliders) for a more casual indulgence. Both are extraordinary.`;
  if (/pairing|wine|champagne/.test(lower)) return `For a perfect evening, I suggest our Dom Pérignon Vintage 2015 (p_champagne) paired with Italian White Truffle (p_truffle). The 2015 vintage's chalky minerality is transcendent alongside umami-rich ingredients.`;
  if (/whisky|whiskey|scotch/.test(lower)) return `The Macallan 18 Year Sherry Oak (p_whisky) is the crown jewel of our spirits collection. Rich dried fruit, chocolate orange, and warming ginger spice — best served neat.`;
  if (/lipstick|lips/.test(lower)) return `Two icons await you. The Satin Champagne Gold (p_lipstick_gold) for luminous golden evenings, and the Rose Velvet Matte (p_lipstick_crimson) for bold crimson drama. Visit our AR Mirror to trial both shades live.`;
  if (/skin|skincare|serum/.test(lower)) return `For a complete luxury ritual: the Andean Black Orchid Renewal Essence (p_serum_orchid) — 24K gold + retinol — paired with the Beluga Caviar Eye Therapy (p_eye_cream) for overnight cellular regeneration.`;
  if (/cheese/.test(lower)) return `Our Brie de Meaux AOP (p_cheese_brie) is at perfect ripeness today, and our 36-month Parmigiano Reggiano (p_cheese_parm) from Cravero is intensely crystalline.`;
  if (/mango|miyazaki|fruit/.test(lower)) return `The Japanese Miyazaki Mango (p_mango) — "Egg of the Sun" — is perhaps the world's most perfect fruit. Sugar content guaranteed above 15%, completely fibreless. ₹4,500 for an unforgettable experience.`;
  if (/coffee/.test(lower)) return `Our Gesha Village Anaerobic Natural (p_coffee) scored 93.5 on the SCA scale. Jasmine florals, mango, and bergamot — it brews like liquid perfume.`;
  if (/matcha|tea/.test(lower)) return `The Ippodo First Flush Uji Matcha (p_matcha) is ceremonial grade at its finest — brilliant emerald, creamy sweetness, zero bitterness.`;
  return `At Maison Lux, every product is curated from the world's finest artisans. From rare Kashmiri saffron (p_saffron) to Tsukiji bluefin otoro (p_bluefin), we deliver Bangalore's most exclusive selection to your door within 45 minutes. How may I serve you?`;
}

async function sendMessage(container, text) {
  const msgs = [...(store.get('chatMessages') || [])];
  msgs.push({ sender: 'user', content: text, timestamp: Date.now() });
  store.set('chatMessages', msgs);
  store.set('chatLoading', true, { noPersist: true });
  refreshMessages(container);

  let response = '';
  try {
    const res = await fetch('/api/concierge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text, history: msgs.slice(0,-1).map(m => ({ role: m.sender==='user'?'user':'model', parts: [{ text: m.content }] })) })
    });
    if (res.ok) response = (await res.json()).text || '';
  } catch (_) {}

  if (!response) response = getSimulatedResponse(text);

  const updatedMsgs = [...(store.get('chatMessages') || [])];
  updatedMsgs.push({ sender: 'AI', content: response, timestamp: Date.now() });
  store.set('chatMessages', updatedMsgs);
  store.set('chatLoading', false, { noPersist: true });
  refreshMessages(container);
}

function refreshMessages(container) {
  const msgs = store.get('chatMessages') || [];
  const loading = store.get('chatLoading');
  const chatEl = container.querySelector('#chat-messages');
  if (!chatEl) return;
  chatEl.innerHTML = msgs.map(renderBubble).join('') +
    (loading ? `<div style="display:flex;gap:5px;padding:10px 14px;background:var(--frosted);border:1px solid var(--dark-border);border-radius:18px 18px 18px 4px;align-self:flex-start;width:60px" aria-label="AI is typing" aria-live="polite">
      <div class="typing-dot" style="animation-delay:0s"></div>
      <div class="typing-dot" style="animation-delay:0.2s"></div>
      <div class="typing-dot" style="animation-delay:0.4s"></div>
    </div>` : '');
  chatEl.scrollTop = chatEl.scrollHeight;
}

export function render(container) {
  const msgs = store.get('chatMessages') || [];
  if (!msgs.length) {
    const profile = store.get('profile') || {};
    store.set('chatMessages', [{
      sender: 'AI',
      content: `Greetings, ${esc(profile.name || 'esteemed guest')}. Welcome to Maison Lux. I am your bespoke AI Shopping Butler. Let me assist you in pairing premium beverages, selecting luxury skincare, or arranging exotic ingredients. How may I serve you today?`,
      timestamp: Date.now()
    }]);
  }

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="screen-header" style="position:sticky;top:0;z-index:10">
        <h1 style="font-family:var(--font-serif)">AI Concierge Butler</h1>
        <button style="background:none;border:none;color:var(--gold);cursor:pointer;font-size:13px;font-weight:600" data-action="clear-chat" aria-label="Clear chat">Clear</button>
      </div>
      <div id="chat-messages" style="flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:12px;padding-bottom:80px" aria-live="polite" role="log">
        ${(store.get('chatMessages')||[]).map(renderBubble).join('')}
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;padding:12px 16px;background:var(--dark-bg);border-top:1px solid var(--dark-border);display:flex;gap:8px">
        <input class="glass-input" id="chat-input" placeholder="Ask your butler anything..." style="flex:1" aria-label="Message input" autocomplete="off">
        <button class="btn-gold" style="padding:10px 14px;font-size:16px;flex-shrink:0" data-action="send-chat" aria-label="Send message">▶</button>
      </div>
    </div>`;

  const chatMsgs = container.querySelector('#chat-messages');
  if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight;

  const input = container.querySelector('#chat-input');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); doSend(container); }
    });
  }

  container.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    switch (el.dataset.action) {
      case 'send-chat': doSend(container); break;
      case 'clear-chat':
        store.set('chatMessages', []);
        render(container);
        break;
      case 'view-product':
        navigateTo('detail', { productId: el.dataset.id });
        break;
    }
  });
}

function doSend(container) {
  const input = container.querySelector('#chat-input');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';
  sendMessage(container, text);
}
