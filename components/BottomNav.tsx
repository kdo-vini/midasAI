import React from 'react';
import { Home, PieChart } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'home' | 'reports';
    onTabChange: (tab: 'home' | 'reports') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-4 pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[100] md:hidden transition-colors duration-300">
            <div className="flex justify-around items-center pb-2">
                <button
                    onClick={() => onTabChange('home')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${activeTab === 'home'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                >
                    <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium">Início</span>
                </button>

                <button
                    onClick={() => onTabChange('reports')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${activeTab === 'reports'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                >
                    <PieChart className={`w-6 h-6 ${activeTab === 'reports' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium">Relatórios</span>
                </button>
            </div>
        </div>
    );
};
