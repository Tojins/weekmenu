-- Remove pg_net extension that exists in local but not in production
-- This ensures test database matches production after reset
DROP EXTENSION IF EXISTS pg_net CASCADE;