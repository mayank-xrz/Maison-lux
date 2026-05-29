import { describe, it, expect } from 'vitest';
import { fmt, fmtInt, esc, fuzzyMatch, calcTier, loyaltyMultiplier, stars } from '../js/utils.js';

describe('fmt', () => {
  it('formats rupees with decimals', () => {
    expect(fmt(1234.5)).toBe('₹1,234.50');
  });
  it('handles zero', () => {
    expect(fmt(0)).toBe('₹0.00');
  });
});

describe('fmtInt', () => {
  it('formats rupees without decimals', () => {
    expect(fmtInt(12500)).toBe('₹12,500');
  });
});

describe('esc', () => {
  it('escapes HTML special chars', () => {
    expect(esc('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
  it('escapes ampersand', () => {
    expect(esc('A & B')).toBe('A &amp; B');
  });
  it('handles non-string input', () => {
    expect(esc(42)).toBe('42');
  });
});

describe('fuzzyMatch', () => {
  it('matches substring exactly', () => {
    expect(fuzzyMatch('Japanese Miyazaki Mango', 'mango')).toBe(true);
  });
  it('matches chars in order', () => {
    expect(fuzzyMatch('truffle', 'tfl')).toBe(true);
  });
  it('fails when chars are not in order', () => {
    expect(fuzzyMatch('truffle', 'zxq')).toBe(false);
  });
  it('empty query always matches', () => {
    expect(fuzzyMatch('anything', '')).toBe(true);
  });
});

describe('calcTier', () => {
  it('Silver below 1000', () => {
    expect(calcTier(420)).toBe('Silver');
    expect(calcTier(0)).toBe('Silver');
    expect(calcTier(999)).toBe('Silver');
  });
  it('Gold between 1000 and 2999', () => {
    expect(calcTier(1000)).toBe('Gold');
    expect(calcTier(2999)).toBe('Gold');
  });
  it('Platinum at 3000+', () => {
    expect(calcTier(3000)).toBe('Platinum');
    expect(calcTier(99999)).toBe('Platinum');
  });
});

describe('loyaltyMultiplier', () => {
  it('Silver = 1.0', () => { expect(loyaltyMultiplier('Silver')).toBe(1.0); });
  it('Gold = 1.5', () => { expect(loyaltyMultiplier('Gold')).toBe(1.5); });
  it('Platinum = 2.0', () => { expect(loyaltyMultiplier('Platinum')).toBe(2.0); });
  it('unknown = 1.0', () => { expect(loyaltyMultiplier('Bronze')).toBe(1.0); });
});
