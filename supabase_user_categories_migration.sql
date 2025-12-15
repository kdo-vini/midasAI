-- Migration: Add user_categories table for custom category management
-- This enables users to customize their expense and income categories

-- Step 1: Create user_categories table
CREATE TABLE user_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  unique(user_id, name)
);

-- Step 2: Enable Row Level Security
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
CREATE POLICY "Users can view their own categories" ON user_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON user_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON user_categories
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete non-default categories
CREATE POLICY "Users can delete their own non-default categories" ON user_categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON user_categories(user_id);

-- Step 5: Populate default categories for existing users
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
) as all_users
ON CONFLICT (user_id, name) DO NOTHING;

-- Verification query (optional - run after migration to check results)
-- SELECT 
--   user_id,
--   COUNT(*) as category_count,
--   COUNT(CASE WHEN is_default THEN 1 END) as default_count,
--   COUNT(CASE WHEN NOT is_default THEN 1 END) as custom_count
-- FROM user_categories
-- GROUP BY user_id
-- ORDER BY user_id;
