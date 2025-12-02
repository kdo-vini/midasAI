import React from 'react';
import { TransactionCategory } from '../types';

interface CategoryTabsProps {
    activeCategory: TransactionCategory | 'all';
    onCategoryChange: (category: TransactionCategory | 'all') => void;
    counts?: {
        all: number;
        income: number;
        fixed: number;
        variable: number;
    };
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
    activeCategory,
    onCategoryChange,
    counts
}) => {
    const tabs = [
        { id: 'all' as const, label: 'Todas', icon: '📊', color: 'slate' },
        { id: 'income' as const, label: 'Receitas', icon: '💰', color: 'emerald' },
        { id: 'fixed' as const, label: 'Fixas', icon: '🔴', color: 'red' },
        { id: 'variable' as const, label: 'Variáveis', icon: '🟡', color: 'amber' },
    ];

    const getActiveClasses = (tabId: string, color: string) => {
        if (activeCategory === tabId) {
            const colorMap: Record<string, string> = {
                slate: 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600',
                emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700',
                red: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-300 dark:border-red-700',
                amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700',
            };
            return colorMap[color] || colorMap.slate;
        }
        return 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750';
    };

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onCategoryChange(tab.id)}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap
            ${getActiveClasses(tab.id, tab.color)}
          `}
                >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium text-sm">{tab.label}</span>
                    {counts && counts[tab.id] > 0 && (
                        <span className={`
              ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold
              ${activeCategory === tab.id ? 'bg-white/30' : 'bg-slate-100 dark:bg-slate-700'}
            `}>
                            {counts[tab.id]}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};
