import { createClient } from '@supabase/supabase-js';
import { Transaction, RecurringTransaction, BudgetGoal } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Helper Functions ---

export const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) throw error;

    // Map snake_case DB columns to camelCase app properties
    return data.map((t: any) => ({
        id: t.id,
        amount: t.amount,
        description: t.description,
        category: t.category,
        type: t.type,
        date: t.date,
        isRecurring: t.is_recurring,
        recurringId: t.recurring_id,
        isPaid: t.is_paid,
        transactionCategory: t.transaction_category,
        dueDate: t.due_date,
        paidDate: t.paid_date
    })) as Transaction[];
};

export const saveTransaction = async (transaction: Transaction, userId: string) => {
    const { error } = await supabase
        .from('transactions')
        .insert([{
            id: transaction.id,
            amount: transaction.amount,
            description: transaction.description,
            category: transaction.category,
            type: transaction.type,
            date: transaction.date,
            is_recurring: transaction.isRecurring,
            recurring_id: transaction.recurringId,
            is_paid: transaction.isPaid ?? false,
            transaction_category: transaction.transactionCategory,
            due_date: transaction.dueDate,
            paid_date: transaction.paidDate,
            user_id: userId
        }]);

    if (error) throw error;
};

export const updateTransaction = async (transaction: Transaction, userId: string) => {
    const { error } = await supabase
        .from('transactions')
        .update({
            amount: transaction.amount,
            description: transaction.description,
            category: transaction.category,
            type: transaction.type,
            date: transaction.date,
            is_recurring: transaction.isRecurring,
            recurring_id: transaction.recurringId,
            is_paid: transaction.isPaid ?? false,
            transaction_category: transaction.transactionCategory,
            due_date: transaction.dueDate,
            paid_date: transaction.paidDate
        })
        .eq('id', transaction.id)
        .eq('user_id', userId);

    if (error) throw error;
};

export const deleteTransaction = async (id: string) => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const updateTransactionCategory = async (id: string, category: string) => {
    const { error } = await supabase
        .from('transactions')
        .update({ category })
        .eq('id', id);

    if (error) throw error;
};

export const fetchRecurring = async (userId: string) => {
    const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;

    // Map snake_case DB columns to camelCase app properties
    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        category: item.category,
        type: item.type,
        dayOfMonth: item.day_of_month
    })) as RecurringTransaction[];
};

export const saveRecurring = async (item: RecurringTransaction, userId: string) => {
    const { error } = await supabase
        .from('recurring_transactions')
        .insert([{
            id: item.id,
            name: item.name,
            amount: item.amount,
            category: item.category,
            type: item.type,
            day_of_month: item.dayOfMonth,
            user_id: userId
        }]);

    if (error) throw error;
};

export const deleteRecurring = async (id: string) => {
    const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const deleteTransactionsByRecurringId = async (recurringId: string) => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('recurring_id', recurringId);

    if (error) throw error;
};

export const fetchBudgets = async (userId: string) => {
    const { data, error } = await supabase
        .from('budget_goals')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;

    // Map snake_case DB columns to camelCase app properties
    return data.map((b: any) => ({
        category: b.category,
        targetPercentage: b.target_percentage
    })) as BudgetGoal[];
};

export const saveBudget = async (budget: BudgetGoal, userId: string) => {
    // Upsert based on category + user_id
    const { error } = await supabase
        .from('budget_goals')
        .upsert([{
            category: budget.category,
            target_percentage: budget.targetPercentage,
            user_id: userId
        }], { onConflict: 'user_id, category' });

    if (error) throw error;
};
