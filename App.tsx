import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SmartInput } from './components/SmartInput';
import { SummaryCards } from './components/SummaryCards';
import { StatsCards } from './components/StatsCards';
import { TransactionCard } from './components/TransactionCard';
import { CategoryTabs } from './components/CategoryTabs';
import { DashboardStats } from './components/DashboardStats';
import { FixedIncomeModal } from './components/FixedIncomeModal';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { InsightsComponent } from './components/InsightsComponent';
import { BottomNav, TabType } from './components/BottomNav';
import { Logo } from './components/Logo';
import { FloatingChat } from './components/FloatingChat';
import { OnboardingModal } from './components/OnboardingModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { UpdatePassword } from './components/UpdatePassword';
import { EmailConfirmed } from './components/EmailConfirmed';
import { CategoryManager } from './components/CategoryManager';
import { StatementImport } from './components/StatementImport';
import { StatementReportView } from './components/StatementReportView';
import { Paywall } from './components/Paywall';
import { Transaction, TransactionType, TransactionCategory, AIParsedTransaction, RecurringTransaction, CategoryStat, BudgetGoal, UserCategory, UserProfile } from './types';
import { Settings, ChevronLeft, ChevronRight, LogOut, Loader2, Moon, Sun, Bell, BellOff } from 'lucide-react';
import { supabase, fetchTransactions, saveTransaction, deleteTransaction, updateTransactionCategory, fetchRecurring, saveRecurring, deleteRecurring, fetchBudgets, saveBudget, updateTransaction, deleteTransactionsByRecurringId, deleteTransactionsByInstallmentGroupId, fetchUserCategories, saveUserCategory, updateUserCategory, deleteUserCategory, updateTransactionsCategory, deleteTransactionsByCategory, updateBudgetCategory, deleteBudgetByCategory, fetchUserProfile, saveUserProfile, fetchStatementReports, fetchUserUsage, StatementReport, UserUsage } from './services/supabase';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from './constants/categories';
import { Toaster, toast } from 'sonner';

import { isPushSupported, isSubscribedToPush, subscribeToPush, unsubscribeFromPush } from './services/pushNotifications';

