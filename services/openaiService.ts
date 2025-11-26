import OpenAI from 'openai';
import { AIParsedTransaction } from "../types";

// Initialize OpenAI Client
// Danger: dangerouslyAllowBrowser: true is needed for client-side usage in Vite, 
// but in production this should be backend-proxied.
// Initialize OpenAI Client lazily to prevent crash on load if key is missing
let openai: OpenAI | null = null;

const getClient = () => {
    if (!openai) {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            console.error("VITE_OPENAI_API_KEY is missing in .env");
            throw new Error("OpenAI API Key is missing. Please check your .env file.");
        }
        openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }
    return openai;
};

const modelId = "gpt-4o-mini";

const transactionSchema = {
    type: "object",
    properties: {
        isTransaction: { type: "boolean", description: "Set to TRUE if the input is a financial transaction (spending/receiving). Set to FALSE if it's a question, random talk, or advice request." },
        amount: { type: ["number", "null"], description: "The monetary value (if transaction)." },
        description: { type: ["string", "null"], description: "Short title (if transaction)." },
        category: { type: ["string", "null"], description: "Must be one of the provided allowed categories (if transaction)." },
        type: { type: ["string", "null"], enum: ["INCOME", "EXPENSE", null], description: "Type of transaction." },
        date: { type: ["string", "null"], description: "ISO date string (YYYY-MM-DD)." },
        message: { type: "string", description: "If isTransaction is FALSE, answer the user's question here. If TRUE, provide a short confirmation or insight." }
    },
    required: ["isTransaction", "amount", "description", "category", "type", "date", "message"],
    additionalProperties: false
};

export const parseTransactionFromText = async (text: string, availableCategories: string[]): Promise<AIParsedTransaction> => {
    const currentDate = new Date().toISOString().split('T')[0];
    const categoriesStr = availableCategories.join(", ");

    const prompt = `
    Analyze the Portuguese text. Today is ${currentDate}.
    
    1. DETERMINE GOAL:
       - If it's a transaction (spending/receiving money), set isTransaction: true.
       - If it's a question, advice request, or random chat, set isTransaction: false.

    2. IF TRANSACTION (isTransaction: true):
       - Extract amount, description, type, and date.
       - CATEGORY MATCHING: Map to one of: [${categoriesStr}].
       - "message": A short, friendly confirmation (e.g., "Entendido, R$ 50 em Alimentação.").

    3. IF NOT TRANSACTION (isTransaction: false):
       - "message": Answer the user's question or provide the requested advice. Be helpful, concise, and friendly.
       - Leave amount, description, category, type, date as null/undefined.

    Input: "${text}"
  `;

    try {
        const client = getClient();
        const response = await client.chat.completions.create({
            model: modelId,
            messages: [
                { role: "system", content: "You are a helpful financial assistant. Output JSON only." },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "transaction_schema",
                    schema: transactionSchema,
                    strict: true
                }
            }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No response from AI");

        return JSON.parse(content) as AIParsedTransaction;
    } catch (error) {
        console.error("OpenAI Text Error:", error);
        throw error;
    }
};

export const generateInsights = async (transactions: any[], budgetGoals: any[]): Promise<string> => {
    if (transactions.length === 0) return "Adicione transações para receber insights personalizados.";

    const prompt = `
    Analyze these financial records and provide 1 single, valuable insight or tip (max 2 sentences).
    Focus on: overspending, saving opportunities, or budget adherence.
    Be encouraging but direct. Language: Portuguese.

    Transactions (last 10): ${JSON.stringify(transactions.slice(0, 10))}
    Budgets: ${JSON.stringify(budgetGoals)}
  `;

    try {
        const client = getClient();
        const response = await client.chat.completions.create({
            model: modelId,
            messages: [
                { role: "system", content: "You are a financial advisor. Output plain text." },
                { role: "user", content: prompt }
            ]
        });

        return response.choices[0].message.content || "Sem insights no momento.";
    } catch (error) {
        console.error("OpenAI Insight Error:", error);
        return "Não foi possível gerar insights agora.";
    }
};
