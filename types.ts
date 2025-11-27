export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  date: string; // ISO string
  isRecurring?: boolean;
  recurringId?: string; // Links back to the rule
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

// AI Response Structure
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  date: string; // ISO string
  isRecurring?: boolean;
  recurringId?: string; // Links back to the rule
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