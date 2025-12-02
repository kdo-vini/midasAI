import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from Functions!");

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { prompt, type, transactions, budgetGoals, availableCategories, referenceDate, language } = await req.json();

        if (!OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set");
        }

        const modelId = "gpt-4o-mini";
        let messages = [];
        let responseFormat = null;
        const targetLang = language === 'en' ? 'English' : 'Portuguese';

        if (type === 'parse') {
            const currentDate = referenceDate ? new Date(referenceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const categoriesStr = availableCategories.join(", ");

            const systemPrompt = `
      Analyze the text. Today is ${currentDate}.
      
      1. DETERMINE GOAL:
         - If it's a transaction (spending/receiving money), set isTransaction: true.
         - If it's a question, advice request, or random chat, set isTransaction: false.
  
      2. IF TRANSACTION (isTransaction: true):
         - Extract amount, description, type, and date.
         - CHECK FOR INSTALLMENTS: Look for patterns like "em X vezes", "X parcelas", "10x", "12x", "parcelado em X" (or English equivalents like "in 10 installments"). 
           Examples: 
           - "1200 em 10x" -> amount: 1200, installments: 10.
           - "Compra de 500 parcelado em 5 vezes" -> amount: 500, installments: 5.
           - "300 no crédito em 3x" -> amount: 300, installments: 3.
           If found, set "installments" to that integer. Default is 1.
         - CATEGORY MATCHING: Map to one of: [${categoriesStr}].
         - "message": A short, friendly confirmation in ${targetLang}. If installments > 1, mention it.
  
      3. IF NOT TRANSACTION (isTransaction: false):
         - "message": Answer the user's question or provide the requested advice in ${targetLang}. Be helpful, concise, and friendly.
         - Leave amount, description, category, type, date as null/undefined.
      `;

            const transactionSchema = {
                type: "object",
                properties: {
                    isTransaction: { type: "boolean", description: "Set to TRUE if the input is a financial transaction (spending/receiving). Set to FALSE if it's a question, random talk, or advice request." },
                    amount: { type: ["number", "null"], description: "The monetary value (if transaction)." },
                    description: { type: ["string", "null"], description: "Short title (if transaction)." },
                    category: { type: ["string", "null"], description: "Must be one of the provided allowed categories (if transaction)." },
                    type: { type: ["string", "null"], enum: ["INCOME", "EXPENSE", null], description: "Type of transaction." },
                    date: { type: ["string", "null"], description: "ISO date string (YYYY-MM-DD)." },
                    installments: { type: ["integer", "null"], description: "Number of installments if specified (e.g. 10 for '10x'). Default to 1 or null if not specified." },
                    message: { type: "string", description: "If isTransaction is FALSE, answer the user's question here. If TRUE, provide a short confirmation or insight." }
                },
                required: ["isTransaction", "amount", "description", "category", "type", "date", "installments", "message"],
                additionalProperties: false
            };

            messages = [
                { role: "system", content: "You are a helpful financial assistant. Output JSON only." },
                { role: "user", content: `${systemPrompt}\nInput: "${prompt}"` }
            ];

            responseFormat = {
                type: "json_schema",
                json_schema: {
                    name: "transaction_schema",
                    schema: transactionSchema,
                    strict: true
                }
            };

        } else if (type === 'insight') {
            const insightPrompt = `
      Analyze these financial records and provide 1 single, valuable insight or tip (max 2 sentences).
      Focus on: overspending, saving opportunities, or budget adherence.
      Be encouraging but direct. Language: ${targetLang}.
  
      Transactions (last 10): ${JSON.stringify(transactions)}
      Budgets: ${JSON.stringify(budgetGoals)}
      `;

            messages = [
                { role: "system", content: "You are a financial advisor. Output plain text." },
                { role: "user", content: insightPrompt }
            ];
        } else {
            throw new Error("Invalid request type");
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelId,
                messages: messages,
                response_format: responseFormat
            }),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const content = data.choices[0].message.content;

        return new Response(
            JSON.stringify({ content }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});
