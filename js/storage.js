export const STORAGE_VERSION = 2;
const KEY = 'maison_lux_v' + STORAGE_VERSION;

const PERSIST_KEYS = ['cart','wishlist','appliedCoupon','selectedPaymentMethod',
  'selectedDeliverySlot','orders','chatMessages','selectedLipstickHex','isDarkTheme',
  'profile','customCoupons','checkedPincode','isServiceable','activeOrderId','driverMessages'];

export function persistState(state) {
  try {
    const toSave = {};
    PERSIST_KEYS.forEach(k => { if (k in state) toSave[k] = state[k]; });
    localStorage.setItem(KEY, JSON.stringify(toSave));
  } catch(e) { console.warn('[Storage] persist failed:', e); }
}

export function hydrateState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migration: ensure wishlist is array
    if (parsed.wishlist && !Array.isArray(parsed.wishlist)) parsed.wishlist = [];
    // Ensure profile has all fields
    if (parsed.profile) {
      parsed.profile.isSubscribedLuxBox ??= false;
      parsed.profile.subscribedBoxType ??= null;
    }
    return parsed;
  } catch(e) { console.warn('[Storage] hydrate failed:', e); return null; }
}

export function clearStorage() {
  try { localStorage.removeItem(KEY); } catch(_) {}
}
