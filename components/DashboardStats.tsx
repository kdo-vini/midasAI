import React from 'react';
import { Transaction, TransactionCategory } from '../types';

interface DashboardStatsProps {
    transactions: Transaction[];
    currentDate: Date;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ transactions, currentDate }) => {
    // Filtrar transações do mês atual
    const currentMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    // Calcular estatísticas por categoria
    const stats = {
        income: {
            total: 0,
            paid: 0,
            count: 0,
            paidCount: 0
        },
        fixed: {
            total: 0,
            paid: 0,
            count: 0,
            paidCount: 0
        },
        variable: {
            total: 0,
            paid: 0,
            count: 0,
            paidCount: 0
        }
    };

    currentMonthTransactions.forEach(t => {
        const category = t.transactionCategory || (t.type === 'INCOME' ? 'income' : 'variable');
        const isPaid = t.isPaid ?? false;

        if (stats[category as TransactionCategory]) {
            stats[category as TransactionCategory].total += t.amount;
            stats[category as TransactionCategory].count += 1;

            if (isPaid) {
                stats[category as TransactionCategory].paid += t.amount;
                stats[category as TransactionCategory].paidCount += 1;
            }
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const StatCard = ({
        title,
        icon,
        total,
        paid,
        count,
        paidCount,
        bgColor,
        textColor,
        isIncome = false,
        hideProgress = false
    }: {
        title: string;
        icon: string;
        total: number;
        paid: number;
        count: number;
        paidCount: number;
        bgColor: string;
        textColor: string;
        isIncome?: boolean;
        hideProgress?: boolean;
    }) => (
        <div className={`${bgColor} rounded-lg p-4 border border-slate-200/60 dark:border-slate-700/60`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
                </div>
                {!hideProgress && (
                    <span className="text-xs bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full font-medium text-slate-600 dark:text-slate-400">
                        {paidCount}/{count}
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <div className={`text-2xl font-bold ${textColor}`}>
                    {isIncome ? '+' : ''}{formatCurrency(total)}
                </div>

                {!isIncome && !hideProgress && count > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                            Pago: {formatCurrency(paid)}
                        </span>
                        <span className={`font-medium ${paidCount === count ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {Math.round((paidCount / count) * 100)}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
                title="Receitas"
                icon="💰"
                total={stats.income.total}
                paid={stats.income.paid}
                count={stats.income.count}
                paidCount={stats.income.paidCount}
                bgColor="bg-emerald-50/50 dark:bg-emerald-900/10"
                textColor="text-emerald-600 dark:text-emerald-400"
                isIncome
                hideProgress
            />

            <StatCard
                title="Despesas Fixas"
                icon="🔴"
                total={stats.fixed.total}
                paid={stats.fixed.paid}
                count={stats.fixed.count}
                paidCount={stats.fixed.paidCount}
                bgColor="bg-red-50/50 dark:bg-red-900/10"
                textColor="text-red-600 dark:text-red-400"
            />

            <StatCard
                title="Despesas Variáveis"
                icon="🟡"
                total={stats.variable.total}
                paid={stats.variable.paid}
                count={stats.variable.count}
                paidCount={stats.variable.paidCount}
                bgColor="bg-amber-50/50 dark:bg-amber-900/10"
                textColor="text-amber-600 dark:text-amber-400"
                hideProgress
            />
        </div>
    );
};
