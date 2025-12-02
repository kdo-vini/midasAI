import React, { useState } from 'react';
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import { generateInsights } from '../services/openaiService';
import { Transaction, BudgetGoal } from '../types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface InsightsComponentProps {
    transactions: Transaction[];
    budgetGoals: BudgetGoal[];
}

export const InsightsComponent: React.FC<InsightsComponentProps> = ({ transactions, budgetGoals }) => {
    const { t, i18n } = useTranslation();
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateInsights(transactions, budgetGoals, i18n.language);
            setInsight(result);
        } catch (error) {
            toast.error(t('insights.error'));
        } finally {
            setLoading(false);
        }
    };

    if (transactions.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Lightbulb className="w-5 h-5 text-yellow-300" />
                        </div>
                        <h3 className="font-bold text-lg">{t('insights.title')}</h3>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                        title={t('insights.generate')}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {insight ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-indigo-50 font-medium leading-relaxed">
                            "{insight}"
                        </p>
                    </div>
                ) : (
                    <div className="text-indigo-100 text-sm opacity-90">
                        <p>{t('insights.description')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
