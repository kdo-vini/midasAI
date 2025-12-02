-- Run this script in the Supabase SQL Editor

-- Add new columns for payment tracking and categorization
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transaction_category TEXT, -- 'income', 'fixed', 'variable'
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_date TIMESTAMPTZ;

-- Add index for performance on filtering by category
CREATE INDEX IF NOT EXISTS idx_transactions_category_type ON transactions(transaction_category);
CREATE INDEX IF NOT EXISTS idx_transactions_is_paid ON transactions(is_paid);

-- Comment on columns
COMMENT ON COLUMN transactions.is_paid IS 'Status of payment: true if paid, false if pending';
COMMENT ON COLUMN transactions.transaction_category IS 'Broad category: income, fixed, or variable';
COMMENT ON COLUMN transactions.due_date IS 'When the payment is due';
COMMENT ON COLUMN transactions.paid_date IS 'When the payment was actually made';
