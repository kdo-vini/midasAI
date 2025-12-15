export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export type TransactionCategory = 'income' | 'fixed' | 'variable' | 'savings';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  date: string; // ISO string
  isRecurring?: boolean;
  recurringId?: string; // Links back to the rule

  // Payment status fields
  isPaid?: boolean;
  transactionCategory?: TransactionCategory;
  dueDate?: string; // ISO string - quando deve ser pago
  paidDate?: string; // ISO string - quando foi marcado como pago

  // Installment grouping
  installmentGroupId?: string; // Groups installment transactions together
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: TransactionType;
  dayOfMonth: number;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  type: TransactionType;
}

export interface BudgetGoal {
  category: string;
  targetPercentage: number;
}

export interface UserCategory {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface UserProfile {
  userId: string;
  displayName: string | null;
}

// AI Response Structure
export interface AIParsedTransaction {
  isTransaction: boolean; // True if valid financial data, False if "I am 5 years old"
  amount?: number;
  description?: string;
  category?: string;
  type?: 'INCOME' | 'EXPENSE';
  date?: string;
  installments?: number; // Number of installments if applicable
  message?: string; // AI response for questions or confirmation
}