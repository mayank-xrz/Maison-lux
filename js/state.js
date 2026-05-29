/** @typedef {Object} Profile */
/** @typedef {Object} AppState */

const INITIAL = {
  currentScreen: 'home',
  selectedCategory: 'All',
  searchQuery: '',
  checkedPincode: '560001',
  isServiceable: true,
  filterVegan: false, filterKeto: false, filterOrganic: false,
  cart: {},           // { productId: quantity }
  wishlist: [],       // array of productIds (JSON-serializable unlike Set)
  appliedCoupon: null,
  couponError: null,
  selectedPaymentMethod: 'Wallet',
  selectedDeliverySlot: 'Express (10-45 mins)',
  orders: [],
  activeOrderId: null,
  chatMessages: [],
  chatLoading: false,
  selectedLipstickHex: '#D4AF37',
  isDarkTheme: true,
  profile: {
    name: 'Mayank', email: 'mayank@maisonlux.com', phone: '+91 98765 43210',
    walletBalance: 5000.00, loyaltyPoints: 420, loyaltyTier: 'Silver',
    pincode: '560001', savedAddress: '12, Lavelle Road, UB City, Bangalore — 560001',
    referralCode: 'MLUXMAYANK', isSubscribedLuxBox: false, subscribedBoxType: null
  },
  navigationDetail: null,
  navigationOrder: null,
  customCoupons: [],
  detailTab: 'description',
  driverMessages: [{ sender: 'driver', content: 'On my way, sir! ETA ~8 minutes.', time: Date.now() }],
  trackingAnimFrame: null,
  adminWalletInput: '1500',
  pwaPromptEvent: null,
};

class ReactiveStore {
  #state; #listeners = new Map();
  constructor(initial) { this.#state = structuredClone(initial); }
  get(key) { return this.#state[key]; }
  getAll() { return this.#state; }
  set(key, value, opts = {}) {
    const prev = this.#state[key];
    this.#state[key] = value;
    if (!opts.silent) { this.#emit(key, value, prev); this.#emit('*', this.#state, null); }
    if (!opts.noPersist) this.#persist();
  }
  update(updater, opts = {}) {
    const patch = typeof updater === 'function' ? updater(this.#state) : updater;
    for (const [k, v] of Object.entries(patch)) { const prev = this.#state[k]; this.#state[k] = v; if (!opts.silent) this.#emit(k, v, prev); }
    if (!opts.silent) this.#emit('*', this.#state, null);
    if (!opts.noPersist) this.#persist();
  }
  on(key, fn) {
    if (!this.#listeners.has(key)) this.#listeners.set(key, new Set());
    this.#listeners.get(key).add(fn);
    return () => this.#listeners.get(key)?.delete(fn);
  }
  #emit(key, value, prev) { this.#listeners.get(key)?.forEach(fn => { try { fn(value, prev, this.#state); } catch(e) { console.error('[Store]', e); } }); }
  #persist() { try { import('./storage.js').then(m => m.persistState(this.#state)); } catch(_) {} }
  hydrate(saved) { for (const [k,v] of Object.entries(saved)) this.#state[k] = v; }
}

export const store = new ReactiveStore(INITIAL);
export default store;
