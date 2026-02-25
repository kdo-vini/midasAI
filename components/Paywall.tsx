import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Sparkles, Clock, LineChart, Lock, Loader2, LogOut } from 'lucide-react';
import { Transaction } from '../types';
import { toast } from 'sonner';

interface PaywallProps {
    transactions: Transaction[];
    userId: string;
    email: string | undefined;
    onLogout: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ transactions, userId, email, onLogout }) => {
    const [isLoading, setIsLoading] = useState(false);

    const transactionsCount = transactions.length;
    // Estimated 3 minutes saved per transaction
    const minutesSaved = transactionsCount * 3;
    const hoursSaved = Math.floor(minutesSaved / 60);
    const remainingMinutes = minutesSaved % 60;

    const handleCheckout = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('stripe-checkout', {
                body: {
                    userId,
                    email,
                    returnUrl: window.location.origin
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            toast.error('Ocorreu um erro ao iniciar o checkout. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-800 rounded-3xl border border-slate-700 p-8 md:p-12 shadow-2xl relative overflow-hidden">

                {/* Background Effects */}
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Sparkles className="w-64 h-64 text-yellow-400 rotate-12" />
                </div>
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center space-y-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6">
                        <Lock className="w-8 h-8 text-white" />
                    </div>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 mb-4">
                            Seu período gratuito acabou.
                        </h1>
                        <p className="text-lg text-slate-300 max-w-xl mx-auto">
                            Mas veja o quanto o Midas AI já trabalhou por você nas sombras.
                        </p>
                    </div>

                    {/* Personal Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                        <div className="bg-slate-700/40 rounded-2xl p-6 border border-slate-600/50 backdrop-blur-sm">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                                    <LineChart className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{transactionsCount}</div>
                            <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Tansações Registradas</div>
                        </div>

                        <div className="bg-slate-700/40 rounded-2xl p-6 border border-slate-600/50 backdrop-blur-sm">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">
                                {hoursSaved > 0 ? `${hoursSaved}h ` : ''}{remainingMinutes}m
                            </div>
                            <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Tempo Economizado</div>
                        </div>
                    </div>

                    <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-6 text-left space-y-4">
                        <h3 className="font-semibold text-lg text-indigo-200 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            Assine o Midas
                        </h3>
                        <ul className="space-y-3 text-slate-300">
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                                Inteligência Artificial que categoriza tudo sozinha
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                                Leitura automática de PDF e Faturas
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                                Aconselhamento Financeiro via Chat
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                                Economize horas de trabalho chato por mês
                            </li>
                        </ul>
                    </div>

                    <div className="pt-6 space-y-4">
                        <button
                            onClick={handleCheckout}
                            disabled={isLoading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-lg font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Processando...
                                </>
                            ) : (
                                'Quero assinar por R$ 14,90/mês'
                            )}
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 text-slate-400 hover:text-white flex items-center gap-2 justify-center w-full transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Sair da conta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
