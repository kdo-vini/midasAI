import React from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2 } from 'lucide-react';

interface TransactionCardProps {
    transaction: Transaction;
    onTogglePaid: (id: string) => void;
    onDelete: (id: string) => void;
    onCategoryChange?: (id: string, newCategory: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
    transaction,
    onTogglePaid,
    onDelete,
}) => {
    const isIncome = transaction.type === TransactionType.INCOME;
    const isPaid = transaction.isPaid ?? false;

    // Check if it's a fixed expense (only these should have payment tracking)
    const isFixedExpense = !isIncome && (transaction.transactionCategory === 'fixed' || (!transaction.transactionCategory && transaction.isRecurring));

    // Determinar cor de fundo baseado no status
    const getBackgroundColor = () => {
        if (isIncome) {
            // Natural color for income (no paid/unpaid state)
            return 'bg-white dark:bg-slate-800';
        }

        if (isFixedExpense) {
            // Pastel colors for fixed expenses based on payment status
            return isPaid ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/50 dark:bg-red-900/10';
        }

        // Default for variable expenses
        return 'bg-white dark:bg-slate-800';
    };

    const getBorderColor = () => {
        if (isIncome) {
            return 'border-slate-200 dark:border-slate-700';
        }

        if (isFixedExpense) {
            return isPaid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800';
        }

        // Default for variable expenses
        return 'border-slate-200 dark:border-slate-700';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'short'
        }).format(date);
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    };

    return (
        <div
            className={`${getBackgroundColor()} ${getBorderColor()} border rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox - Only for Fixed Expenses */}
                {isFixedExpense && (
                    <button
                        onClick={() => onTogglePaid(transaction.id)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isPaid
                            ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600'
                            : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                            }`}
                    >
                        {isPaid && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                )}

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <h3 className={`font-medium text-slate-800 dark:text-slate-200 ${isPaid && isFixedExpense ? 'line-through opacity-70' : ''}`}>
                                {transaction.description}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {transaction.category}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatDate(transaction.date)}
                                </span>
                            </div>
                        </div>

                        {/* Valor e ações */}
                        <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
                            </span>
                            <button
                                onClick={() => onDelete(transaction.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Deletar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Status badge - Only for Fixed Expenses */}
                    {isPaid && isFixedExpense && transaction.paidDate && (
                        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                            ✓ Pago em {formatDate(transaction.paidDate)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
