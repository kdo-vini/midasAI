import { supabase } from "./supabase";
import { AIParsedTransaction } from "../types";

export const parseTransactionFromText = async (text: string, availableCategories: string[]): Promise<AIParsedTransaction> => {
    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                type: 'parse',
                prompt: text,
                availableCategories
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

export const generateInsights = async (transactions: any[], budgetGoals: any[]): Promise<string> => {
    if (transactions.length === 0) return "Adicione transações para receber insights personalizados.";

    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                type: 'insight',
                transactions: transactions.slice(0, 10), // Limit to last 10 for performance
                budgetGoals
            }
        });

        if (error) throw error;

        return data?.content || "Sem insights no momento.";
    } catch (error) {
        console.error("AI Insight Error:", error);
        return "Não foi possível gerar insights agora.";
    }
};
