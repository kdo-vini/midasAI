import React from 'react';
import { Home, PieChart, List, Settings, FileUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type TabType = 'home' | 'transactions' | 'reports' | 'import' | 'settings';

interface BottomNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    const navItems = [
        { id: 'home' as const, label: t('app.nav.home'), icon: Home },
        { id: 'transactions' as const, label: t('app.nav.transactions'), icon: List },
        { id: 'reports' as const, label: t('app.nav.reports'), icon: PieChart },
        { id: 'import' as const, label: 'Importar', icon: FileUp },
        { id: 'settings' as const, label: t('app.settings.title'), icon: Settings },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-4 pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[100] md:hidden transition-colors duration-300">
            <div className="flex justify-between items-center pb-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isActive
                                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[9px] font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