const App: React.FC = () => {

  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [view, setView] = useState<'landing' | 'login' | 'app' | 'update-password' | 'email-confirmed'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) return 'update-password';
      if (hash.includes('type=signup')) return 'email-confirmed';
    }
    return 'landing';
  });

  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringTransaction[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeCategory, setActiveCategory] = useState<TransactionCategory | 'all'>('all');
  const [darkMode, setDarkMode] = useState(() => {
    // Force Dark Mode initialization
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', 'dark');
      return true;
    }
    return true;
  });

  // Delete modal state for installment transactions
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Category management state
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Statement import state
  const [statementReports, setStatementReports] = useState<StatementReport[]>([]);
  const [userUsage, setUserUsage] = useState<UserUsage>({ reports_this_month: 0, last_reset_month: 0 });
  const [viewingReport, setViewingReport] = useState<StatementReport | null>(null);

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // --- Dark Mode Effect ---
  useEffect(() => {
    // Always enforce dark mode
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    setDarkMode(true);
  }, []);

  // --- Auth & Initial Load ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error restoring session:", error);
        if (error.message && (error.message.includes("Refresh Token") || error.message.includes("refresh_token"))) {
          supabase.auth.signOut();
        }
      }
      setSession(session);

      if (session) {
        setView(current => {
          if (current === 'update-password' || current === 'email-confirmed') return current;
          return 'app'; // Auto-route to app if logged in and not in a special flow
        });
      }

      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'PASSWORD_RECOVERY') {
        setView('update-password');
      } else if (event === 'SIGNED_IN') {
        const hash = window.location.hash;
        if (hash && hash.includes('type=signup')) {
          // Need to clear the hash to prevent getting stuck on refresh
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          setView('email-confirmed');
        } else {
          setView(current => {
            if (current === 'update-password' || current === 'email-confirmed') return current;
            return 'app';
          });
        }
      } else if (!session) {
        setView(current => current === 'app' ? 'landing' : current); // Go to landing on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    if (session?.user) {
      loadData(session.user.id);
      // Check push notification status
      isSubscribedToPush().then(setPushEnabled);
    }
  }, [session]);

  const loadData = async (userId: string) => {
    setIsLoadingData(true);
    try {
      const [txs, recs, budgets, categories, profile, reports, usage] = await Promise.all([
        fetchTransactions(userId),
        fetchRecurring(userId),
        fetchBudgets(userId),
        fetchUserCategories(userId),
        fetchUserProfile(userId),
        fetchStatementReports(userId).catch(() => []),
        fetchUserUsage(userId).catch(() => ({ reports_this_month: 0, last_reset_month: 0 }))
      ]);
      setTransactions(txs || []);
      setRecurringItems(recs || []);
      setBudgetGoals(budgets || []);
      setUserCategories(categories || []);
      setUserProfile(profile || { userId, displayName: null });
      setStatementReports(reports || []);
      setUserUsage(usage);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error('Erro ao carregar dados.');
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- Auto-Process Recurring ---
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
            id: uuidv4(),
            amount: item.amount,
            description: item.name,
            category: item.category,
            type: item.type,
            date: targetDate.toISOString(),
            isRecurring: true,
            recurringId: item.id,
            isPaid: false,
            transactionCategory: item.type === TransactionType.INCOME ? 'income' : 'fixed'
          });
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setTransactions(prev => [...newTransactions, ...prev]);
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

  const filteredTransactions = useMemo(() => {
    if (activeCategory === 'all') return currentMonthTransactions;
    return currentMonthTransactions.filter(t => {
      const category = t.transactionCategory || (t.type === TransactionType.INCOME ? 'income' : 'variable');
      return category === activeCategory;
    });
  }, [currentMonthTransactions, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts = {
      all: currentMonthTransactions.length,
      income: 0,
      fixed: 0,
      variable: 0,
      savings: 0
    };

    currentMonthTransactions.forEach(t => {
      const category = t.transactionCategory || (t.type === TransactionType.INCOME ? 'income' : 'variable');
      if (category === 'income') counts.income++;
      else if (category === 'fixed') counts.fixed++;
      else if (category === 'variable') counts.variable++;
      else if (category === 'savings') counts.savings++;
    });

    return counts;
  }, [currentMonthTransactions]);

  const handleAITransaction = async (data: AIParsedTransaction) => {
    console.log("AI Data Received:", data);
    if (!data.amount || !data.category || !data.type || !session?.user) return;

    const transactionsToSave: Transaction[] = [];

    // Fix: Parse YYYY-MM-DD manually to ensure local time (avoid UTC conversion issues)
    let baseDate = new Date();
    if (data.date) {
      const [year, month, day] = data.date.split('-').map(Number);
      baseDate = new Date(year, month - 1, day);
    }

    // Robust parsing for installments
    let installments = 1;
    if (data.installments) {
      const parsed = parseInt(String(data.installments), 10);
      if (!isNaN(parsed) && parsed > 1) {
        installments = parsed;
      }
    }

    const installmentAmount = data.amount / installments;

    // Generate a unique group ID for installments if there are multiple
    const groupId = installments > 1 ? uuidv4() : undefined;

    for (let i = 0; i < installments; i++) {
      const date = new Date(baseDate);
      date.setMonth(baseDate.getMonth() + i);

      const description = installments > 1
        ? `${data.description || 'Transação'} (${i + 1}/${installments})`
        : data.description || 'Transação';

      transactionsToSave.push({
        id: uuidv4(),
        amount: installmentAmount,
        description: description,
        category: data.category,
        type: data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
        date: date.toISOString(),
        isPaid: false,
        transactionCategory: data.category === 'Economias' ? 'savings' : (data.type === 'INCOME' ? 'income' : 'variable'),
        installmentGroupId: groupId
      });
    }

    setTransactions(prev => [...transactionsToSave, ...prev]);
    toast.success(installments > 1 ? `${installments} parcelas adicionadas!` : 'Transação adicionada!');

    try {
      for (const tx of transactionsToSave) {
        await saveTransaction(tx, session.user.id);
      }

      if (data.type === 'EXPENSE' && !budgetGoals.some(b => b.category === data.category)) {
        const newBudget = { category: data.category!, targetPercentage: 0 };
        setBudgetGoals(prev => [...prev, newBudget]);
        await saveBudget(newBudget, session.user.id);
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error('Erro ao salvar transação. Verifique sua conexão.');
    }
  };

  const handleTogglePaid = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const newIsPaid = !(transaction.isPaid ?? false);
    const updatedTransaction = {
      ...transaction,
      isPaid: newIsPaid,
      paidDate: newIsPaid ? new Date().toISOString() : undefined
    };

    setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
    toast.success(newIsPaid ? 'Marcado como pago!' : 'Desmarcado');

    try {
      await updateTransaction(updatedTransaction, session!.user.id);
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error('Erro ao atualizar status.');
      // Revert on error
      setTransactions(prev => prev.map(t => t.id === id ? transaction : t));
    }
  };

  const handleDelete = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    // Check if this is part of an installment group
    if (transaction.installmentGroupId) {
      // Count total installments in group
      const installmentGroup = transactions.filter(t => t.installmentGroupId === transaction.installmentGroupId);
      const totalInstallments = installmentGroup.length;

      // Show modal for user to choose
      setTransactionToDelete(transaction);
      setDeleteModalOpen(true);
    } else {
      // Single transaction - delete directly
      await handleDeleteSingle(id);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('Transação removida.', { duration: 1000 });
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error('Erro ao deletar.');
    }
  };

  const handleBulkDelete = async (groupId: string) => {
    const installmentCount = transactions.filter(t => t.installmentGroupId === groupId).length;
    setTransactions(prev => prev.filter(t => t.installmentGroupId !== groupId));
    toast.success(`${installmentCount} parcelas removidas.`, { duration: 2000 });
    try {
      await deleteTransactionsByInstallmentGroupId(groupId);
    } catch (error) {
      console.error("Error deleting installment series:", error);
      toast.error('Erro ao deletar.');
    }
  };

  const handleCategoryChange = async (id: string, newCategory: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: newCategory } : t));
    toast.success('Categoria atualizada.');
    try {
      await updateTransactionCategory(id, newCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error('Erro ao atualizar categoria.');
    }
  };

  const handleAddRecurring = async (item: Omit<RecurringTransaction, 'id'>) => {
    if (!session?.user) return;
    const newItem: RecurringTransaction = { ...item, id: uuidv4() };
    setRecurringItems(prev => [...prev, newItem]);
    toast.success('Item recorrente salvo.');

    try {
      await saveRecurring(newItem, session.user.id);

      if (item.type === TransactionType.EXPENSE && !budgetGoals.some(b => b.category === item.category)) {
        const newBudget = { category: item.category, targetPercentage: 0 };
        setBudgetGoals(prev => [...prev, newBudget]);
        await saveBudget(newBudget, session.user.id);
      }
    } catch (error) {
      console.error("Error saving recurring:", error);
      toast.error('Erro ao salvar recorrente.');
    }
  };

  const handleRemoveRecurring = async (id: string) => {
    // Optimistic update
    setRecurringItems(prev => prev.filter(f => f.id !== id));
    setTransactions(prev => prev.filter(t => t.recurringId !== id)); // Remove associated transactions from UI

    toast.success('Item recorrente e histórico removidos.');

    try {
      await Promise.all([
        deleteRecurring(id),
        deleteTransactionsByRecurringId(id)
      ]);
    } catch (error) {
      console.error("Error deleting recurring:", error);
      toast.error('Erro ao deletar recorrente.');
      // Note: Reverting this complex state would require refetching or more complex undo logic
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
    toast.success('Orçamento atualizado.');

    try {
      await saveBudget({ category, targetPercentage: percentage }, session.user.id);
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error('Erro ao salvar orçamento.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('landing');
    toast.success('Você saiu da conta.');
  };

  // --- Category Management Handlers ---
  const handleAddCategory = async (name: string, type: 'INCOME' | 'EXPENSE') => {
    if (!session?.user) return;
    try {
      await saveUserCategory(name, type, session.user.id);
      const categories = await fetchUserCategories(session.user.id);
      setUserCategories(categories);
      toast.success('Categoria adicionada!');
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error('Erro ao salvar categoria.');
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    if (!session?.user) return;
    try {
      await updateUserCategory(id, name, session.user.id);
      const categories = await fetchUserCategories(session.user.id);
      setUserCategories(categories);
      toast.success('Categoria atualizada!');
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error('Erro ao atualizar categoria.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteUserCategory(id);
      setUserCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Categoria removida!');
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error('Erro ao deletar categoria.');
    }
  };

  const handleReassignAndDeleteCategory = async (categoryId: string | null, oldName: string, newName: string) => {
    if (!session?.user) return;
    try {
      if (categoryId) {
        await deleteUserCategory(categoryId);
      }

      // Update transactions
      await updateTransactionsCategory(oldName, newName, session.user.id);

      // Update budget goals safely
      await updateBudgetCategory(oldName, newName, session.user.id);

      const newTransactions = await fetchTransactions(session.user.id);
      setTransactions(newTransactions || []);

      // Refresh budgets
      const newBudgets = await fetchBudgets(session.user.id);
      setBudgetGoals(newBudgets);

      if (categoryId) {
        setUserCategories(prev => prev.filter(c => c.id !== categoryId));
      }
      toast.success('Categoria excluída e transações/metas reatribuídas!');
    } catch (error) {
      console.error("Error reassigning category:", error);
      toast.error('Erro ao processar exclusão.');
    }
  };

  const handleDeleteCategoryCascading = async (categoryId: string | null, categoryName: string) => {
    if (!session?.user) return;
    try {
      if (categoryId) {
        await deleteUserCategory(categoryId);
      }
      await deleteTransactionsByCategory(categoryName, session.user.id);
      await deleteBudgetByCategory(categoryName, session.user.id);

      const newTransactions = await fetchTransactions(session.user.id);
      setTransactions(newTransactions || []);

      // Refresh budgets
      const newBudgets = await fetchBudgets(session.user.id);
      setBudgetGoals(newBudgets);

      if (categoryId) {
        setUserCategories(prev => prev.filter(c => c.id !== categoryId));
      }
      toast.success('Categoria, metas e transações excluídas!');
    } catch (error) {
      console.error("Error deleting category cascading:", error);
      toast.error('Erro ao excluir em cascata.');
    }
  };

  // --- Profile Management ---
  const handleSaveProfile = async (displayName: string) => {
    if (!session?.user) return;
    try {
      const profile = { userId: session.user.id, displayName };
      await saveUserProfile(profile);
      setUserProfile(profile);
      toast.success('Perfil atualizado!');
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error('Erro ao salvar perfil.');
    }
  };

  // --- Subscription Management ---
  const handleManageSubscription = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        body: { userId: session.user.id, returnUrl: window.location.origin }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
      toast.error('Erro ao abrir portal.');
    }
  };

  const handleUpgradeSubscription = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { userId: session.user.id, email: session.user.email, returnUrl: window.location.origin }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Erro ao iniciar checkout.');
    }
  };

  // --- Push Notification Toggle ---
  const handleTogglePush = async () => {
    if (!session?.user) return;
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush(session.user.id);
        setPushEnabled(false);
        toast.success('Notificações desativadas.');
      } else {
        try {
          await subscribeToPush(session.user.id);
          setPushEnabled(true);
          toast.success('Notificações ativadas! Você receberá lembretes das suas contas.');
        } catch (err: any) {
          toast.error(err.message || 'Erro ao ativar notificações. Verifique as permissões do navegador.', { duration: 6000 });
        }
      }
    } catch (error: any) {
      console.error('Error toggling push:', error);
      toast.error(error.message || 'Erro ao ativar notificações. Verifique as permissões do navegador.', { duration: 6000 });
    } finally {
      setPushLoading(false);
    }
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

  // Get category names from user categories
  const expenseCategoryNames = useMemo(() => userCategories.filter(c => c.type === 'EXPENSE').map(c => c.name), [userCategories]);
  const incomeCategoryNames = useMemo(() => userCategories.filter(c => c.type === 'INCOME').map(c => c.name), [userCategories]);

  const allExpenseCategories = expenseCategoryNames.length > 0 ? expenseCategoryNames : DEFAULT_EXPENSE_CATEGORIES;
  const allIncomeCategories = incomeCategoryNames.length > 0 ? incomeCategoryNames : DEFAULT_INCOME_CATEGORIES;

  const allCategories = [...allExpenseCategories, ...allIncomeCategories];

  const isPro = useMemo(() => {
    if (!userProfile) return true; // default true while loading
    if (userProfile.subscriptionStatus === 'active' || userProfile.subscriptionStatus === 'trialing') return true;
    if (userProfile.trialEndDate) {
      const trialDate = new Date(userProfile.trialEndDate);
      if (trialDate.toString() !== 'Invalid Date' && new Date() < trialDate) return true;
    }
    return false;
  }, [userProfile]);

  const trialDaysLeft = useMemo(() => {
    if (!userProfile?.trialEndDate || userProfile.subscriptionStatus === 'active') return null;
    const diffTime = new Date(userProfile.trialEndDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [userProfile]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <SmartInput
              onTransactionParsed={handleAITransaction}
              categories={allCategories}
              currentDate={currentDate}
              transactions={currentMonthTransactions}
              budgetGoals={budgetGoals}
              monthlyStats={stats}
            />
            <DashboardStats transactions={transactions} currentDate={currentDate} />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Últimas Transações</h2>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Ver todas
                </button>
              </div>
              <div className="space-y-3">
                {isLoadingData ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : filteredTransactions.slice(0, 5).map(transaction => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onTogglePaid={handleTogglePaid}
                    onDelete={handleDelete}
                    onCategoryChange={handleCategoryChange}
                  />
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    Nenhuma transação recente
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Transações</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {filteredTransactions.length} itens
              </span>
            </div>

            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              counts={categoryCounts}
            />

            <div className="space-y-3">
              {isLoadingData ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                  Nenhuma transação nesta categoria
                </div>
              ) : (
                filteredTransactions.map(transaction => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onTogglePaid={handleTogglePaid}
                    onDelete={handleDelete}
                    onCategoryChange={handleCategoryChange}
                  />
                ))
              )}
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <SummaryCards stats={stats} />
            <InsightsComponent transactions={transactions} budgetGoals={budgetGoals} />
            <StatsCards
              stats={stats}
              categoryStats={categoryStats}
              budgetGoals={budgetGoals}
              userCategories={allExpenseCategories}
              onUpdateBudget={handleUpdateBudget}
            />
          </div>
        );

      case 'import':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {viewingReport ? (
              <StatementReportView
                report={viewingReport}
                onBack={() => setViewingReport(null)}
              />
            ) : (
              <StatementImport
                userId={session?.user?.id || ''}
                reportsThisMonth={userUsage.reports_this_month}
                maxReports={10}
                previousReports={statementReports}
                onReportGenerated={(report) => {
                  setStatementReports(prev => [report, ...prev]);
                  setUserUsage(prev => ({ ...prev, reports_this_month: prev.reports_this_month + 1 }));
                  setViewingReport(report);
                }}
                onViewReport={(report) => setViewingReport(report)}
              />
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Perfil</h2>

            {/* Profile Info Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Informações Pessoais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome para Exibição
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userProfile?.displayName || ''}
                      onChange={(e) => setUserProfile(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                      placeholder="Como você gostaria de ser chamado?"
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => userProfile?.displayName && handleSaveProfile(userProfile.displayName)}
                      disabled={!userProfile?.displayName?.trim()}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                    >
                      Salvar
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">A IA usará este nome para personalizar as respostas</p>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Email:</span> {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Management Options */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Gerenciamento</h3>
              </div>

              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Gerenciar Categorias</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Personalizar categorias de despesas</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Gerenciar Recorrentes</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configurar salários e contas fixas</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              {/* Push Notifications Toggle */}
              {isPushSupported() && (
                <button
                  onClick={handleTogglePush}
                  disabled={pushLoading}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${pushEnabled
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      }`}>
                      {pushEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Notificações</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {pushEnabled ? 'Notificações ativadas' : 'Receba lembretes das suas contas a pagar'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pushLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${pushEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${pushEnabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                      </div>
                    )}
                  </div>
                </button>
              )}

              <button
                onClick={userProfile?.subscriptionStatus === 'active' ? handleManageSubscription : handleUpgradeSubscription}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Gerenciar Assinatura</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {userProfile?.subscriptionStatus === 'active' ? 'Alterar plano, cancelar ou cartão' : 'Gerenciar a sua assinatura'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Logout Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-red-600 dark:text-red-400">Sair da Conta</h4>
                    <p className="text-sm text-red-400/70">Encerrar sessão atual</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
              Midas AI v0.1.0
            </div>
          </div>
        );

    }
  };

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  // --- RENDERING VIEWS ---

  if (view === 'update-password') {
    return <UpdatePassword onSuccess={() => setView('login')} />;
  }

  if (view === 'email-confirmed') {
    return <EmailConfirmed onContinue={() => {
      if (session) {
        setView('app');
      } else {
        setView('login');
      }
    }} />;
  }

  if (!session) {
    if (view === 'landing') {
      return <LandingPage onLoginClick={() => setView('login')} />;
    }
    // Simple Login Wrapper with Back Button
    return (
      <div className="relative">
        <Login />
        <button
          onClick={() => setView('landing')}
          className="absolute top-4 left-4 p-2 bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          style={{ zIndex: 50 }}
          aria-label="Back to landing"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // PAYWALL VIEW
  if (!isPro) {
    return (
      <Paywall
        transactions={transactions}
        userId={session.user.id}
        email={session.user.email}
        onLogout={handleLogout}
      />
    );
  }

  // APP VIEW
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-24 md:pb-20 font-sans">
      <Toaster position="top-center" richColors theme="dark" />
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 shadow-sm/50 backdrop-blur-md bg-slate-800/90 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {trialDaysLeft !== null && trialDaysLeft > 0 && (
            <div className="mb-3 px-4 py-3 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 text-amber-500 rounded-xl text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">✨ Faltam apenas <b>{trialDaysLeft} dias</b> para seu Teste Grátis encerrar.</span>
              <button onClick={handleUpgradeSubscription} className="font-bold px-3 py-1 bg-amber-500/20 rounded-lg hover:bg-amber-500/30 transition-colors">Assinar Agora</button>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1 border border-slate-600/60">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-600 hover:shadow-sm rounded-md transition-all text-slate-300">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-200 capitalize text-sm px-2 w-28 text-center">{monthLabel}</span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-600 hover:shadow-sm rounded-md transition-all text-slate-300">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-6">
              {/* Container do logo */}
              <div className="inline-flex items-center gap-2">
                <Logo />
              </div>


              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'home' ? 'bg-indigo-900/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  Início
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'transactions' ? 'bg-indigo-900/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  Transações
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-indigo-900/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  Relatórios
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'import' ? 'bg-emerald-900/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  Importar
                </button>
              </nav>

              {/* Desktop only buttons */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-all rounded-lg"
                  title="Perfil"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all rounded-lg"
                  title="Sair da Conta"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {renderContent()}
      </main>

      <FixedIncomeModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        recurringItems={recurringItems}
        onSave={handleAddRecurring}
        onRemove={handleRemoveRecurring}
      />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <FloatingChat
        transactions={currentMonthTransactions}
        budgetGoals={budgetGoals}
        monthlyStats={stats}
      />

      <OnboardingModal
        isOpen={userProfile !== null && !userProfile.hasSeenOnboarding}
        userProfile={userProfile}
        categories={allCategories}
        transactions={currentMonthTransactions}
        budgetGoals={budgetGoals}
        monthlyStats={stats}
        onTransactionParsed={handleAITransaction}
        onComplete={() => {
          if (userProfile && !userProfile.hasSeenOnboarding) {
            setUserProfile(prev => prev ? { ...prev, hasSeenOnboarding: true } : null);
            supabase.from('user_profiles').update({ has_seen_onboarding: true }).eq('user_id', userProfile.userId).then();
          }
        }}
      />

      {/* Delete Confirmation Modal for Installments */}
      {transactionToDelete && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setTransactionToDelete(null);
          }}
          onDeleteSingle={() => {
            if (transactionToDelete) {
              handleDeleteSingle(transactionToDelete.id);
            }
          }}
          onDeleteAll={() => {
            if (transactionToDelete?.installmentGroupId) {
              handleBulkDelete(transactionToDelete.installmentGroupId);
            }
          }}
          installmentInfo={transactionToDelete.description}
          totalInstallments={transactions.filter(t => t.installmentGroupId === transactionToDelete.installmentGroupId).length}
        />
      )}

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={userCategories}
        onAdd={handleAddCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
        onDeleteCascading={handleDeleteCategoryCascading}
        onReassignAndDelete={handleReassignAndDeleteCategory}
        transactions={transactions}
      />
    </div>
  );
};

export default App;