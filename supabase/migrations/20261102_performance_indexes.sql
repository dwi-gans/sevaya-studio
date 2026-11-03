-- Performance optimization indexes for SEVAYA e-commerce
-- Frequently filtered, sorted, and joined columns

-- 1. Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (LOWER(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_biteship_order_id ON orders (biteship_order_id) WHERE biteship_order_id IS NOT NULL;

-- 2. Addresses table indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_default ON addresses (user_id, is_default);

-- 3. Articles table indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles (published, date DESC);
