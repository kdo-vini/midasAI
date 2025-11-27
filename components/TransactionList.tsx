import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../constants/categories';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, newCategory: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onCategoryChange }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p>Nenhuma transação registrada.</p>
        <p className="text-sm">Use o campo acima para adicionar.</p>
      </div>
    );
  }

  // Sort by date desc
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(date);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Histórico</h3>
      <div className="space-y-3">
        {sorted.map((t) => (
          <div key={t.id} className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-indigo-100 dark:hover:border-slate-600 transition-all">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`p-3 rounded-full flex-shrink-0 ${t.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                {t.type === TransactionType.INCOME ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{t.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <select
                    value={t.category}
                    onChange={(e) => onCategoryChange(t.id, e.target.value)}
                    className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 border-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs appearance-none hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {!DEFAULT_CATEGORIES.includes(t.category) && (
                      <option value={t.category}>{t.category}</option>
                    )}
                  </select>
                  <span>•</span>
                  <span>{formatDate(t.date)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
              <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
              <button
                onClick={() => onDelete(t.id)}
                className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};