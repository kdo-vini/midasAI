import React, { useState } from 'react';
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import { generateInsights } from '../services/openaiService';
import { Transaction, BudgetGoal } from '../types';
import { toast } from 'sonner';

interface InsightsComponentProps {
    transactions: Transaction[];
    budgetGoals: BudgetGoal[];
}

export const InsightsComponent: React.FC<InsightsComponentProps> = ({ transactions, budgetGoals }) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateInsights(transactions, budgetGoals, 'pt');
            setInsight(result);
        } catch (error) {
            toast.error('Erro ao gerar insights.');
        } finally {
            setLoading(false);
        }
    };

    if (transactions.length === 0) return null;

    return (
        <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-2xl p-6 shadow-sm mb-8 relative overflow-hidden group">
            {/* Subtle Gold Glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-[#FFD700] rounded-full blur-[80px] opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20">
                            <Sparkles className="w-4 h-4 text-[#FFD700]" />
                        </div>
                        <h3 className="font-space font-bold text-lg text-slate-100 tracking-tight">Midas Insights</h3>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="p-2 text-slate-500 hover:text-[#FFD700] hover:bg-[#FFD700]/5 rounded-lg transition-all disabled:opacity-50"
                        title="Gerar novo insight"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="mt-4">
                    {insight ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-4 rounded-xl bg-[#141414] border border-[#222]">
                                <p className="text-slate-300 font-medium leading-relaxed text-sm">
                                    "{insight}"
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-500 text-sm">
                            <p>Clique no botão para receber uma análise inteligente das suas finanças baseada nos seus gastos recentes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
