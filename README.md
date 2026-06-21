# Éclat Grandeur

A luxury diamond jewellery storefront — engagement rings, necklaces, bracelets,
earrings, wedding bands and high jewellery — built as a fast, mobile-first, custom
Next.js application.

## Stack

- **Next.js 14 (App Router)** + TypeScript
- **TailwindCSS** — restrained luxury design tokens (`tailwind.config.ts`)
- **react-three-fiber / @react-three/drei (Three.js)** — the real-time 3D 360° viewer
- **Zustand** — cart + ring-builder state
- **React Hook Form + Zod** — forms and shared validation
- **Framer Motion** — elegant scroll reveals

## Signature features

- **Real-time 3D 360° viewer** (`src/components/product/JewelViewer.tsx`) — one engine
  used on product pages and in the configurator. Renders a procedural diamond until real
  `.glb` assets exist, and falls back to the gallery when WebGL is unavailable.
- **Engagement-ring builder** (`src/app/engagement-rings/builder/*`) — choose setting →
  choose diamond by shape + 4Cs (compatibility-filtered) → review with live 3D preview and
  live pricing (`src/lib/builder/pricing.ts`).
- **Hybrid commerce** — `purchase.mode` on each product drives Add-to-Bag vs Request-a-Quote
  (`src/components/product/BuyOrEnquire.tsx`).
- **Diamond education hub**, **appointment/concierge booking**, and **enquiry** flows.

## Architecture

All UI reads through the data seam in `src/lib/data/*`, backed by JSON in `src/data/*`
(swap to a CMS like Sanity later without touching components).

## Commands

```bash
npm run dev        # local dev at http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest unit tests (pricing, compatibility, validation)
```

## Asset specification (for real photography / 3D)

- **Product images:** 5–7 portrait shots per piece, ≥ 1200×1500 (4:5), into
  `public/images/<category>/<slug>/`; update `src` in `src/data/products.json`.
- **3D models:** one `.glb` per piece in `public/models/<category>/<slug>.glb`
  (Draco/meshopt-compressed, KTX2 textures, target < 3–5 MB), authored with named metal
  materials and a centre-stone node so the configurator can rebind them. Point the
  `model3d.src` field at the file — no component changes needed.

## Roadmap

- **Phase 2:** real `.glb` assets, Stripe checkout + Klarna/Affirm, accounts, Sanity CMS.
- **Phase 3:** AR virtual try-on on the same 3D assets, CRM-backed appointment calendar,
  wishlist/save-the-build, internationalisation.

## Environment

Copy `.env.example` to `.env.local`. Form submissions log to the server console unless
`RESEND_API_KEY` is set.
