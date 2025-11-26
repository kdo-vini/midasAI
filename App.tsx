import React, { useState, useEffect, useMemo } from 'react';
import { SmartInput } from './components/SmartInput';
import { SummaryCards } from './components/SummaryCards';
import { StatsCards } from './components/StatsCards'; 
import { TransactionList } from './components/TransactionList';
import { FixedIncomeModal } from './components/FixedIncomeModal';
import { Transaction, TransactionType, AIParsedTransaction, RecurringTransaction, CategoryStat, BudgetGoal } from './types';
import { Settings, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date()); 

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [recurringItems, setRecurringItems] = useState<RecurringTransaction[]>(() => {
    const saved = localStorage.getItem('finance_recurring');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>(() => {
    const saved = localStorage.getItem('finance_budgets');
    return saved ? JSON.parse(saved) : [
      { category: 'Moradia', targetPercentage: 30 },
      { category: 'Alimentação', targetPercentage: 15 },
      { category: 'Transporte', targetPercentage: 10 },
      { category: 'Lazer', targetPercentage: 10 },
      { category: 'Investimentos', targetPercentage: 20 },
      { category: 'Doações', targetPercentage: 5 },
    ];
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_recurring', JSON.stringify(recurringItems));
  }, [recurringItems]);

  useEffect(() => {
    localStorage.setItem('finance_budgets', JSON.stringify(budgetGoals));
  }, [budgetGoals]);

  // --- Auto-Process Recurring ---
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); 
    
    let newTransactions: Transaction[] = [];
    let hasChanges = false;

    recurringItems.forEach(item => {
      const alreadyExists = transactions.some(t => {
        if (!t.recurringId || t.recurringId !== item.id) return false;
        const tDate = new Date(t.date);
        return tDate.getMonth() === month && tDate.getFullYear() === year;
      });

      if (!alreadyExists) {
        const targetDate = new Date(year, month, item.dayOfMonth);
        const maxDays = new Date(year, month + 1, 0).getDate();
        const safeDay = Math.min(item.dayOfMonth, maxDays);
        targetDate.setDate(safeDay);

        newTransactions.push({
          id: crypto.randomUUID(),
          amount: item.amount,
          description: item.name,
          category: item.category,
          type: item.type,
          date: targetDate.toISOString(),
          isRecurring: true,
          recurringId: item.id
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setTransactions(prev => [...prev, ...newTransactions]);
    }
  }, [currentDate, recurringItems, transactions]);

  // --- Handlers ---
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  // Derived list of valid categories from budget goals + recurring + default fallbacks
  const availableCategories = useMemo(() => {
    const goalCats = budgetGoals.map(b => b.category);
    const recurringCats = recurringItems.map(r => r.category);
    // Ensure unique
    return Array.from(new Set([...goalCats, ...recurringCats, 'Outros']));
  }, [budgetGoals, recurringItems]);

  const handleAITransaction = (data: AIParsedTransaction) => {
    // If we reach here, SmartInput checked isTransaction=true
    if (!data.amount || !data.category || !data.type) return;

    let finalDate = data.date ? data.date : new Date().toISOString();
    
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      amount: data.amount,
      description: data.description || 'Transação',
      category: data.category,
      type: data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
      date: finalDate,
    };
    setTransactions(prev => [newTx, ...prev]);

    // Although AI should map to existing, if it somehow slips or user adds "Outros", add to goals
    if (data.type === 'EXPENSE' && !budgetGoals.some(b => b.category === data.category)) {
      setBudgetGoals(prev => [...prev, { category: data.category!, targetPercentage: 0 }]);
    }
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddRecurring = (item: Omit<RecurringTransaction, 'id'>) => {
    const newItem: RecurringTransaction = { ...item, id: crypto.randomUUID() };
    setRecurringItems(prev => [...prev, newItem]);
    
    if (item.type === TransactionType.EXPENSE && !budgetGoals.some(b => b.category === item.category)) {
      setBudgetGoals(prev => [...prev, { category: item.category, targetPercentage: 0 }]);
    }
  };

  const handleRemoveRecurring = (id: string) => {
    setRecurringItems(prev => prev.filter(f => f.id !== id));
  };

  const handleUpdateBudget = (category: string, percentage: number) => {
    setBudgetGoals(prev => {
      const exists = prev.some(b => b.category === category);
      if (exists) {
        return prev.map(b => b.category === category ? { ...b, targetPercentage: percentage } : b);
      }
      return [...prev, { category, targetPercentage: percentage }];
    });
  };

  const stats = useMemo(() => {
    const income = currentMonthTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const expense = currentMonthTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense
    };
  }, [currentMonthTransactions]);

  const categoryStats: CategoryStat[] = useMemo(() => {
    const map = new Map<string, { amount: number, type: TransactionType }>();
    
    currentMonthTransactions.forEach(t => {
        const existing = map.get(t.category) || { amount: 0, type: t.type };
        map.set(t.category, { amount: existing.amount + t.amount, type: t.type });
    });

    const totalExp = stats.totalExpense || 1;

    return Array.from(map.entries()).map(([cat, val]) => ({
        category: cat,
        amount: val.amount,
        type: val.type,
        percentage: val.type === TransactionType.EXPENSE ? (val.amount / totalExp) * 100 : 0
    }));
  }, [currentMonthTransactions, stats.totalExpense]);

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 bg-slate-100/50 rounded-lg p-1 border border-slate-200/60">
                    <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-slate-700 capitalize text-sm px-2 w-28 text-center">{monthLabel}</span>
                    <button onClick={handleNextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                     <div className="hidden md:flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-sm font-bold tracking-tight text-slate-900">Midas AI</h1>
                    </div>
                    
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-lg"
                        title="Configurar recorrentes"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        
        <div className="mb-8">
            <SmartInput 
              onTransactionParsed={handleAITransaction} 
              categories={availableCategories} 
            />
        </div>

        <SummaryCards stats={stats} />

        <div className="mb-10">
            <TransactionList transactions={currentMonthTransactions} onDelete={handleDelete} />
        </div>

        <StatsCards 
            stats={stats} 
            categoryStats={categoryStats} 
            budgetGoals={budgetGoals}
            onUpdateBudget={handleUpdateBudget}
        />

      </main>

      <FixedIncomeModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        recurringItems={recurringItems}
        onSave={handleAddRecurring}
        onRemove={handleRemoveRecurring}
      />
    </div>
  );
};

export default App;