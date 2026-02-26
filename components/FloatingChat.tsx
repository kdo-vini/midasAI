import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/openaiService';
import { Transaction, BudgetGoal, MonthlyStats } from '../types';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface FloatingChatProps {
    transactions: Transaction[];
    budgetGoals: BudgetGoal[];
    monthlyStats: MonthlyStats;
    startOnboarding?: boolean;
    onOnboardingComplete?: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ transactions, budgetGoals, monthlyStats, startOnboarding, onOnboardingComplete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const onboardingTriggered = useRef(false);

    useEffect(() => {
        if (startOnboarding && !onboardingTriggered.current) {
            onboardingTriggered.current = true;
            setIsOpen(true);
            setMessages([
                {
                    role: 'assistant',
                    content: 'Olá! Sou o **Midas**, sua IA financeira pessoal. Parabéns por dar o primeiro passo para organizar suas finanças!\n\nEstou aqui para analisar seus gastos reais, categorizar tudo de forma automática, ler os extratos que você enviar e tirar qualquer dúvida sua.\n\nO que acha de começarmos adicionando sua primeira transação financeira?'
                }
            ]);
        }
    }, [startOnboarding]);

    const completeOnboarding = () => {
        if (startOnboarding && onOnboardingComplete) {
            onOnboardingComplete();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        completeOnboarding();

        try {
            const apiHistory = messages.map(m => ({ role: m.role, content: m.content }));

            const response = await sendChatMessage(
                userMessage,
                apiHistory,
                transactions,
                budgetGoals,
                monthlyStats,
                'pt'
            );

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            toast.error("Erro ao enviar mensagem.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto fixed inset-0 z-[101] md:inset-auto md:relative md:w-[350px] md:h-[500px] bg-[#0A0A0A] md:border md:border-[#222] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
                    {/* Header */}
                    <div className="p-4 border-b border-[#222] bg-[#111] flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#FFD700]/10 rounded-lg">
                                <Sparkles className="w-4 h-4 text-[#FFD700]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-100 font-space">Midas Chat</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] text-slate-400">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                completeOnboarding();
                            }}
                            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0A] scrollbar-thin scrollbar-thumb-[#222]">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-6">
                                <Sparkles className="w-8 h-8 text-slate-500 mb-3" />
                                <p className="text-sm text-slate-400">
                                    Olá! Sou seu assistente financeiro. Pergunte sobre seus gastos, investimentos ou peça dicas de economia.
                                </p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-xs font-bold text-[#FFD700]">M</span>
                                    </div>
                                )}

                                <div
                                    className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-[#1a1a1a] text-slate-200 rounded-tr-none border border-[#333]'
                                        : 'bg-[#FFD700]/10 text-slate-200 rounded-tl-none border border-[#FFD700]/20'
                                        }`}
                                >
                                    <div className="[&_strong]:text-[#FFD700] [&_strong]:font-semibold [&_p]:my-0.5">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>

                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center flex-shrink-0 mt-1">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-xs font-bold text-[#FFD700]">M</span>
                                </div>
                                <div className="bg-[#FFD700]/5 rounded-2xl rounded-tl-none p-3 border border-[#FFD700]/10 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                    <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#111] border-t border-[#222]">
                        <form onSubmit={handleSend} className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                className="flex-1 bg-[#050505] border border-[#222] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-3 rounded-xl bg-[#FFD700] hover:bg-[#FFD700]/90 text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Button (FAB) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group relative ${isOpen
                    ? 'bg-[#1a1a1a] text-slate-400 rotate-90'
                    : 'bg-[#FFD700] text-black hover:shadow-[#FFD700]/20'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6 fill-black/10" />}
            </button>
        </div>
    );
};
