import React, { useState } from 'react';
import { Target, Edit2, Check, PieChart, TrendingDown, Wallet } from 'lucide-react';
import { MonthlyStats, CategoryStat, TransactionType, BudgetGoal } from '../types';

interface StatsCardsProps {
    stats: MonthlyStats;
    categoryStats: CategoryStat[];
    budgetGoals: BudgetGoal[];
    userCategories: string[];
    onUpdateBudget: (category: string, percentage: number) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, categoryStats, budgetGoals, userCategories, onUpdateBudget }) => {
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [tempPercent, setTempPercent] = useState<string>('');

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val);

    // Filter expense categories with actual spending
    const expenseCategories = categoryStats
        .filter(c => c.type === TransactionType.EXPENSE && c.amount > 0)
        .sort((a, b) => b.amount - a.amount);

    // Budget report - combines all valid expense categories
    const allCategories = Array.from(new Set([
        ...userCategories,
        ...budgetGoals.map(g => g.category),
        ...categoryStats.filter(c => c.type === TransactionType.EXPENSE).map(c => c.category)
    ])).filter(c => !c.toLowerCase().includes('receita') && !c.toLowerCase().includes('salário') && !c.toLowerCase().includes('salario'));

    const budgetReport = allCategories.map(category => {
        const goal = budgetGoals.find(g => g.category === category) || { targetPercentage: 0 };
        const actual = categoryStats.find(c => c.category === category)?.amount || 0;
        const budgetAmount = (stats.totalIncome * goal.targetPercentage) / 100;
        const remaining = budgetAmount - actual;
        const usagePercent = budgetAmount > 0 ? (actual / budgetAmount) * 100 : (actual > 0 ? 100 : 0);

        return {
            category: category,
            targetPercent: goal.targetPercentage,
            budgetAmount,
            actualAmount: actual,
            remaining,
            usagePercent
        };
    }).sort((a, b) => {
        if (b.targetPercent !== a.targetPercent) return b.targetPercent - a.targetPercent;
        return b.actualAmount - a.actualAmount;
    });

    const startEdit = (cat: string, current: number) => {
        setEditingCategory(cat);
        setTempPercent(current.toString());
    };

    const saveEdit = (cat: string) => {
        const val = parseFloat(tempPercent);
        if (!isNaN(val) && val >= 0 && val <= 100) {
            onUpdateBudget(cat, val);
        }
        setEditingCategory(null);
    };

    if (categoryStats.length === 0 && stats.totalIncome === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Relatório Mensal</h3>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-5 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">Total Gastos</span>
                    </div>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100">{formatCurrency(stats.totalExpense)}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Economia</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
                            {stats.totalIncome > 0 ? Math.round((stats.balance / stats.totalIncome * 100)) : 0}%
                        </p>
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(stats.balance)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expense Distribution */}
            {expenseCategories.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                        Distribuição de Gastos
                    </h4>
                    <div className="space-y-4">
                        {expenseCategories.map((cat) => (
                            <div key={cat.category}>
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cat.category}</span>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(cat.amount)}</span>
                                        <span className="text-base font-bold text-slate-900 dark:text-slate-100">{Math.round(cat.percentage)}%</span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-700"
                                        style={{ width: `${cat.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Budget vs Actual Cards */}
            {budgetReport.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-5">
                        <Target className="w-4 h-4 text-orange-500" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Metas de Orçamento
                        </h4>
                    </div>

                    <div className="space-y-4">
                        {budgetReport.map((row) => (
                            <div key={row.category} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                                {/* Category name and status */}
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-semibold text-slate-900 dark:text-slate-100">{row.category}</h5>
                                    <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${row.usagePercent > 100 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                        row.usagePercent > 80 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                        }`}>
                                        {Math.round(row.usagePercent)}%
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-3">
                                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${row.usagePercent > 100 ? 'bg-red-500' :
                                                row.usagePercent > 80 ? 'bg-amber-500' :
                                                    'bg-emerald-500'
                                                }`}
                                            style={{ width: `${Math.min(row.usagePercent, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Amounts */}
                                <div className="flex justify-between text-sm">
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400">Real: </span>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(row.actualAmount)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400">Meta: </span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(row.budgetAmount)}</span>
                                    </div>
                                </div>

                                {/* Edit goal percentage */}
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                                    {editingCategory === row.category ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-600 dark:text-slate-400">Meta:</span>
                                            <input
                                                type="number"
                                                value={tempPercent}
                                                onChange={(e) => setTempPercent(e.target.value)}
                                                className="w-16 bg-white dark:bg-slate-600 border border-indigo-300 dark:border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                            <span className="text-xs text-slate-600 dark:text-slate-400">%</span>
                                            <button
                                                onClick={() => saveEdit(row.category)}
                                                className="ml-auto p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startEdit(row.category, row.targetPercent)}
                                            className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                        >
                                            <span>Meta: {row.targetPercent}% da renda</span>
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total planned */}
                    <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Planejado</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {budgetGoals.reduce((acc, curr) => acc + curr.targetPercentage, 0)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${budgetGoals.reduce((acc, curr) => acc + curr.targetPercentage, 0) > 100 ? 'bg-red-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${Math.min(budgetGoals.reduce((acc, curr) => acc + curr.targetPercentage, 0), 100)}%` }}
                            />
                        </div>
                        {budgetGoals.reduce((acc, curr) => acc + curr.targetPercentage, 0) > 100 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">O orçamento excede 100%.</p>
                        )}
                    </div>
                </div>
            )}

            {budgetReport.length === 0 && expenseCategories.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-slate-400 dark:text-slate-500 italic">Adicione rendas e gastos para gerar o relatório.</p>
                </div>
            )}
        </div>
    );
};