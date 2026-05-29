# Maison Lux

Ultra-luxury quick-commerce SPA for Bangalore. Delivers exotic groceries, gourmet meats, artisan cheeses, fine wines, and haute cosmetics within 45 minutes.

## Stack

- **Vanilla JS ES Modules** — no framework
- **Vite 5** — dev server + code-splitting build
- **Vitest 1** — unit tests
- **PWA** — service worker with offline shell + Unsplash cache-first
- **Gemini 2.0 Flash** — AI concierge (via serverless proxy)

## Project Structure

```
├── index.html              # App shell (module entry point)
├── css/styles.css          # Full design system
├── js/
│   ├── main.js             # Entry: hydrates state, lazy-loads screens
│   ├── state.js            # ReactiveStore (pub/sub, localStorage)
│   ├── storage.js          # Persist / hydrate helpers
│   ├── data.js             # 28 products, categories, coupons, pairings
│   ├── utils.js            # fmt, esc, fuzzyMatch, calcCart, loyalty
│   ├── router.js           # navigateTo, screen registration
│   ├── actions/cart.js     # Optimistic cart updates + undo toast
│   ├── components/         # toast, modal, bottomNav, productCard, skeleton
│   ├── features/
│   │   ├── recommendations.js   # Co-occurrence engine + PRODUCT_PAIRINGS
│   │   └── dynamicPricing.js    # Tiered delivery, pointsToWallet, awardPoints
│   └── screens/            # home, concierge, ar, cart, tracking, detail, profile, admin
├── api/concierge.js        # Edge serverless proxy (Gemini key server-side)
├── public/
│   ├── sw.js               # Service worker
│   └── manifest.json       # PWA manifest
└── tests/                  # Vitest tests (utils, cart, loyalty)
```

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 32 unit tests
npm run build      # Production build to dist/
```

## AI Concierge Setup

The AI concierge uses a serverless proxy to keep the API key server-side.

1. Create `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. Deploy `api/concierge.js` to Vercel/Netlify as an edge function.
3. **Never commit a real API key.** The client only calls `/api/concierge`.

## Loyalty Tiers

| Tier | Points | Multiplier | Delivery |
|------|--------|-----------|----------|
| Silver | 0–999 | 1.0× | Tiered (₹29–₹79) |
| Gold | 1,000–2,999 | 1.5× | Free |
| Platinum | 3,000+ | 2.0× | Free |

## Security

- `esc()` applied to all user/AI content before DOM insertion
- Gemini API key never in client bundle
- XSS-hardened throughout
