-- ============================================================================
-- Éclat Grandeur — Phase E6 QA Fixture Teardown
-- ============================================================================
-- Removes all E6 test fixtures inserted by earring-e6-seed.sql.
-- All E6 fixture IDs use the 'e6-' prefix — safe to run against local dev only.
-- ============================================================================

-- Remove slots first (FK references products)
DELETE FROM jewellery_stone_slots WHERE id LIKE 'e6-%';

-- Remove products
DELETE FROM jewellery_products WHERE id LIKE 'e6-%';

-- Remove pairs (FK references diamonds)
DELETE FROM diamond_pairs WHERE id LIKE 'e6-%';

-- Remove diamonds
DELETE FROM diamonds WHERE id LIKE 'e6-%';

-- Verify cleanup
SELECT 'Remaining e6- rows:' AS check_label, COUNT(*) AS count
FROM (
  SELECT id FROM diamonds WHERE id LIKE 'e6-%'
  UNION ALL
  SELECT id FROM diamond_pairs WHERE id LIKE 'e6-%'
  UNION ALL
  SELECT id FROM jewellery_products WHERE id LIKE 'e6-%'
  UNION ALL
  SELECT id FROM jewellery_stone_slots WHERE id LIKE 'e6-%'
) t;
-- Expected: 0
