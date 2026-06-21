# Éclat Grandeur

> The Art of the Extraordinary Diamond.

A luxury diamond jewellery storefront — **engagement rings, earrings, necklaces,
bracelets and bespoke** — built from scratch as a fast, cinematic, mobile-first
Next.js application. The design language is a deliberate hybrid: the cinematic
drama of De Beers, the serif romance of Tiffany, the clean, trustworthy commerce
of Blue Nile, and the tech-forward diamond focus of James Allen.

## The signature idea: a procedural jewellery engine

The entire catalogue is rendered with an **original SVG jewellery engine** — no
stock photography, no placeholder boxes. Faceted, sparkling diamonds are drawn
from cut geometry and composed into recognisable pieces (solitaires, halos,
studs, drops, hoops, pendants, rivières, tennis bracelets, bangles, eternity
bands). Every product, hero and category tile is generated from a small `art`
descriptor, so the whole site looks like editorial photography while remaining
tiny, themeable and instantly re-coloured across four metals.

- `src/components/art/geometry.ts` — facet math for ten diamond cuts
- `src/components/art/Diamond.tsx` — the faceted, sparkling stone renderer
- `src/components/art/JewelArt.tsx` — composes stones + metalwork into full pieces
- `src/components/art/Sparkle.tsx` — animated sparkle accents

## Signature features

- **Interactive diamond viewer** (`DiamondViewer`) — drag-to-tilt pseudo-3D,
  auto-rock, zoom and live metal switching, all in SVG/CSS (our take on the
  James Allen HD viewer; no WebGL required).
- **Design-your-own ring builder** (`/builder`) — choose a setting → select a
  GIA-certified diamond filtered by the 4Cs and setting compatibility → review
  with a live preview and live pricing.
- **Hybrid commerce** — `purchase.mode` drives Add-to-Bag vs Request-a-Quote
  per piece; a persistent cart drawer and a concierge enquiry flow.
- **Education, provenance, appointments & concierge** — the Diamond Guide, the
  Maison story, private appointment booking, and a floating concierge.

## Stack

- **Next.js 14 (App Router)** + TypeScript
- **TailwindCSS** — bespoke luxury design tokens (`tailwind.config.ts`)
- **Framer Motion** — elegant scroll reveals & transitions
- **Zustand** — cart + ring-builder state (persisted)
- **React Hook Form + Zod** — forms and shared validation
- **lucide-react** — icons

## Architecture

UI reads through a thin data seam in `src/lib/data.ts`, backed by JSON in
`src/data/*` (products, collections, diamonds, settings). Swap to a CMS later
without touching components.

```
src/
  app/            # routes (home, 5 sections, product, builder, bespoke, guide…)
  components/
    art/          # the procedural SVG jewellery engine
    home/         # the cinematic homepage sections
    product/      # cards, grid, category view, PDP, viewer
    builder/      # the design-your-own-ring experience
    layout/       # header (mega-menu), footer, concierge, announcement
    cart/  ui/  forms/  enquiry/
  config/site.ts  # brand, navigation, service pillars, press, testimonials
  data/*.json     # the catalogue
  lib/            # data access, pricing, validation, stores, utils
  types/          # the domain model
```

## Commands

```bash
npm run dev        # local dev at http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest (pricing, compatibility, validation, utils)
```

## Environment

Copy `.env.example` to `.env.local`. Form submissions log to the server console
unless `RESEND_API_KEY` is set, in which case they email the concierge inbox.

## Roadmap

- **Phase 2:** Stripe checkout + Klarna/Affirm, accounts & wishlists, a CMS
  (Sanity) behind the data seam, real photography alongside the SVG engine.
- **Phase 3:** AR virtual try-on, CRM-backed appointment calendar,
  internationalisation and multi-currency.
