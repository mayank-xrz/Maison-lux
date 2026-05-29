let _onClose = null;

export function showModal(html, onClose) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.innerHTML = `<div class="modal-sheet" role="dialog" aria-modal="true">${html}</div>`;
  overlay.classList.add('active');
  _onClose = onClose || null;
  // Focus trap
  const sheet = overlay.querySelector('.modal-sheet');
  const focusable = sheet.querySelectorAll('button,input,a,[tabindex]:not([tabindex="-1"])');
  if (focusable.length) focusable[0].focus();
  const first = focusable[0], last = focusable[focusable.length - 1];
  sheet.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault(); (e.shiftKey ? last : first).focus();
    }
  });
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.innerHTML = '';
  if (_onClose) { _onClose(); _onClose = null; }
}

// Global click-outside handler
document.addEventListener('click', e => {
  const overlay = document.getElementById('modal-overlay');
  if (overlay?.classList.contains('active') && e.target === overlay) closeModal();
});
