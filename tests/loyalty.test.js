import { describe, it, expect, vi } from 'vitest';
import { pointsToWallet, getDynamicDeliveryFee, DELIVERY_RULES } from '../js/features/dynamicPricing.js';

// Mock store
vi.mock('../js/state.js', () => ({
  store: {
    get: (key) => {
      if (key === 'profile') return { loyaltyTier: 'Silver', loyaltyPoints: 420 };
      return null;
    },
    set: vi.fn(),
    on: vi.fn(),
    update: vi.fn(),
  },
  default: {
    get: (key) => {
      if (key === 'profile') return { loyaltyTier: 'Silver', loyaltyPoints: 420 };
      return null;
    },
    set: vi.fn(),
    on: vi.fn(),
    update: vi.fn(),
  },
}));

describe('pointsToWallet', () => {
  it('converts 1 point to ₹0.50', () => {
    expect(pointsToWallet(1)).toBe(0.5);
  });
  it('converts 100 points to ₹50', () => {
    expect(pointsToWallet(100)).toBe(50);
  });
  it('zero points gives zero', () => {
    expect(pointsToWallet(0)).toBe(0);
  });
});

describe('getDynamicDeliveryFee', () => {
  it('charges ₹79 for subtotal below ₹500', () => {
    expect(getDynamicDeliveryFee(0)).toBe(79);
    expect(getDynamicDeliveryFee(499)).toBe(79);
  });

  it('charges ₹49 for ₹500–₹999', () => {
    expect(getDynamicDeliveryFee(500)).toBe(49);
    expect(getDynamicDeliveryFee(999)).toBe(49);
  });

  it('charges ₹29 for ₹1000–₹1499', () => {
    expect(getDynamicDeliveryFee(1000)).toBe(29);
    expect(getDynamicDeliveryFee(1499)).toBe(29);
  });

  it('is free for ₹1500+', () => {
    expect(getDynamicDeliveryFee(1500)).toBe(0);
    expect(getDynamicDeliveryFee(99999)).toBe(0);
  });
});

describe('DELIVERY_RULES', () => {
  it('has 4 tiers', () => {
    expect(DELIVERY_RULES).toHaveLength(4);
  });
  it('last tier has Infinity max', () => {
    expect(DELIVERY_RULES[DELIVERY_RULES.length - 1].max).toBe(Infinity);
  });
});
