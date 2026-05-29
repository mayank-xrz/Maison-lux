import { store } from '../state.js';
import { calcTier, loyaltyMultiplier } from '../utils.js';

export const DELIVERY_RULES = [
  { min: 0,    max: 500,  fee: 79 },
  { min: 500,  max: 1000, fee: 49 },
  { min: 1000, max: 1500, fee: 29 },
  { min: 1500, max: Infinity, fee: 0 },
];

/** Tiered delivery fee; Gold/Platinum always free */
export function getDynamicDeliveryFee(subtotal) {
  const profile = store.get('profile') || {};
  if (['Gold','Platinum'].includes(profile.loyaltyTier)) return 0;
  const rule = DELIVERY_RULES.find(r => subtotal >= r.min && subtotal < r.max);
  return rule ? rule.fee : 79;
}

/** Convert loyalty points to wallet credit (1 pt = ₹0.50) */
export function pointsToWallet(points) {
  return points * 0.5;
}

/** Award points after order; mutates profile in store */
export function awardPoints(totalPayable) {
  const profile = { ...(store.get('profile') || {}) };
  const mult = loyaltyMultiplier(profile.loyaltyTier);
  const earned = Math.floor(totalPayable / 100) * mult;
  profile.loyaltyPoints = Math.round((profile.loyaltyPoints || 0) + earned);
  profile.loyaltyTier = calcTier(profile.loyaltyPoints);
  store.set('profile', profile);
  return earned;
}
