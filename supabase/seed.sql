-- Seed data for local testing
-- This creates predictable test data including test users

-- Create test users with known credentials
-- These users are created directly in auth schema
DO $$
DECLARE
  test_user_id UUID;
  test_subscription_id UUID;
BEGIN
  -- Test User 1: test@example.com
  test_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
  test_subscription_id := '00000000-0000-0000-0000-000000000101'::UUID;
  
  -- Insert into auth.users (bypassing normal signup flow for testing)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    test_user_id,
    'test@example.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test User"}',
    false,
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create subscription for test user
  INSERT INTO subscriptions (id, name, created_at, updated_at)
  VALUES (test_subscription_id, 'Test Subscription', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create user profile
  INSERT INTO users (id, email, name, subscription_id, created_at, updated_at)
  VALUES (test_user_id, 'test@example.com', 'Test User', test_subscription_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Test User 2: test2@example.com
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'test2@example.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test User 2"}',
    false,
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create subscription for test user 2
  INSERT INTO subscriptions (id, name, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000102'::UUID, 'Test Subscription 2', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create user profile for test user 2
  INSERT INTO users (id, email, name, subscription_id, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'test2@example.com',
    'Test User 2',
    '00000000-0000-0000-0000-000000000102'::UUID,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
END $$;

-- Seed store chains
INSERT INTO store_chains (id, name, logo_url) VALUES
  ('chain-001', 'Test Chain 1', 'https://example.com/logo1.png'),
  ('chain-002', 'Test Chain 2', 'https://example.com/logo2.png')
ON CONFLICT (id) DO NOTHING;

-- Seed stores
INSERT INTO stores (id, name, address, chain_id, created_at, updated_at) VALUES
  ('store-001', 'Test Store 1', '123 Test St', 'chain-001', NOW(), NOW()),
  ('store-002', 'Test Store 2', '456 Test Ave', 'chain-002', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed store categories
INSERT INTO store_categories (id, category_name, created_at, updated_at) VALUES
  ('cat-001', 'Fruits & Vegetables', NOW(), NOW()),
  ('cat-002', 'Dairy', NOW(), NOW()),
  ('cat-003', 'Meat & Fish', NOW(), NOW()),
  ('cat-004', 'Bakery', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed store ordering
INSERT INTO store_ordering (id, store_id, store_category_id, display_order) VALUES
  ('order-001', 'store-001', 'cat-001', 1),
  ('order-002', 'store-001', 'cat-002', 2),
  ('order-003', 'store-001', 'cat-003', 3),
  ('order-004', 'store-001', 'cat-004', 4)
ON CONFLICT (id) DO NOTHING;

-- Seed products
INSERT INTO products (id, name, quantity, unit, unit_price, image_url, promotion, store_category_id, isweightarticle) VALUES
  ('prod-001', 'Test Apple', 1, 'kg', 2.50, 'https://example.com/apple.jpg', false, 'cat-001', true),
  ('prod-002', 'Test Milk', 1, 'L', 1.20, 'https://example.com/milk.jpg', false, 'cat-002', false),
  ('prod-003', 'Test Chicken', 500, 'g', 5.99, 'https://example.com/chicken.jpg', false, 'cat-003', true),
  ('prod-004', 'Test Bread', 1, 'st', 2.00, 'https://example.com/bread.jpg', false, 'cat-004', false),
  ('prod-005', 'Test Banana', 1, 'kg', 1.80, 'https://example.com/banana.jpg', true, 'cat-001', true)
ON CONFLICT (id) DO NOTHING;

-- Seed recipes for test user 1
INSERT INTO recipes (id, name, servings, prep_time, cook_time, instructions, notes, subscription_id, created_at, updated_at) VALUES
  ('recipe-001', 'Test Recipe 1', 4, 15, 30, 'Test instructions 1', 'Test notes 1', '00000000-0000-0000-0000-000000000101'::UUID, NOW(), NOW()),
  ('recipe-002', 'Test Recipe 2', 2, 10, 20, 'Test instructions 2', 'Test notes 2', '00000000-0000-0000-0000-000000000101'::UUID, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed recipe ingredients
INSERT INTO recipe_ingredients (id, recipe_id, product_id, quantity, unit, notes, ingredient_order) VALUES
  ('ring-001', 'recipe-001', 'prod-001', 2, 'st', 'Sliced', 1),
  ('ring-002', 'recipe-001', 'prod-002', 500, 'ml', NULL, 2),
  ('ring-003', 'recipe-002', 'prod-003', 300, 'g', 'Diced', 1),
  ('ring-004', 'recipe-002', 'prod-004', 2, 'st', NULL, 2)
ON CONFLICT (id) DO NOTHING;

-- Seed shopping lists for test user 1
INSERT INTO shopping_lists (id, name, subscription_id, store_id, is_active, created_at, updated_at) VALUES
  ('list-001', 'Test Shopping List 1', '00000000-0000-0000-0000-000000000101'::UUID, 'store-001', true, NOW(), NOW()),
  ('list-002', 'Test Shopping List 2', '00000000-0000-0000-0000-000000000101'::UUID, 'store-002', false, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Seed shopping list items
INSERT INTO shopping_list_items (id, shopping_list_id, product_id, recipe_id, quantity, unit, is_checked, display_order) VALUES
  ('item-001', 'list-001', 'prod-001', 'recipe-001', 2, 'st', false, 1),
  ('item-002', 'list-001', 'prod-002', 'recipe-001', 500, 'ml', false, 2),
  ('item-003', 'list-001', 'prod-005', NULL, 3, 'kg', false, 1),
  ('item-004', 'list-001', NULL, NULL, 1, 'st', true, 999) -- Custom item
ON CONFLICT (id) DO NOTHING;

-- Update custom item name
UPDATE shopping_list_items SET custom_name = 'Custom Test Item' WHERE id = 'item-004';

-- Grant permissions for test data (if needed)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated;