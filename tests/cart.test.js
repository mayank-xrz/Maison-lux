import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCouponDiscount } from '../js/utils.js';

// Mock the store used by getCouponDiscount
vi.mock('../js/state.js', () => ({
  store: {
    get: (key) => key === 'customCoupons' ? [] : null,
    set: vi.fn(),
    on: vi.fn(),
    update: vi.fn(),
  },
  default: {
    get: (key) => key === 'customCoupons' ? [] : null,
    set: vi.fn(),
    on: vi.fn(),
    update: vi.fn(),
  },
}));

describe('getCouponDiscount', () => {
  it('returns flat discount for WELCOME', () => {
    expect(getCouponDiscount('WELCOME', 5000)).toBe(250);
  });

  it('returns percent discount for AMEXGOLD', () => {
    expect(getCouponDiscount('AMEXGOLD', 10000)).toBe(1500);
  });

  it('is case-insensitive', () => {
    expect(getCouponDiscount('welcome', 5000)).toBe(250);
  });

  it('returns null for unknown code', () => {
    expect(getCouponDiscount('FAKE', 5000)).toBeNull();
  });

  it('handles zero subtotal', () => {
    expect(getCouponDiscount('AMEXGOLD', 0)).toBe(0);
  });

  it('MLUXMAYANK gives flat 200', () => {
    expect(getCouponDiscount('MLUXMAYANK', 3000)).toBe(200);
  });
});
