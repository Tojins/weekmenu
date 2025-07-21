-- Allow all users to read products (they're public data)
CREATE POLICY "products_read_policy" ON products
  FOR SELECT 
  TO anon, authenticated
  USING (true);