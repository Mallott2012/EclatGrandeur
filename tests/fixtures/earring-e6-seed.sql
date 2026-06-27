-- ============================================================================
-- Éclat Grandeur — Phase E6 Local QA Test Fixtures
-- ============================================================================
-- Purpose: Create safe, repeatable local test fixtures for Phase E6 QA.
-- Scope:   Local Supabase dev instance ONLY. Never run against production.
-- Remove:  Run earring-e6-teardown.sql to remove all fixtures.
-- ============================================================================
-- How to run:
--   supabase db reset && psql (local connection) -f tests/fixtures/earring-e6-seed.sql
--   OR paste into Supabase Studio > SQL Editor on your local project.
-- ============================================================================

-- ── Diamonds (10 test stones — paired below) ─────────────────────────────────
-- Note: cut_grade, polish, symmetry, fluorescence must meet Éclat standards.
-- Coloured pair members use eclat_approved=true instead of cut_grade.

INSERT INTO diamonds (
  id, sku, cut, carat, colour, clarity, cut_grade, polish, symmetry,
  fluorescence, eclat_approved, status, is_published, price_gbp, diamond_category
) VALUES
  -- Classic Studs pair A (2 × round 0.50ct D VS1)
  ('e6-d-01', 'E6-D-001', 'round', 0.50, 'D', 'VS1', 'excellent', 'excellent', 'excellent', 'none', false, 'available', true, 3500, 'white'),
  ('e6-d-02', 'E6-D-002', 'round', 0.50, 'D', 'VS1', 'excellent', 'excellent', 'excellent', 'none', false, 'available', true, 3500, 'white'),
  -- Classic Studs pair B (2 × round 0.75ct E VVS2)
  ('e6-d-03', 'E6-D-003', 'round', 0.75, 'E', 'VVS2', 'excellent', 'excellent', 'excellent', 'none', false, 'available', true, 6500, 'white'),
  ('e6-d-04', 'E6-D-004', 'round', 0.75, 'E', 'VVS2', 'excellent', 'excellent', 'excellent', 'none', false, 'available', true, 6500, 'white'),
  -- Halo Studs centre pair (2 × round 0.50ct F VS2)
  ('e6-d-05', 'E6-D-005', 'round', 0.50, 'F', 'VS2', 'excellent', 'excellent', 'excellent', 'none', false, 'available', true, 3200, 'white'),
  ('e6-d-06', 'E6-D-006', 'round', 0.50, 'F', 'VS2', 'excellent', 'excellent', 'excellent', 'none', false, 'available', true, 3200, 'white'),
  -- Drop Earrings top pairs (2 × oval 0.50ct D VS1)
  ('e6-d-07', 'E6-D-007', 'oval', 0.50, 'D', 'VS1', null, 'excellent', 'excellent', 'none', true, 'available', true, 2800, 'white'),
  ('e6-d-08', 'E6-D-008', 'oval', 0.50, 'D', 'VS1', null, 'excellent', 'excellent', 'none', true, 'available', true, 2800, 'white'),
  -- Drop Earrings drop pairs (2 × oval 1.00ct E VS2)
  ('e6-d-09', 'E6-D-009', 'oval', 1.00, 'E', 'VS2', null, 'excellent', 'excellent', 'none', true, 'available', true, 7500, 'white'),
  ('e6-d-10', 'E6-D-010', 'oval', 1.00, 'E', 'VS2', null, 'excellent', 'excellent', 'none', true, 'available', true, 7500, 'white')
ON CONFLICT (id) DO NOTHING;

-- ── Diamond Pairs ─────────────────────────────────────────────────────────────

INSERT INTO diamond_pairs (
  id, diamond_id_a, diamond_id_b, shape, diamond_category,
  colour, clarity, total_carat, carat_per_stone, pair_price_gbp,
  status, is_published
) VALUES
  -- Classic Studs — Pair A (round 0.50ct × 2)
  ('e6-p-01', 'e6-d-01', 'e6-d-02', 'round', 'white', 'D', 'VS1', 1.00, 0.50, 7000.00, 'available', true),
  -- Classic Studs — Pair B (round 0.75ct × 2)
  ('e6-p-02', 'e6-d-03', 'e6-d-04', 'round', 'white', 'E', 'VVS2', 1.50, 0.75, 13000.00, 'available', true),
  -- Halo Studs — Centre Pair (round 0.50ct × 2)
  ('e6-p-03', 'e6-d-05', 'e6-d-06', 'round', 'white', 'F', 'VS2', 1.00, 0.50, 6400.00, 'available', true),
  -- Drop Earrings — Top Pair (oval 0.50ct × 2)
  ('e6-p-04', 'e6-d-07', 'e6-d-08', 'oval', 'white', 'D', 'VS1', 1.00, 0.50, 5600.00, 'available', true),
  -- Drop Earrings — Drop Pair (oval 1.00ct × 2)
  ('e6-p-05', 'e6-d-09', 'e6-d-10', 'oval', 'white', 'E', 'VS2', 2.00, 1.00, 15000.00, 'available', true)
