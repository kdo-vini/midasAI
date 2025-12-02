import { supabase } from "./supabase";
import { AIParsedTransaction } from "../types";

export const parseTransactionFromText = async (text: string, availableCategories: string[], referenceDate?: Date, language: string = 'pt'): Promise<AIParsedTransaction> => {
    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                type: 'parse',
                prompt: text,
                availableCategories,
                referenceDate: referenceDate ? referenceDate.toISOString() : undefined,
                language
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
    if (transactions.length === 0) return language === 'pt' ? "Adicione transações para receber insights personalizados." : "Add transactions to receive personalized insights.";

    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                type: 'insight',
                transactions: transactions.slice(0, 10), // Limit to last 10 for performance
                budgetGoals,
                language
            }
        });

        if (error) throw error;

        return data?.content || (language === 'pt' ? "Sem insights no momento." : "No insights at the moment.");
    } catch (error) {
        console.error("AI Insight Error:", error);
        return language === 'pt' ? "Não foi possível gerar insights agora." : "Could not generate insights right now.";
    }
};
