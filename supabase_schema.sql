-- Create Transactions Table
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount numeric not null,
  description text not null,
  category text not null,
  type text not null,
  date timestamp with time zone not null,
  is_recurring boolean default false,
  recurring_id uuid,
  created_at timestamp with time zone default now()
);

-- Create Recurring Transactions Table
create table recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount numeric not null,
  name text not null,
  category text not null,
  type text not null,
  day_of_month integer not null,
  created_at timestamp with time zone default now()
);

-- Create Budget Goals Table
create table budget_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category text not null,
  target_percentage numeric not null,
  created_at timestamp with time zone default now(),
  unique(user_id, category)
);

-- Enable Row Level Security (RLS)
alter table transactions enable row level security;
alter table recurring_transactions enable row level security;
alter table budget_goals enable row level security;

-- Create Policies (Allow users to see/edit ONLY their own data)
create policy "Users can view their own transactions" on transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own transactions" on transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own transactions" on transactions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own transactions" on transactions
  for delete using (auth.uid() = user_id);

-- Recurring Policies
create policy "Users can view their own recurring" on recurring_transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own recurring" on recurring_transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own recurring" on recurring_transactions
  for delete using (auth.uid() = user_id);

-- Budget Policies
create policy "Users can view their own budgets" on budget_goals
  for select using (auth.uid() = user_id);

create policy "Users can insert their own budgets" on budget_goals
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own budgets" on budget_goals
  for update using (auth.uid() = user_id);
