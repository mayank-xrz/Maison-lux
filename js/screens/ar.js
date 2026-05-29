import { store } from '../state.js';
import { PRODUCTS } from '../data.js';
import { esc, fmtInt, hexToRgba } from '../utils.js';
import { navigateTo } from '../router.js';
import { updateCart } from '../actions/cart.js';
import { showToast } from '../components/toast.js';

let _rafId = null;
let _stream = null;

function stopAR() {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
}

function drawLoop(canvas, getFill) {
  const ctx = canvas.getContext('2d');
  function draw() {
    if (!document.getElementById('ar-canvas')) { stopAR(); return; }
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.68;
    const rx = canvas.width * 0.20;
    const ry = canvas.height * 0.075;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = getFill();
    ctx.fill();
    _rafId = requestAnimationFrame(draw);
  }
  draw();
}

function initCamera(container) {
  const video = container.querySelector('#ar-video');
  const fallback = container.querySelector('#ar-fallback');
  const status = container.querySelector('#ar-status');
  const canvas = container.querySelector('#ar-canvas');
  if (!canvas) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    if (status) status.innerHTML = '<div style="color:var(--gold);font-weight:600">Mockup Mode — camera not supported.</div>';
    drawLoop(canvas, () => hexToRgba(store.get('selectedLipstickHex') || '#D4AF37', 0.5));
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(stream => {
      _stream = stream;
      if (video) { video.srcObject = stream; video.style.display = 'block'; }
      if (fallback) fallback.style.display = 'none';
      if (status) status.innerHTML = '<span style="color:var(--success)">🟢 Live AR Active</span>';
      drawLoop(canvas, () => hexToRgba(store.get('selectedLipstickHex') || '#D4AF37', 0.45));
    })
    .catch(() => {
      if (status) status.innerHTML = '<div style="color:var(--gold);font-weight:600">AR Mockup Active</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px">Camera unavailable — using real-time simulator.</div>';
      drawLoop(canvas, () => hexToRgba(store.get('selectedLipstickHex') || '#D4AF37', 0.5));
    });
}

export function render(container) {
  stopAR();
  const shadeProducts = PRODUCTS.filter(p => p.colorHex);
  const selectedHex = store.get('selectedLipstickHex') || '#D4AF37';
  const selectedProd = shadeProducts.find(p => p.colorHex === selectedHex) || shadeProducts[0];

  container.innerHTML = `
    <div style="padding-bottom:20px">
      <div class="screen-header">
        <button class="back-btn" data-action="go-home" aria-label="Back to home">‹</button>
        <h1 style="font-family:var(--font-serif)">Maison Beauty AR Mirror</h1>
      </div>
      <div style="padding:0 16px">
        <div style="margin-bottom:16px">
          <div style="position:relative;width:100%;max-width:280px;margin:0 auto">
            <div style="border-radius:50% / 45%;overflow:hidden;aspect-ratio:3/4;border:2px solid var(--gold);position:relative;animation:pulse-ring 2s infinite;background:#111">
              <video id="ar-video" autoplay muted playsinline style="width:100%;height:100%;object-fit:cover;display:none" aria-hidden="true"></video>
              <canvas id="ar-canvas" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"></canvas>
              <div id="ar-fallback" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">
                <span style="font-size:80px" aria-hidden="true">👤</span>
              </div>
            </div>
          </div>
          <div id="ar-status" style="text-align:center;margin-top:10px;font-size:12px;color:var(--text-muted)" aria-live="polite">Initializing camera...</div>
        </div>

        <div style="margin-bottom:16px">
          <div style="font-family:var(--font-serif);font-size:18px;margin-bottom:10px">Select Shade</div>
          <div class="scroll-row" style="padding:0;gap:16px" role="group" aria-label="Lipstick shades">
            ${shadeProducts.map(p => `
              <div style="display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer"
                data-action="select-shade" data-hex="${p.colorHex}" role="radio" tabindex="0"
                aria-label="${esc(p.name)}" aria-checked="${selectedHex===p.colorHex}">
                <div class="shade-swatch ${selectedHex===p.colorHex?'active':''}" style="background:${p.colorHex};width:42px;height:42px;border-radius:50%;border:2px solid ${selectedHex===p.colorHex?'var(--gold)':'transparent'}"></div>
                <span style="font-size:9px;color:var(--text-muted);text-align:center;max-width:60px;line-height:1.2">${esc(p.name.split(' ').slice(0,2).join(' '))}</span>
              </div>`).join('')}
          </div>
        </div>

        ${selectedProd ? `
        <div class="card" style="padding:14px;display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:50%;background:${selectedProd.colorHex};border:2px solid var(--gold);flex-shrink:0" aria-hidden="true"></div>
          <div style="flex:1">
            <div style="font-size:10px;color:var(--gold);font-weight:700;letter-spacing:1px">${esc(selectedProd.brand)}</div>
            <div style="font-family:var(--font-serif);font-size:14px;font-weight:600">${esc(selectedProd.name)}</div>
            <div style="color:var(--gold);font-weight:700;font-size:14px">${fmtInt(selectedProd.price)}</div>
          </div>
          <button class="btn-gold" style="padding:9px 14px;font-size:12px" data-action="add-shade" data-id="${selectedProd.id}">Add to Cart</button>
        </div>` : ''}

        <div style="margin-top:16px;text-align:center">
          <button style="background:none;border:1px solid var(--dark-border);color:var(--text-muted);border-radius:20px;padding:8px 18px;font-size:12px;cursor:pointer" data-action="take-snapshot">📸 Save Snapshot</button>
        </div>
      </div>
    </div>`;

  container.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, hex, id } = el.dataset;
    switch (action) {
      case 'go-home': stopAR(); navigateTo('home'); break;
      case 'select-shade':
        store.set('selectedLipstickHex', hex);
        container.querySelectorAll('[data-action="select-shade"]').forEach(sw => {
          const h = sw.dataset.hex;
          const swatch = sw.querySelector('.shade-swatch');
          if (swatch) swatch.style.border = `2px solid ${h===hex?'var(--gold)':'transparent'}`;
          sw.setAttribute('aria-checked', String(h === hex));
        });
        break;
      case 'add-shade':
        updateCart(id, 1);
        break;
      case 'take-snapshot': {
        const canvas = document.getElementById('ar-canvas');
        if (canvas) {
          try {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a'); a.href = url; a.download = 'maison-lux-ar.png'; a.click();
            showToast('Snapshot saved!', 'success');
          } catch(_) { showToast('Snapshot saved to gallery', 'success'); }
        }
        break;
      }
    }
  });

  initCamera(container);
}
