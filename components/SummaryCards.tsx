import React from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { MonthlyStats } from '../types';

interface SummaryCardsProps {
  stats: MonthlyStats;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Balance */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors duration-300">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Saldo Atual</p>
          <h2 className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(stats.balance)}
          </h2>
        </div>
        <div className={`p-3 rounded-full ${stats.balance >= 0 ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
          <Wallet className="w-6 h-6" />
        </div>
      </div>

      {/* Income */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors duration-300">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Entradas</p>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalIncome)}
          </h2>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
          <ArrowUpCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Expense */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors duration-300">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Saídas</p>
          <h2 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(stats.totalExpense)}
          </h2>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-full">
          <ArrowDownCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
      </div>
    </div>
  );
};