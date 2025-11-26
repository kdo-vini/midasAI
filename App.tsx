import React, { useState, useEffect, useMemo } from 'react';
import { SmartInput } from './components/SmartInput';
import { SummaryCards } from './components/SummaryCards';
import { StatsCards } from './components/StatsCards';
import { TransactionList } from './components/TransactionList';
import { FixedIncomeModal } from './components/FixedIncomeModal';
import { Login } from './components/Login';
import { InsightsComponent } from './components/InsightsComponent';
import { Transaction, TransactionType, AIParsedTransaction, RecurringTransaction, CategoryStat, BudgetGoal } from './types';
import { Settings, BarChart3, ChevronLeft, ChevronRight, LogOut, Loader2, Moon, Sun } from 'lucide-react';
import { supabase, fetchTransactions, saveTransaction, deleteTransaction, updateTransactionCategory, fetchRecurring, saveRecurring, deleteRecurring, fetchBudgets, saveBudget } from './services/supabase';
import { DEFAULT_CATEGORIES } from './constants/categories';
import { Toaster, toast } from 'sonner';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringTransaction[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // --- Dark Mode Effect ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- Auth & Initial Load ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    if (session?.user) {
      loadData(session.user.id);
    }
  }, [session]);

  const loadData = async (userId: string) => {
    setIsLoadingData(true);
    try {
      const [txs, recs, budgets] = await Promise.all([
        fetchTransactions(userId),
        fetchRecurring(userId),
        fetchBudgets(userId)
      ]);
      setTransactions(txs || []);
      setRecurringItems(recs || []);
      setBudgetGoals(budgets || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- Auto-Process Recurring (Client-side logic for now, but saving to DB) ---
  useEffect(() => {
    if (!session?.user || recurringItems.length === 0) return;

    const processRecurring = async () => {
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
            id: crypto.randomUUID(), // Temp ID, DB will generate real one but we need it for UI immediately
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
        // Optimistic update
        setTransactions(prev => [...newTransactions, ...prev]);
        // Save to DB
        for (const tx of newTransactions) {
          await saveTransaction(tx, session.user.id);
        }
        toast.success(`${newTransactions.length} transações recorrentes adicionadas.`);
      }
    };

    processRecurring();
  }, [currentDate, recurringItems, transactions, session]);

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

  const handleAITransaction = async (data: AIParsedTransaction) => {
    if (!data.amount || !data.category || !data.type || !session?.user) return;

    let finalDate = data.date ? data.date : new Date().toISOString();

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      amount: data.amount,
      description: data.description || 'Transação',
      category: data.category,
      type: data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
      date: finalDate,
    };

    // Optimistic Update
    setTransactions(prev => [newTx, ...prev]);
    toast.success("Transação adicionada!");

    try {
      await saveTransaction(newTx, session.user.id);

      // Auto-add budget goal if missing
      if (data.type === 'EXPENSE' && !budgetGoals.some(b => b.category === data.category)) {
        const newBudget = { category: data.category!, targetPercentage: 0 };
        setBudgetGoals(prev => [...prev, newBudget]);
        await saveBudget(newBudget, session.user.id);
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Erro ao salvar transação. Verifique sua conexão.");
      // Rollback optimistic update if needed (omitted for brevity)
    }
  };

  const handleDelete = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success("Transação removida.");
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erro ao deletar.");
    }
  };

  const handleCategoryChange = async (id: string, newCategory: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: newCategory } : t));
    toast.success("Categoria atualizada.");
    try {
      await updateTransactionCategory(id, newCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Erro ao atualizar categoria.");
    }
  };

  const handleAddRecurring = async (item: Omit<RecurringTransaction, 'id'>) => {
    if (!session?.user) return;
    const newItem: RecurringTransaction = { ...item, id: crypto.randomUUID() };
    setRecurringItems(prev => [...prev, newItem]);
    toast.success("Item recorrente salvo.");

    try {
      await saveRecurring(newItem, session.user.id);

      if (item.type === TransactionType.EXPENSE && !budgetGoals.some(b => b.category === item.category)) {
        const newBudget = { category: item.category, targetPercentage: 0 };
        setBudgetGoals(prev => [...prev, newBudget]);
        await saveBudget(newBudget, session.user.id);
      }
    } catch (error) {
      console.error("Error saving recurring:", error);
      toast.error("Erro ao salvar recorrente.");
    }
  };

  const handleRemoveRecurring = async (id: string) => {
    setRecurringItems(prev => prev.filter(f => f.id !== id));
    toast.success("Item recorrente removido.");
    try {
      await deleteRecurring(id);
    } catch (error) {
      console.error("Error deleting recurring:", error);
      toast.error("Erro ao deletar recorrente.");
    }
  };

  const handleUpdateBudget = async (category: string, percentage: number) => {
    if (!session?.user) return;
    setBudgetGoals(prev => {
      const exists = prev.some(b => b.category === category);
      if (exists) {
        return prev.map(b => b.category === category ? { ...b, targetPercentage: percentage } : b);
      }
      return [...prev, { category, targetPercentage: percentage }];
    });
    toast.success("Orçamento atualizado.");

    try {
      await saveBudget({ category, targetPercentage: percentage }, session.user.id);
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Erro ao salvar orçamento.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta.");
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

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pb-20 font-sans transition-colors duration-300">
      <Toaster position="top-center" richColors theme={darkMode ? 'dark' : 'light'} />
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm/50 backdrop-blur-md bg-white/90 dark:bg-slate-800/90 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg p-1 border border-slate-200/60 dark:border-slate-600/60">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm rounded-md transition-all text-slate-500 dark:text-slate-300">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize text-sm px-2 w-28 text-center">{monthLabel}</span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm rounded-md transition-all text-slate-500 dark:text-slate-300">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Midas AI</h1>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all rounded-lg"
                title={darkMode ? "Modo Claro" : "Modo Escuro"}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all rounded-lg"
                title="Configurar recorrentes"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-lg"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">

        <div className="mb-8">
          <SmartInput
            onTransactionParsed={handleAITransaction}
            categories={DEFAULT_CATEGORIES}
          />
        </div>

        <InsightsComponent transactions={transactions} budgetGoals={budgetGoals} />

        <SummaryCards stats={stats} />

        <div className="mb-10">
          {isLoadingData ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : (
            <TransactionList
              transactions={currentMonthTransactions}
              onDelete={handleDelete}
              onCategoryChange={handleCategoryChange}
            />
          )}
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