import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, Wand2, Mic, Wallet, TrendingUp, X } from 'lucide-react';
import { SmartInput } from './SmartInput';
import { AIParsedTransaction, Transaction, BudgetGoal, MonthlyStats, UserProfile } from '../types';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
    userProfile: UserProfile | null;
    // Props needed for SmartInput in step 3
    categories: string[];
    transactions: Transaction[];
    budgetGoals: BudgetGoal[];
    monthlyStats: MonthlyStats;
    onTransactionParsed: (data: AIParsedTransaction) => void;
}

const steps = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao Midas',
        description: 'Sua jornada para a liberdade financeira começa aqui. Deixe a IA cuidar da parte chata para você.',
        icon: Sparkles,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
    },
    {
        id: 'smart-input',
        title: 'Entrada Inteligente',
        description: 'Não perca tempo com formulários longos. Apenas fale ou digite como se estivesse conversando.',
        icon: Mic,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
    },
    {
        id: 'first-entry',
        title: 'Sua primeira transação',
        description: 'Tente agora! Digite algo como "Gastei 30 reais na padaria hoje"',
        icon: Wand2,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
    },
    {
        id: 'insights',
        title: 'Insights Reais',
        description: 'O Midas aprende com seus hábitos e sugere onde você pode economizar de verdade.',
        icon: TrendingUp,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    {
        id: 'ready',
        title: 'Tudo pronto!',
        description: 'Você está no comando agora. O Midas estará sempre aqui no canto inferior para te ajudar.',
        icon: CheckCircle2,
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/10',
    }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
    isOpen,
    onComplete,
    userProfile,
    categories,
    transactions,
    budgetGoals,
    monthlyStats,
    onTransactionParsed
}) => {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1 p-0.5">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-full flex-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-amber-500' : 'bg-slate-800'
                                }`}
                        />
                    ))}
                </div>

                <div className="p-8 md:p-10 flex flex-col items-center text-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col items-center"
                        >
                            <div className={`p-4 rounded-2xl ${step.bgColor} mb-6`}>
                                <Icon className={`w-10 h-10 ${step.color}`} />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-space">
                                {step.id === 'welcome' && userProfile?.displayName
                                    ? `Olá, ${userProfile.displayName}! 👋`
                                    : step.title}
                            </h2>

                            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8">
                                {step.description}
                            </p>

                            {step.id === 'first-entry' && (
                                <div className="w-full mb-8">
                                    <SmartInput
                                        onTransactionParsed={(data) => {
                                            onTransactionParsed(data);
                                            // Optional: auto-advance after success
                                            setTimeout(nextStep, 1500);
                                        }}
                                        categories={categories}
                                        currentDate={new Date()}
                                        transactions={transactions}
                                        budgetGoals={budgetGoals}
                                        monthlyStats={monthlyStats}
                                    />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex gap-4 w-full mt-auto">
                        {currentStep < steps.length - 1 && step.id !== 'first-entry' ? (
                            <button
                                onClick={nextStep}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-2xl transition-all group"
                            >
                                {currentStep === 0 ? 'Começar' : 'Continuar'}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            step.id !== 'first-entry' && (
                                <button
                                    onClick={onComplete}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-2xl transition-all"
                                >
                                    Finalizar Onboarding
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                            )
                        )}
                    </div>

                    {currentStep === 0 && (
                        <button
                            onClick={onComplete}
                            className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4"
                        >
                            Pular apresentação
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
