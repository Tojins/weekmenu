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
  INSERT INTO users (id, email, full_name, subscription_id, created_at, updated_at)
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
  INSERT INTO users (id, email, full_name, subscription_id, created_at, updated_at)
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
-- Store chains are created in the migration, not in seed
-- Using the Colruyt chain that was created

-- Seed stores
INSERT INTO stores (id, name, address, city, postal_code, store_chain_id, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000201'::UUID, 'Test Store 1', '123 Test St', 'Test City', '1000', (SELECT id FROM store_chains WHERE name = 'Colruyt' LIMIT 1), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000202'::UUID, 'Test Store 2', '456 Test Ave', 'Test City', '2000', (SELECT id FROM store_chains WHERE name = 'Colruyt' LIMIT 1), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed store categories
INSERT INTO store_categories (id, store_chain_id, category_name, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000301'::UUID, (SELECT id FROM store_chains LIMIT 1), 'Fruits & Vegetables', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000302'::UUID, (SELECT id FROM store_chains LIMIT 1), 'Dairy', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000303'::UUID, (SELECT id FROM store_chains LIMIT 1), 'Meat & Fish', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000304'::UUID, (SELECT id FROM store_chains LIMIT 1), 'Bakery', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed store ordering
INSERT INTO store_ordering (store_id, store_category_id, display_order) VALUES
  ('00000000-0000-0000-0000-000000000201'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, 1),
  ('00000000-0000-0000-0000-000000000201'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, 2),
  ('00000000-0000-0000-0000-000000000201'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, 3),
  ('00000000-0000-0000-0000-000000000201'::UUID, '00000000-0000-0000-0000-000000000304'::UUID, 4)
ON CONFLICT (store_id, store_category_id) DO NOTHING;

-- Seed products
INSERT INTO products (id, name, quantity, unit, unit_price, image_url, store_category_id, isweightarticle) VALUES
  ('00000000-0000-0000-0000-000000000401'::UUID, 'Test Apple', 1, 'kg', 2.50, 'https://example.com/apple.jpg', '00000000-0000-0000-0000-000000000301'::UUID, true),
  ('00000000-0000-0000-0000-000000000402'::UUID, 'Test Milk', 1, 'L', 1.20, 'https://example.com/milk.jpg', '00000000-0000-0000-0000-000000000302'::UUID, false),
  ('00000000-0000-0000-0000-000000000403'::UUID, 'Test Chicken', 500, 'g', 5.99, 'https://example.com/chicken.jpg', '00000000-0000-0000-0000-000000000303'::UUID, true),
  ('00000000-0000-0000-0000-000000000404'::UUID, 'Test Bread', 1, 'st', 2.00, 'https://example.com/bread.jpg', '00000000-0000-0000-0000-000000000304'::UUID, false),
  ('00000000-0000-0000-0000-000000000405'::UUID, 'Test Banana', 1, 'kg', 1.80, 'https://example.com/banana.jpg', '00000000-0000-0000-0000-000000000301'::UUID, true)
ON CONFLICT (id) DO NOTHING;

-- Seed recipes for test user 1
INSERT INTO recipes (id, title, time_estimation, cooking_instructions, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000501'::UUID, 'Test Recipe 1', 45, 'Test instructions 1', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000502'::UUID, 'Test Recipe 2', 30, 'Test instructions 2', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed recipe ingredients
INSERT INTO recipe_ingredients (id, recipe_id, product_id, quantity, unit, ingredient_order) VALUES
  ('00000000-0000-0000-0000-000000000601'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, 2, 'st', 1),
  ('00000000-0000-0000-0000-000000000602'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, 500, 'ml', 2),
  ('00000000-0000-0000-0000-000000000603'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, 300, 'g', 1),
  ('00000000-0000-0000-0000-000000000604'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, '00000000-0000-0000-0000-000000000404'::UUID, 2, 'st', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed shopping lists for test user 1
INSERT INTO shopping_lists (id, subscription_id, store_id, is_active, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000701'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000702'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, false, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Seed shopping list items
INSERT INTO shopping_list_items (id, shopping_list_id, product_id, recipe_id, quantity, unit, is_checked, display_order, custom_name) VALUES
  ('00000000-0000-0000-0000-000000000801'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, 2, 'st', false, 1, NULL),
  ('00000000-0000-0000-0000-000000000802'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, 500, 'ml', false, 2, NULL),
  ('00000000-0000-0000-0000-000000000803'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '00000000-0000-0000-0000-000000000405'::UUID, NULL, 3, 'kg', false, 1, NULL),
  ('00000000-0000-0000-0000-000000000804'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, NULL, NULL, 1, 'st', true, 999, 'Custom Test Item') -- Custom item
ON CONFLICT (id) DO NOTHING;

-- Grant permissions for test data (if needed)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated;