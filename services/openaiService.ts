import { supabase } from "./supabase";
import { AIParsedTransaction, Transaction, BudgetGoal, MonthlyStats } from "../types";

export const parseTransactionFromText = async (
    text: string,
    availableCategories: string[],
    referenceDate?: Date,
    language: string = 'pt',
    transactions?: Transaction[],
    budgetGoals?: BudgetGoal[],
    monthlyStats?: MonthlyStats
): Promise<AIParsedTransaction> => {
    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                type: 'parse',
                prompt: text,
                availableCategories,
                referenceDate: referenceDate ? referenceDate.toISOString() : undefined,
                language,
                transactions: transactions || [],
                budgetGoals: budgetGoals || [],
                monthlyStats: monthlyStats || null
            }
        });

        if (error) throw error;
        if (!data?.content) throw new Error("No response from AI");

        return JSON.parse(data.content) as AIParsedTransaction;
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

export const generateInsights = async (transactions: any[], budgetGoals: any[], language: string = 'pt'): Promise<string> => {
    if (transactions.length === 0) return "Adicione transações para receber insights personalizados.";

    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                type: 'insight',
                transactions: transactions.slice(0, 10),
                budgetGoals,
                language
            }
        });

        if (error) throw error;

        return data?.content || "Sem insights no momento.";
    } catch (error) {
        console.error("AI Insight Error:", error);
        return "Não foi possível gerar insights agora.";
    }
};

export const sendChatMessage = async (
    message: string,
    history: { role: string, content: string }[],
    transactions: Transaction[],
    budgetGoals: BudgetGoal[],
    monthlyStats: MonthlyStats,
    language: string = 'pt'
): Promise<string> => {
    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                type: 'chat',
                prompt: message,
                previousMessages: history,
                transactions,
                budgetGoals,
                monthlyStats,
                language
            }
        });

        if (error) throw error;
        return data?.content || "No response";
    } catch (error) {
        console.error("Chat Error:", error);
        throw error;
    }
};
