import React, { useState } from 'react';
import { X, CalendarClock, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { RecurringTransaction, TransactionType } from '../types';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../constants/categories';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<RecurringTransaction, 'id'>) => void;
  recurringItems: RecurringTransaction[];
  onRemove: (id: string) => void;
}

export const FixedIncomeModal: React.FC<RecurringModalProps> = ({ isOpen, onClose, onSave, recurringItems, onRemove }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !day || !category) return;
    onSave({
      name,
      amount: parseFloat(amount),
      dayOfMonth: parseInt(day, 10),
      type,
      category
    });
    setName('');
    setAmount('');
    setDay('');
    setCategory(type === TransactionType.INCOME ? DEFAULT_INCOME_CATEGORIES[0] : DEFAULT_EXPENSE_CATEGORIES[0]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Transações Fixas / Mensais
          </h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* List existing */}
          {recurringItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Itens Atuais</h3>
              {recurringItems.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${item.type === TransactionType.INCOME ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                      {item.type === TransactionType.INCOME ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Todo dia {item.dayOfMonth} • {item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(item.amount)}</span>
                    <button onClick={() => onRemove(item.id)} className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-indigo-50/50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-wider mb-2">Novo Item Recorrente</h3>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setType(TransactionType.INCOME);
                  setCategory(DEFAULT_INCOME_CATEGORIES[0]);
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-white dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'}`}
              >
                Entrada Fixa
              </button>
              <button
                type="button"
                onClick={() => {
                  setType(TransactionType.EXPENSE);
                  setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none' : 'bg-white dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'}`}
              >
                Gasto Fixo
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Descrição</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border-slate-200 dark:border-slate-600 p-2.5 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                placeholder={type === TransactionType.INCOME ? 'Ex: Salário, Bônus Mensal' : 'Ex: Aluguel, Academia'}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-600 p-2.5 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Dia do Mês</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={day}
                  onChange={e => setDay(e.target.value)}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-600 p-2.5 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="1-31"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-lg border-slate-200 dark:border-slate-600 p-2.5 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none appearance-none"
                required
              >
                {(type === TransactionType.INCOME ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none mt-2">
              <Plus className="w-4 h-4" />
              Adicionar {type === TransactionType.INCOME ? 'Entrada Fixa' : 'Gasto Fixo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};