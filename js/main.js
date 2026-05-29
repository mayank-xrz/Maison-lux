import { store } from './state.js';
import { hydrateState } from './storage.js';
import { navigateTo, registerScreens, renderCurrentScreen } from './router.js';
import { renderBottomNav } from './components/bottomNav.js';

// Hydrate state from localStorage before first render
const saved = hydrateState();
if (saved) store.hydrate(saved);

// Apply theme
document.documentElement.setAttribute('data-theme', store.get('isDarkTheme') ? 'dark' : 'light');

// Lazy-load all screen modules
const screenModules = {};

async function loadScreen(name) {
  if (screenModules[name]) return screenModules[name];
  const mod = await import(`./screens/${name === 'tryon' ? 'ar' : name}.js`);
  screenModules[name] = mod;
  return mod;
}

async function renderScreen() {
  const screen = store.get('currentScreen') || 'home';
  const container = document.getElementById('screen');
  if (!container) return;

  const hideNav = ['detail','tracking','admin'].includes(screen);
  const navEl = document.getElementById('bottom-nav');
  if (hideNav) { container.style.bottom = '0'; if (navEl) navEl.style.display = 'none'; }
  else { container.style.bottom = '80px'; if (navEl) navEl.style.display = 'flex'; }

  try {
    const mod = await loadScreen(screen);
    if (mod?.render) mod.render(container);
  } catch (err) {
    console.error('[main] screen load failed', err);
    const fallback = await loadScreen('home');
    fallback?.render(container);
  }
  renderBottomNav();
}

// Subscribe to screen changes
store.on('currentScreen', () => {
  document.getElementById('screen')?.scrollTo({ top: 0 });
  renderScreen();
});

// Keep cart badge updated
store.on('cart', () => renderBottomNav());

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// PWA install prompt
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  store.set('pwaPromptEvent', e, { noPersist: true });
});

// Global event delegation for cart controls rendered in any screen
document.getElementById('screen')?.addEventListener('click', e => {
  // Handled per-screen; this is a safety net for any missed delegation
});

// Initial render
renderScreen();
