import React, { useState } from 'react';
import { X, CalendarClock, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { RecurringTransaction, TransactionType } from '../types';

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
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE); // Default to expense (e.g. rent)
  const [category, setCategory] = useState('');

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
    // Reset form
    setName('');
    setAmount('');
    setDay('');
    setCategory('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600" />
            Transações Fixas / Mensais
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
            {/* List existing */}
            {recurringItems.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itens Atuais</h3>
                    {recurringItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${item.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {item.type === TransactionType.INCOME ? <ArrowUpCircle className="w-4 h-4"/> : <ArrowDownCircle className="w-4 h-4"/>}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-500">Todo dia {item.dayOfMonth} • {item.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-700">R$ {item.amount.toFixed(2)}</span>
                                <button onClick={() => onRemove(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

          <form onSubmit={handleSubmit} className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Novo Item Recorrente</h3>
            
            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setType(TransactionType.INCOME)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-200'}`}
                >
                    Entrada Fixa
                </button>
                <button
                    type="button"
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white text-slate-500 border border-slate-200'}`}
                >
                    Gasto Fixo
                </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={type === TransactionType.INCOME ? "Ex: Salário, Bônus Mensal" : "Ex: Aluguel, Academia"}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full rounded-lg border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="0.00"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Dia do Mês</label>
                    <input 
                        type="number" 
                        min="1"
                        max="31"
                        value={day}
                        onChange={e => setDay(e.target.value)}
                        className="w-full rounded-lg border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="1-31"
                        required
                    />
                </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
              <input 
                type="text" 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-lg border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={type === TransactionType.INCOME ? "Salário" : "Moradia"}
                required
              />
            </div>

            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 mt-2">
                <Plus className="w-4 h-4" />
                Adicionar {type === TransactionType.INCOME ? 'Receita' : 'Despesa'} Fixa
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};