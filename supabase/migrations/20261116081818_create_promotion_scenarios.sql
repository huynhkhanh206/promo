/*
# Bảng scenarios - lưu kịch bản phân tích ROI khuyến mãi

1. New Tables
- `scenarios`
  - `id` (uuid, PK)
  - `name` (text, tên kịch bản)
  - `type` (text: 'discount' | 'combo')
  - `original_price` (numeric, giá bán gốc/sản phẩm)
  - `cost_per_unit` (numeric, giá vốn/sản phẩm)
  - `baseline_quantity` (numeric, số lượng bán dự kiến KHÔNG khuyến mãi)
  - `promo_quantity` (numeric, số lượng bán dự kiến TRONG khuyến mãi)
  - `incremental_investment` (numeric, chi phí đầu tư tăng thêm, KHÔNG gồm giảm giá)
  - `discount_mode` (text, nullable: 'percentage' | 'fixed')
  - `discount_value` (numeric, nullable)
  - `items_per_combo` (numeric, nullable: số sản phẩm/combo)
  - `combo_price` (numeric, nullable: giá combo)
  - `single_item_price` (numeric, nullable: giá sản phẩm lẻ)
  - `result` (jsonb, kết quả tính toán snapshot)
  - `created_at` (timestamptz)

2. Security
- Bật RLS trên `scenarios`.
- Đây là ứng dụng không có đăng nhập (single-tenant), dùng `TO anon, authenticated`
  để anon-key client có thể đọc/ghi dữ liệu.
- Cấp CRUD cho anon + authenticated.
*/
CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('discount','combo')),
  original_price numeric NOT NULL DEFAULT 0,
  cost_per_unit numeric NOT NULL DEFAULT 0,
  baseline_quantity numeric NOT NULL DEFAULT 0,
  promo_quantity numeric NOT NULL DEFAULT 0,
  incremental_investment numeric NOT NULL DEFAULT 0,
  discount_mode text,
  discount_value numeric,
  items_per_combo numeric,
  combo_price numeric,
  single_item_price numeric,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON scenarios TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_scenarios" ON scenarios;
CREATE POLICY "anon_select_scenarios" ON scenarios FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scenarios" ON scenarios;
CREATE POLICY "anon_insert_scenarios" ON scenarios FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scenarios" ON scenarios;
CREATE POLICY "anon_update_scenarios" ON scenarios FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scenarios" ON scenarios;
CREATE POLICY "anon_delete_scenarios" ON scenarios FOR DELETE
  TO anon, authenticated USING (true);
