import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
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
      <h3 className="text-lg font-semibold text-slate-700">Histórico</h3>
      <div className="space-y-3">
        {sorted.map((t) => (
          <div key={t.id} className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {t.type === TransactionType.INCOME ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium text-slate-800">{t.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{t.category}</span>
                  <span>•</span>
                  <span>{formatDate(t.date)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
              <button 
                onClick={() => onDelete(t.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2"
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