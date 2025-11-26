import React, { useState } from 'react';
import { Target, Edit2, Check, PieChart } from 'lucide-react';
import { MonthlyStats, CategoryStat, TransactionType, BudgetGoal } from '../types';

interface StatsCardsProps {
    stats: MonthlyStats;
    categoryStats: CategoryStat[];
    budgetGoals: BudgetGoal[];
    onUpdateBudget: (category: string, percentage: number) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, categoryStats, budgetGoals, onUpdateBudget }) => {
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [tempPercent, setTempPercent] = useState<string>('');

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Filter expense categories
    const expenseCategories = categoryStats
        .filter(c => c.type === TransactionType.EXPENSE)
        .sort((a, b) => b.amount - a.amount);

    // Combine actual stats with budget goals
    const budgetReport = budgetGoals.map(goal => {
        const actual = categoryStats.find(c => c.category === goal.category)?.amount || 0;
        const budgetAmount = (stats.totalIncome * goal.targetPercentage) / 100;
        const remaining = budgetAmount - actual;
        const usagePercent = budgetAmount > 0 ? (actual / budgetAmount) * 100 : (actual > 0 ? 100 : 0);

        return {
            category: goal.category,
            targetPercent: goal.targetPercentage,
            budgetAmount,
            actualAmount: actual,
            remaining,
            usagePercent
        };
    }).filter(item => item.budgetAmount > 0 || item.actualAmount > 0);

    // Sort by highest budget allocation
    budgetReport.sort((a, b) => b.targetPercent - a.targetPercent);

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
        return null; // Don't show report if no data
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700 mt-10 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Relatório Mensal</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left: Distribution Chart */}
                <div className="lg:col-span-4 space-y-6">
                    <h4 className="text-slate-400 dark:text-slate-500 font-bold uppercase text-xs tracking-wider mb-4">Distribuição de Gastos</h4>

                    {expenseCategories.length === 0 ? (
                        <p className="text-slate-400 dark:text-slate-500 text-sm italic">Sem gastos registrados.</p>
                    ) : (
                        <div className="space-y-5">
                            {expenseCategories.slice(0, 6).map((cat) => (
                                <div key={cat.category} className="group">
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-slate-600 dark:text-slate-300 font-semibold">{cat.category}</span>
                                        <span className="text-slate-900 dark:text-slate-100 font-bold">{Math.round(cat.percentage)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-indigo-500 dark:bg-indigo-400 h-full rounded-full transition-all duration-700 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-300"
                                            style={{ width: `${cat.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase mb-1">Total Gastos</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalExpense)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase mb-1">Economia</p>
                                <p className={`text-xl font-bold ${stats.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {stats.totalIncome > 0 ? Math.round((stats.balance / stats.totalIncome * 100)) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle: Detailed Summary Table */}
                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-1 border border-slate-100 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                                    <th className="p-4 font-semibold text-xs uppercase tracking-wider">Categoria</th>
                                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Meta</th>
                                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Real</th>
                                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {budgetReport.map((row) => (
                                    <tr key={row.category} className="hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                        <td className="p-4 font-medium text-slate-700 dark:text-slate-200">{row.category}</td>
                                        <td className="p-4 text-right text-slate-500 dark:text-slate-400">{formatCurrency(row.budgetAmount)}</td>
                                        <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-100">{formatCurrency(row.actualAmount)}</td>
                                        <td className="p-4 flex items-center justify-center">
                                            <div className={`text-[10px] font-bold px-2 py-1 rounded-full border ${row.usagePercent > 100 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400' :
                                                    row.usagePercent > 80 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400' :
                                                        'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                }`}>
                                                {Math.round(row.usagePercent)}%
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {budgetReport.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                                            Adicione rendas e gastos para gerar o relatório.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Goals Management */}
                <div className="lg:col-span-3 pl-0 lg:pl-6 border-l border-transparent lg:border-slate-100 dark:lg:border-slate-700">
                    <div className="flex items-center gap-2 mb-6">
                        <Target className="w-4 h-4 text-orange-500" />
                        <h4 className="text-slate-800 dark:text-slate-200 font-bold uppercase text-xs tracking-wider">Metas de Orçamento</h4>
                    </div>

                    <div className="space-y-1">
                        {budgetGoals.map((goal) => (
                            <div key={goal.category} className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg group transition-colors">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{goal.category}</span>

                                {editingCategory === goal.category ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={tempPercent}
                                            onChange={(e) => setTempPercent(e.target.value)}
                                            className="w-14 bg-white dark:bg-slate-600 border border-indigo-300 dark:border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold text-right text-sm rounded p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => saveEdit(goal.category)}
                                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{goal.targetPercentage}%</span>
                                        <button
                                            onClick={() => startEdit(goal.category, goal.targetPercentage)}
                                            className="p-1 text-slate-300 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Planejado</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {budgetGoals.reduce((acc, curr) => acc + curr.targetPercentage, 0)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${budgetGoals.reduce((acc, curr) => acc + curr.targetPercentage, 0) > 100 ? 'bg-red-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${Math.min(budgetGoals.reduce((acc, curr) => acc + curr.targetPercentage, 0), 100)}%` }}
                            ></div>
                        </div>
                        {budgetGoals.reduce((acc, curr) => acc + curr.targetPercentage, 0) > 100 && (
                            <p className="text-[10px] text-red-500 mt-2 font-medium">O orçamento excede 100%.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};