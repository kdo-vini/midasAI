-- Fix RLS Policy for Budget Goals
-- Run this in your Supabase SQL Editor

-- 1. Drop the incorrect policy if it exists (it was named "Users can insert/update their own budgets" but only covered INSERT)
drop policy if exists "Users can insert/update their own budgets" on budget_goals;

-- 2. Create explicit INSERT policy
create policy "Users can insert their own budgets" on budget_goals
  for insert with check (auth.uid() = user_id);

-- 3. Create explicit UPDATE policy (This was missing and causing the 403 error)
create policy "Users can update their own budgets" on budget_goals
  for update using (auth.uid() = user_id);
