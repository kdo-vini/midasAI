-- Migration: Add installment_group_id field to transactions table
-- This enables bulk deletion of installment purchases

-- Step 1: Add the new column
ALTER TABLE transactions 
ADD COLUMN installment_group_id uuid;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_installment_group 
ON transactions(installment_group_id);

-- Step 3: Migrate existing installment data
-- This identifies transactions with installment pattern "(X/Y)" in description
-- and assigns the same group_id to all installments of the same purchase

WITH installment_transactions AS (
  -- Identify transactions with installment pattern: "Description (X/Y)"
  SELECT 
    id,
    description,
    -- Extract base name (without the " (X/Y)" part)
    REGEXP_REPLACE(description, ' \(\d+/\d+\)$', '') as base_description,
    -- Extract total number of installments
    CAST(REGEXP_REPLACE(description, '^.* \(\d+/(\d+)\)$', '\1') AS INTEGER) as total_installments,
    user_id,
    date,
    amount,
    category
  FROM transactions
  WHERE description ~ ' \(\d+/\d+\)$'  -- Regex: ends with " (N/N)"
    AND installment_group_id IS NULL    -- Only migrate transactions not yet processed
),
group_keys AS (
  -- Get unique group keys (one per installment series)
  SELECT DISTINCT ON (user_id, base_description, amount, category)
    user_id,
    base_description,
    amount,
    category,
    gen_random_uuid() as group_id
  FROM installment_transactions
),
grouped_installments AS (
  -- Join to assign the same group_id to all installments in a series
  SELECT 
    it.*,
    gk.group_id
  FROM installment_transactions it
  JOIN group_keys gk 
    ON it.user_id = gk.user_id
    AND it.base_description = gk.base_description
    AND it.amount = gk.amount
    AND it.category = gk.category
)
-- Update transactions with the group_id
UPDATE transactions t
SET installment_group_id = g.group_id
FROM grouped_installments g
WHERE t.id = g.id;

-- Verification query (optional - run after migration to check results)
-- SELECT 
--   installment_group_id,
--   COUNT(*) as installment_count,
--   MIN(description) as sample_description,
--   amount,
--   category
-- FROM transactions 
-- WHERE installment_group_id IS NOT NULL
-- GROUP BY installment_group_id, amount, category
-- ORDER BY installment_count DESC;
