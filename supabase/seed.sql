-- Seed data for local testing
-- This creates predictable test data including test users

-- Create test users with known credentials
-- These users are created directly in auth schema
DO $$
DECLARE
  test_user_id UUID;
  test_subscription_id UUID;
  admin_user_id UUID;
  admin_subscription_id UUID;
BEGIN
  -- Test User 1: test@example.com
  test_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
  test_subscription_id := '00000000-0000-0000-0000-000000000101'::UUID;
  
  -- Insert into auth.users (bypassing normal signup flow for testing)
  -- This is the exact format from pg_dump of a working Supabase-created user
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', test_user_id, 'authenticated', 'authenticated', 'test@example.com', '$2a$10$1Y9FQ4kprqM0Crv6yfZWQeLPVQ6egLtzRmuzVOEHfrmcsDD4FG39O', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO NOTHING;

  -- Create subscription for test user (without default_store_id for now)
  INSERT INTO subscriptions (id, name, created_at, updated_at)
  VALUES (test_subscription_id, 'Test Subscription', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create user profile
  INSERT INTO users (id, email, full_name, subscription_id, created_at, updated_at)
  VALUES (test_user_id, 'test@example.com', 'Test User', test_subscription_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create identity for test user
  -- This is the exact format from pg_dump
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) VALUES (test_user_id::text, test_user_id, jsonb_build_object('sub', test_user_id::text, 'email', 'test@example.com', 'email_verified', false, 'phone_verified', false), 'email', NOW(), NOW(), NOW(), extensions.gen_random_uuid()) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Test User 2: test2@example.com
  -- Using exact format from pg_dump
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002'::UUID, 'authenticated', 'authenticated', 'test2@example.com', '$2a$10$1Y9FQ4kprqM0Crv6yfZWQeLPVQ6egLtzRmuzVOEHfrmcsDD4FG39O', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO NOTHING;

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

  -- Create identity for test user 2
  -- Using exact format from pg_dump
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'::UUID, '{"sub": "00000000-0000-0000-0000-000000000002", "email": "test2@example.com", "email_verified": false, "phone_verified": false}', 'email', NOW(), NOW(), NOW(), extensions.gen_random_uuid()) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Test Admin User: testadmin@example.com
  -- Created via Supabase Auth API and dumped from working instance
  admin_user_id := '2bee784a-cfe3-4405-90db-7d283d1fc753'::UUID;
  admin_subscription_id := 'cff7db68-5c6c-400e-8280-4926c036ae72'::UUID;
  
  -- Insert admin user into auth.users
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) 
  VALUES ('00000000-0000-0000-0000-000000000000', admin_user_id, 'authenticated', 'authenticated', 'testadmin@example.com', '$2a$10$PKmbAJuX7Hspe/qOgNTqteliBmTJKOBALBRGzv81sghEW1jvQnvDq', '2025-07-27 19:48:48.887553+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-07-27 19:48:48.902257+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "2bee784a-cfe3-4405-90db-7d283d1fc753", "email": "testadmin@example.com", "email_verified": true, "phone_verified": false}', NULL, '2025-07-27 19:48:48.870194+00', '2025-07-27 19:48:48.90788+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) 
  ON CONFLICT (id) DO NOTHING;

  -- Create subscription for admin user
  INSERT INTO subscriptions (id, name, created_at, updated_at)
  VALUES (admin_subscription_id, 'Test Admin Subscription', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create user profile for admin user with is_admin = true
  INSERT INTO users (id, email, full_name, subscription_id, is_admin, created_at, updated_at)
  VALUES (admin_user_id, 'testadmin@example.com', 'Test Admin User', admin_subscription_id, true, '2025-07-27 19:48:48.869651+00', '2025-07-27 19:48:55.530271+00')
  ON CONFLICT (id) DO NOTHING;

  -- Create identity for admin user
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) 
  VALUES ('2bee784a-cfe3-4405-90db-7d283d1fc753', admin_user_id, '{"sub": "2bee784a-cfe3-4405-90db-7d283d1fc753", "email": "testadmin@example.com", "email_verified": false, "phone_verified": false}', 'email', '2025-07-27 19:48:48.879549+00', '2025-07-27 19:48:48.879596+00', '2025-07-27 19:48:48.879596+00', 'e4075d50-cbc9-4c2d-914c-8bfe69b60f4c'::UUID) 
  ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Update the user to ensure is_admin is set to true (in case trigger overrides it)
  UPDATE users SET is_admin = true WHERE id = admin_user_id;
END $$;

-- Seed store chains
-- Store chains are created in the migration, not in seed
-- Using the Colruyt chain that was created

-- Seed stores
INSERT INTO stores (id, name, address, city, postal_code, store_chain_id, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000201'::UUID, 'Test Store 1', '123 Test St', 'Test City', '1000', (SELECT id FROM store_chains WHERE name = 'Colruyt' LIMIT 1), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000202'::UUID, 'Test Store 2', '456 Test Ave', 'Test City', '2000', (SELECT id FROM store_chains WHERE name = 'Colruyt' LIMIT 1), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update test subscription to have default store
UPDATE subscriptions 
SET default_store_id = '00000000-0000-0000-0000-000000000201'::UUID
WHERE id = '00000000-0000-0000-0000-000000000101'::UUID;

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
INSERT INTO recipes (id, title, time_estimation, cooking_instructions, image_url, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000501'::UUID, 'Test Recipe 1', 45, 'Test instructions 1', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000502'::UUID, 'Test Recipe 2', 30, 'Test instructions 2', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000503'::UUID, 'Recipe Without Image', 25, 'Test instructions 3', NULL, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000504'::UUID, 'Another Recipe With Image', 60, 'Test instructions 4', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed recipe ingredients
INSERT INTO recipe_ingredients (id, recipe_id, product_id, quantity, unit, ingredient_order, description, dutch_description) VALUES
  ('00000000-0000-0000-0000-000000000601'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, 300, 'g', 1, 'Test Chicken', 'Test Kip'),
  ('00000000-0000-0000-0000-000000000602'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, 2, 'st', 2, 'Test Bread', 'Test Brood'),
  ('00000000-0000-0000-0000-000000000603'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, 300, 'g', 1, 'Test Chicken', 'Test Kip'),
  ('00000000-0000-0000-0000-000000000604'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, '00000000-0000-0000-0000-000000000404'::UUID, 2, 'st', 2, 'Test Bread', 'Test Brood'),
  -- Add ingredients for Recipe Without Image
  ('00000000-0000-0000-0000-000000000605'::UUID, '00000000-0000-0000-0000-000000000503'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, 200, 'g', 1, 'Test Meat', 'Test Vlees'),
  ('00000000-0000-0000-0000-000000000606'::UUID, '00000000-0000-0000-0000-000000000503'::UUID, '00000000-0000-0000-0000-000000000405'::UUID, 1, 'kg', 2, 'Test Vegetables', 'Test Groenten'),
  -- Add ingredients for Another Recipe With Image
  ('00000000-0000-0000-0000-000000000607'::UUID, '00000000-0000-0000-0000-000000000504'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, 500, 'ml', 1, 'Test Milk', 'Test Melk'),
  ('00000000-0000-0000-0000-000000000608'::UUID, '00000000-0000-0000-0000-000000000504'::UUID, '00000000-0000-0000-0000-000000000404'::UUID, 3, 'st', 2, 'Test Eggs', 'Test Eieren')
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