-- UPDATE ONLY: Remove old default categories and add new simplified ones
-- Run this if you already have the user_categories table created

-- Step 1: Delete old default categories that are not in the new list
DELETE FROM user_categories 
WHERE is_default = true 
AND name NOT IN ('Alimentação', 'Economias', 'Lazer', 'Moradia', 'Transporte');

-- Step 2: Add the new 5 default categories for all users (if they don't exist)
INSERT INTO user_categories (user_id, name, is_default)
SELECT DISTINCT 
  user_id,
  unnest(ARRAY[
    'Alimentação',
    'Economias', 
    'Lazer',
    'Moradia',
    'Transporte'
  ]) as name,
  true as is_default
FROM (
  SELECT DISTINCT user_id FROM transactions
  UNION
  SELECT DISTINCT user_id FROM recurring_transactions
  UNION
  SELECT DISTINCT user_id FROM budget_goals
  UNION
  SELECT DISTINCT user_id FROM user_categories
) as all_users
ON CONFLICT (user_id, name) DO NOTHING;

-- Verification: Check categories per user
-- SELECT user_id, name, is_default 
-- FROM user_categories 
-- WHERE is_default = true
-- ORDER BY user_id, name;
