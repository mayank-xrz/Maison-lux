function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/**
 * @param {string} msg
 * @param {'info'|'success'|'error'} type
 * @param {number} duration
 * @param {{label?:string, onClick?:function}} [action]
 */
export function showToast(msg, type = 'info', duration = 2500, action) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'polite');
  el.style.pointerEvents = 'auto';
  el.innerHTML = esc(msg) + (action ? `<button class="toast-action" style="margin-left:10px;background:rgba(0,0,0,0.2);border:none;color:inherit;padding:3px 8px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">${esc(action.label)}</button>` : '');
  if (action) el.querySelector('.toast-action').addEventListener('click', () => { action.onClick(); el.remove(); });
  container.appendChild(el);
  const hide = () => { el.classList.add('hide'); setTimeout(() => el.remove(), 350); };
  setTimeout(hide, duration);
}
