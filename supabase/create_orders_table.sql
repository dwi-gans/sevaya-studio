-- ============================================================
-- SEVAYA Orders Table — Run this in Supabase SQL Editor
-- supabase.com/dashboard → SQL Editor → New Query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
  -- Primary Key
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Order Info
  order_number        TEXT NOT NULL UNIQUE,

  -- Customer Info
  customer_name       TEXT,
  customer_email      TEXT,
  customer_phone      TEXT,
  customer_address    TEXT,

  -- Destination (Biteship)
  destination_area    TEXT,
  destination_area_id TEXT,

  -- Items (JSON array of cart items)
  items               JSONB DEFAULT '[]',

  -- Pricing
  subtotal            NUMERIC(12,2) DEFAULT 0,
  discount            NUMERIC(12,2) DEFAULT 0,
  shipping_cost       NUMERIC(12,2) DEFAULT 0,
  gift_fee            NUMERIC(12,2) DEFAULT 0,
  grand_total         NUMERIC(12,2) DEFAULT 0,

  -- Payment
  payment_method      TEXT,

  -- Courier / Shipping
  courier_name        TEXT,
  courier_service     TEXT,
  courier_duration    TEXT,
  tracking_number     TEXT,

  -- Biteship Integration
  biteship_order_id   TEXT,
  biteship_status     TEXT,

  -- Internal Status
  status              TEXT NOT NULL DEFAULT 'pending_payment',

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_status       ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_biteship_id  ON public.orders (biteship_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- Allow service role full access (used by API routes)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Done!
SELECT 'Table orders berhasil dibuat!' AS result;
