-- Initialize started_at for existing records in processing states

-- For existing ONGOING records, we have two options:
-- 1. Leave started_at NULL (they won't be subject to timeout until re-processed)
-- 2. Set started_at to a recent time to give them a grace period

-- Option 1: Leave existing ONGOING records without started_at
-- This means they won't be subject to timeout reversion until they're processed again
-- (The trigger will set started_at when status changes from INITIAL to ONGOING)

-- Option 2: Set started_at to 5 minutes ago for existing ONGOING records
-- This gives them a 5-minute grace period before timeout reversion kicks in
-- Uncomment below if you prefer this approach:
/*
UPDATE recipe_search_history 
SET started_at = NOW() - INTERVAL '5 minutes'
WHERE status = 'ONGOING' 
AND started_at IS NULL;

UPDATE recipe_url_candidates 
SET started_at = NOW() - INTERVAL '5 minutes'
WHERE status IN ('INVESTIGATING', 'CREATING') 
AND started_at IS NULL;
*/

-- For now, we'll go with Option 1 - leaving existing records alone
-- This is the safest approach as it won't accidentally revert any legitimate work