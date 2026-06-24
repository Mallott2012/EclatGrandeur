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

## Phase 0 — Admin foundation (Supabase auth, roles & audit)

The staff console at **`/admin`** is the technical foundation for all future
internal modules (inventory, pricing, reservations, content). It ships **only**
authentication, staff roles, audit logging and a protected shell — no business
modules yet.

### What's included

- Supabase clients: browser (`src/lib/supabase/client.ts`), SSR server
  (`server.ts`), and a **server-only** service-role admin client (`admin.ts`).
- Cookie-based SSR auth with session refresh in `middleware.ts`.
- `/admin/login` + logout, and a protected `/admin` dashboard.
- `profiles`, `staff_roles` (enum: `super_admin`, `sales_adviser`,
  `diamond_buyer`, `content_editor`) and `audit_logs` tables, all with RLS.
- `requireStaffRole(allowedRoles)` server guard and a server-only
  `writeAuditLog(...)` helper.

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com). Note the
   **Project URL**, **anon key** and **service-role key**
   (Settings → API).
2. Run the migrations in order (SQL Editor, or `supabase db push` with the CLI):
   - `supabase/migrations/0001_profiles.sql`
   - `supabase/migrations/0002_staff_roles.sql`
   - `supabase/migrations/0003_audit_logs.sql`
3. Verify RLS is enabled on `profiles`, `staff_roles`, `audit_logs`
   (Table Editor shows a shield on each).

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon key (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Service role for audit writes — never expose to the browser |

### 3. Create & promote the first user

1. Supabase dashboard → **Authentication → Users → Add user**. Enter an email +
   password and tick **Auto Confirm User**. The `handle_new_user` trigger
   creates their `profiles` row automatically.
2. Open `supabase/seed/promote_super_admin.sql`, change `CHANGE_ME@example.com`
   to that user's email, and run it in the SQL Editor. This grants
   `super_admin`.
3. Add further staff by creating their user in Auth, then (as `super_admin`)
   inserting rows into `staff_roles` — a UI for this arrives in a later phase.

### 4. Local commands

```bash
npm install
cp .env.example .env.local   # then fill in Supabase values
npm run dev                  # http://localhost:3000/admin
npm run lint
npm run typecheck
npm run build
```

### 5. Test protected admin access

1. Visit `/admin` while signed out → redirected to `/admin/login`.
2. Sign in as a user with **no** staff role → rejected ("no staff access").
3. Sign in as the `super_admin` (or any staff role) → dashboard shows your
   name, email and role, with the sidebar and a working **Log out**.
4. Log out → returned to `/admin/login`; `/admin` is protected again.

### Security model

- Service-role key is confined to `import 'server-only'` modules; it never
  enters a browser bundle.
- Every table has RLS: users read only their own `profiles` row; only
  `super_admin` may read/manage `staff_roles`; `audit_logs` is server-only.
- The middleware gates authentication; `requireStaffRole(...)` independently
  enforces authorisation in server code — UI hiding is never the only gate.

### Vercel deployment notes

- Add the three Supabase env vars in **Project → Settings → Environment
  Variables**. Keep `SUPABASE_SERVICE_ROLE_KEY` un-prefixed so it stays
  server-side only.
- `middleware.ts` runs on the Edge runtime automatically; no extra config.
- No build-time secrets are required beyond the env vars above.

## Roadmap

- **Phase 1:** Internal modules (Diamonds, Ring Settings, Ready Rings,
  Enquiries, Reservations, Content, Team) attaching to the Phase 0 auth and
  permissions system via `requireStaffRole(...)`.
- **Phase 2:** Stripe checkout + Klarna/Affirm, accounts & wishlists, a CMS
  (Sanity) behind the data seam, real photography alongside the SVG engine.
- **Phase 3:** AR virtual try-on, CRM-backed appointment calendar,
  internationalisation and multi-currency.
