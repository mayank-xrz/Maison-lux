# Changelog

## [2.0.0] — Phase 3 (2026-05-29)

### Added
- 32 Vitest unit tests (utils, cart, loyalty/pricing)
- `esc()` XSS hardening on all user/AI output throughout screens
- requestAnimationFrame cleanup in AR mirror and tracking canvas
- Focus trap in modals (keyboard navigation + Escape to close)
- `prefers-reduced-motion` CSS media query
- `aria-*` attributes across nav, product cards, buttons, chat

### Fixed
- DELIVERY_RULES upper bounds (500/1000/1500 inclusive, not 499/999/1499)
- `getProduct()` now imports PRODUCTS directly from data.js

## [1.5.0] — Phase 2B (2026-05-29)

### Added
- Reactive pub/sub `ReactiveStore` with private class fields
- `getFrequentlyBoughtTogether` using order history + PRODUCT_PAIRINGS
- `getPersonalisedFeed` scoring engine for home screen
- `getCartSuggestions` cross-sell in cart
- `getDynamicDeliveryFee` tiered delivery (₹79/₹49/₹29/Free)
- `pointsToWallet` and `awardPoints` (tier-multiplied loyalty)
- AR Mirror: live canvas lip overlay, shade comparison, snapshot download

## [1.2.0] — Phase 2 (2026-05-29)

### Added
- localStorage persistence (STORAGE_VERSION=2, key=maison_lux_v2)
- `/api/concierge` serverless Gemini proxy (key never in client)
- PWA: service worker + manifest.json
- Optimistic cart updates with undo toast
- Debounced fuzzy search on home screen
- Skeleton loaders
- Progressive order status updates (Confirmed→Packed→Delivered)
- Cart cross-sell suggestions strip

## [1.1.0] — Phase 1 (2026-05-29)

### Changed
- Split 2,504-line monolith into Vite + ES modules
- All `onclick` handlers replaced with `data-action` event delegation
- `wishlist` stored as Array (was Set — not JSON-serializable)

## [1.0.0] — Initial Release

### Added
- Single-file SPA: 8 screens, 28 products across 10 categories
- Gold/dark luxury design system (Cormorant Garamond + DM Sans)
- AI Concierge with Gemini API + simulated fallback responses
- AR Mirror with getUserMedia + canvas lip overlay
- Order tracking with animated canvas route map
- Loyalty Circle: Silver/Gold/Platinum tiers
- Admin panel: wallet injector, coupon registry
