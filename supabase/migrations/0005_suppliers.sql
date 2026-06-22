-- Phase 1A: suppliers table.
-- No hard delete permitted. Use is_active = false for deactivation.
-- Server layer must prevent deactivation while active diamonds (available,
-- on_hold, reserved) reference this supplier.
-- diamonds.supplier_id ON DELETE RESTRICT means a supplier record cannot be
-- hard-deleted while any diamond row references it.

CREATE TABLE IF NOT EXISTS public.suppliers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  -- Short code used for CSV import supplier matching (e.g. 'RAPNET', 'IDEX').
  code          text        NOT NULL,
  contact_name  text,
  email         text,
  phone         text,
  country       text,
  -- Primary invoicing currency for this supplier.
  currency      text        NOT NULL DEFAULT 'USD',
  notes         text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT suppliers_code_unique UNIQUE (code),
  CONSTRAINT chk_supplier_currency CHECK (currency ~ '^[A-Z]{3}$')
);

-- Reuses set_updated_at() created in migration 0001.
CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS enabled; zero policies.
-- All access via server-only repository functions using the service-role client.
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
