import { store } from './state.js';

let _screenModules = {};

export function registerScreens(modules) { _screenModules = modules; }

export function navigateTo(screen, params = {}) {
  if (store.get('trackingAnimFrame')) {
    cancelAnimationFrame(store.get('trackingAnimFrame'));
    store.set('trackingAnimFrame', null, { noPersist: true });
  }
  store.update({
    currentScreen: screen,
    navigationDetail: params.productId || null,
    navigationOrder: params.orderId || null,
  });
  // Scroll screen to top
  const screenEl = document.getElementById('screen');
  if (screenEl) screenEl.scrollTop = 0;
}

export function navigateUp() { navigateTo('home'); }

export function renderCurrentScreen(container) {
  const screen = store.get('currentScreen');
  const hideNav = ['detail','tracking','admin'].includes(screen);
  const navEl = document.getElementById('bottom-nav');
  const screenEl = container || document.getElementById('screen');
  if (!screenEl) return;
  if (hideNav) { screenEl.style.bottom = '0'; if (navEl) navEl.style.display = 'none'; }
  else { screenEl.style.bottom = '80px'; if (navEl) navEl.style.display = 'flex'; }
  const mod = _screenModules[screen] || _screenModules['home'];
  if (mod?.render) mod.render(screenEl);
}
