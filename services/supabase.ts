import { createClient } from '@supabase/supabase-js';
import { Transaction, RecurringTransaction, BudgetGoal, UserCategory, UserProfile } from '../types';

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
        paidDate: t.paid_date,
        installmentGroupId: t.installment_group_id
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
            installment_group_id: transaction.installmentGroupId,
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
            paid_date: transaction.paidDate,
            installment_group_id: transaction.installmentGroupId
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

export const updateTransactionsCategory = async (oldCategory: string, newCategory: string, userId: string) => {
    const { error } = await supabase
        .from('transactions')
        .update({ category: newCategory })
        .match({ category: oldCategory, user_id: userId });

    if (error) throw error;
};

export const deleteTransactionsByCategory = async (category: string, userId: string) => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .match({ category, user_id: userId });

    if (error) throw error;
};

export const updateBudgetCategory = async (oldCategory: string, newCategory: string, userId: string) => {
    // Check if newCategory already has a budget
    const { data } = await supabase
        .from('budget_goals')
        .select('*')
        .match({ category: newCategory, user_id: userId })
        .single();

    if (data) {
        // If the destination already has a budget, delete the old budget to avoid duplicates
        const { error } = await supabase
            .from('budget_goals')
            .delete()
            .match({ category: oldCategory, user_id: userId });
        if (error) throw error;
    } else {
        // Otherwise, rename it
        const { error } = await supabase
            .from('budget_goals')
            .update({ category: newCategory })
            .match({ category: oldCategory, user_id: userId });
        if (error) throw error;
    }
};

export const deleteBudgetByCategory = async (category: string, userId: string) => {
    const { error } = await supabase
        .from('budget_goals')
        .delete()
        .match({ category, user_id: userId });

    if (error) throw error;
};

export const deleteTransactionsByRecurringId = async (recurringId: string) => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('recurring_id', recurringId);

    if (error) throw error;
};

export const deleteTransactionsByInstallmentGroupId = async (groupId: string) => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('installment_group_id', groupId);

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

// --- User Categories Functions ---

export const fetchUserCategories = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

    if (error) throw error;

    return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        isDefault: c.is_default,
        type: c.type
    })) as UserCategory[];
};

export const saveUserCategory = async (name: string, type: 'INCOME' | 'EXPENSE', userId: string) => {
    const { error } = await supabase
        .from('user_categories')
        .insert([{ name, type, user_id: userId, is_default: false }]);

    if (error) throw error;
};

export const updateUserCategory = async (id: string, name: string, userId: string) => {
    const { error } = await supabase
        .from('user_categories')
        .update({ name })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
};

export const deleteUserCategory = async (id: string) => {
    const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- User Profile Functions ---

export const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    if (!data) return null;

    return {
        userId: data.user_id,
        displayName: data.display_name,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        subscriptionStatus: data.subscription_status,
        trialEndDate: data.trial_end_date,
        hasSeenOnboarding: data.has_seen_onboarding
    } as UserProfile;
};

export const saveUserProfile = async (profile: UserProfile) => {
    const { error } = await supabase
        .from('user_profiles')
        .upsert([{
            user_id: profile.userId,
            display_name: profile.displayName,
            has_seen_onboarding: profile.hasSeenOnboarding
        }], { onConflict: 'user_id' });

    if (error) throw error;
};

export const markOnboardingSeen = async (userId: string) => {
    const { error } = await supabase
        .from('user_profiles')
        .update({ has_seen_onboarding: true })
        .eq('user_id', userId);

    if (error) throw error;
};

// --- Statement Reports Functions ---

export interface StatementReport {
    id: string;
    file_name: string;
    period_start: string;
    period_end: string;
    total_income: number;
    total_expense: number;
    categories: Record<string, number>;
    transactions: any[];
    banks: string[];
    ai_advice: string;
    created_at: string;
}

export interface UserUsage {
    reports_this_month: number;
    last_reset_month: number;
}

export const fetchStatementReports = async (userId: string): Promise<StatementReport[]> => {
    const { data, error } = await supabase
        .from('statement_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) throw error;
    return data || [];
};

export const fetchUserUsage = async (userId: string): Promise<UserUsage> => {
    const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));

    const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Reset count if new month
    if (!data || data.last_reset_month !== currentMonth) {
        return { reports_this_month: 0, last_reset_month: currentMonth };
    }

    return {
        reports_this_month: data.reports_this_month || 0,
        last_reset_month: data.last_reset_month
    };
};

export const parseStatementWithAI = async (transactions: any[], userId: string): Promise<StatementReport> => {
    const { data, error } = await supabase.functions.invoke('parse-statement', {
        body: { transactions, userId }
    });

    if (error) throw error;
    return data;
};