ON CONFLICT (id) DO NOTHING;

-- ── Earring Products (5 test products) ───────────────────────────────────────

INSERT INTO jewellery_products (
  id, slug, name, subtitle, description, category, earring_type,
  base_price_gbp, is_published, show_diamond, is_total_carat, is_pair
) VALUES
  -- 1. Classic Diamond Studs (configurable, 1 matched_pair slot)
  ('e6-prod-01', 'e6-classic-studs-qa', 'E6 Classic Diamond Studs',
   'Round Brilliant Solitaire', 'Test fixture — QA use only. Do not publish to production.',
   'earrings', 'classic_studs', 850.00, false, false, false, false),
  -- 2. Halo Diamond Studs (configurable, 1 matched_pair + 1 fixed slot)
  ('e6-prod-02', 'e6-halo-studs-qa', 'E6 Halo Diamond Studs',
   'Round Brilliant with Pavé Halo', 'Test fixture — QA use only. Do not publish to production.',
   'earrings', 'halo_studs', 1200.00, false, false, false, false),
  -- 3. Two-Slot Diamond Drop Earrings (configurable, 2 matched_pair slots)
  ('e6-prod-03', 'e6-drop-earrings-qa', 'E6 Diamond Drop Earrings',
   'Oval Brilliant Drop', 'Test fixture — QA use only. Do not publish to production.',
   'earrings', 'drop_earrings', 1500.00, false, false, false, false),
  -- 4. Pavé Hoop Earrings (fixed-only, no matched_pair slots)
  ('e6-prod-04', 'e6-pave-hoops-qa', 'E6 Pavé Hoop Earrings',
   'Micro Pavé Diamond Hoops', 'Test fixture — QA use only. Do not publish to production.',
   'earrings', 'pave_hoops', 2200.00, false, false, false, false),
  -- 5. Fixed-Composition Earrings (no stone slots at all)
  ('e6-prod-05', 'e6-fixed-comp-qa', 'E6 Fixed Composition Earrings',
   'Signature Cluster', 'Test fixture — QA use only. Do not publish to production.',
   'earrings', 'classic_studs', 1800.00, false, false, false, false)
ON CONFLICT (id) DO NOTHING;

-- ── Stone Slots ───────────────────────────────────────────────────────────────

INSERT INTO jewellery_stone_slots (
  id, jewellery_product_id, slot_key, label, display_order, role,
  selection_mode, required, quantity, compatible_shapes,
  min_carat, max_carat, allowed_diamond_categories, allowed_colour_families,
  price_mode
) VALUES
  -- Classic Studs: one matched_pair slot (round, 0.5–2.0ct)
  ('e6-slot-01', 'e6-prod-01', 'centre_pair', 'Diamond Pair', 0,
   'centre', 'matched_pair', true, 1,
   '{"round"}', 0.50, 2.00, '{"white"}', null, 'selected_inventory'),

  -- Halo Studs: one matched_pair + one fixed accent
  ('e6-slot-02', 'e6-prod-02', 'centre_pair', 'Centre Diamond Pair', 0,
   'centre', 'matched_pair', true, 1,
   '{"round"}', 0.40, 1.50, '{"white"}', null, 'selected_inventory'),
  ('e6-slot-03', 'e6-prod-02', 'halo_accent', 'Pavé Halo', 1,
   'accent', 'fixed', false, 1,
   '{}', null, null, '{"white"}', null, 'included_in_setting'),

  -- Drop Earrings: two matched_pair slots (oval, different carat ranges)
  ('e6-slot-04', 'e6-prod-03', 'top_pair', 'Top Diamond Pair', 0,
   'top', 'matched_pair', true, 1,
   '{"oval"}', 0.30, 1.00, '{"white"}', null, 'selected_inventory'),
  ('e6-slot-05', 'e6-prod-03', 'drop_pair', 'Drop Diamond Pair', 1,
   'drop', 'matched_pair', true, 1,
   '{"oval"}', 0.80, 3.00, '{"white"}', null, 'selected_inventory'),

  -- Pavé Hoops: one fixed accent slot only
  ('e6-slot-06', 'e6-prod-04', 'pave_accent', 'Micro Pavé Accent', 0,
   'accent', 'fixed', true, 1,
   '{}', null, null, '{"white"}', null, 'included_in_setting')
  -- Note: e6-prod-05 (Fixed Composition) intentionally has NO stone slots.
ON CONFLICT (id) DO NOTHING;

-- ── Verify fixture state ─────────────────────────────────────────────────────

SELECT 'Diamonds:' AS fixture_type, COUNT(*) AS count FROM diamonds WHERE id LIKE 'e6-%'
UNION ALL
SELECT 'Pairs:', COUNT(*) FROM diamond_pairs WHERE id LIKE 'e6-%'
UNION ALL
SELECT 'Products:', COUNT(*) FROM jewellery_products WHERE id LIKE 'e6-%'
UNION ALL
SELECT 'Slots:', COUNT(*) FROM jewellery_stone_slots WHERE id LIKE 'e6-%';
