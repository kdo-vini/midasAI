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
        const { prompt, type, transactions, budgetGoals, availableCategories, referenceDate, language, monthlyStats, previousMessages } = await req.json();

        if (!OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set");
        }

        const modelId = "gpt-4o-mini";
        let messages = [];
        let responseFormat = null;
        const targetLang = language === 'en' ? 'English' : 'Portuguese';

        // Build financial context if available
        let financialContext = "";
        if (transactions && transactions.length > 0 && budgetGoals && budgetGoals.length > 0 && monthlyStats) {
            const dayOfMonth = referenceDate ? new Date(referenceDate).getDate() : new Date().getDate();

            // Calculate spending per category
            const categorySpending: Record<string, number> = {};
            transactions.forEach((t: any) => {
                if (t.type === 'EXPENSE') {
                    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
                }
            });

            // Build budget status
            const budgetStatus = budgetGoals.map((goal: any) => {
                const spent = categorySpending[goal.category] || 0;
                const budgetAmount = (monthlyStats.totalIncome * goal.targetPercentage) / 100;
                const usagePercent = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
                return `${goal.category}: spent ${spent.toFixed(2)} of ${budgetAmount.toFixed(2)} budget (${usagePercent}% used)`;
            }).join("; ");

            financialContext = `
      FINANCIAL CONTEXT (use this to answer questions about spending/budget):
      - Day of month: ${dayOfMonth} (1-10 = beginning, 11-20 = middle, 21-31 = end)
      - Total income this month: ${monthlyStats.totalIncome}
      - Total expenses this month: ${monthlyStats.totalExpense}
      - Balance: ${monthlyStats.balance}
      - Budget status by category: ${budgetStatus}
      
      SMART ADVICE PROTOCOL:
      
      STEP 1: CHECK FOR SPECIFIC AMOUNT IN USER INPUT
      - Does the user say "spend 500", "buy X for 200", etc?
      - IF YES:
        1. Identify the category (e.g., "comida" -> "Alimentação").
        2. Find the budget limit for that category in the context above.
        3. Calculate: (Current Spent) + (Requested Amount) = (New Total).
        4. COMPARE: Is (New Total) > (Budget Limit)?
           - YES: YOU MUST SAY NO. "Não recomendo." Explain that [Current] + [New] = [Total], which is greater than the limit.
           - NO: Proceed to STEP 2.
      
      STEP 2: CHECK BUDGET USAGE PERCENTAGE (Only if Step 1 passed or no amount specified)
      - 0-30% used: ENTHUSIASTICALLY APPROVE! "Pode sim!", "Tranquilo!".
      - 31-60% used: APPROVE with a friendly note.
      - 61-80% used: APPROVE but mention caution.
      - 81-99% used: CAUTION - close to limit.
      - 100%+ used: ADVISE AGAINST.
      
      STEP 3: DAY OF MONTH CONTEXT
      - Use only to support the advice from Step 1/2.
      
      CRITICAL: DO NOT approve a specific amount if it exceeds the budget, even if the current spending is 0%. Math trumps feelings.
      
      TONE: Helpful, direct, but strict on math.`;
        }


        if (type === 'parse') {
            const refDate = referenceDate ? new Date(referenceDate) : new Date();
            const currentDate = refDate.toISOString().split('T')[0];
            const categoriesStr = availableCategories.join(", ");

            const systemPrompt = `
      Analyze the text. Today is ${currentDate}.
      
      1. DETERMINE GOAL:
         - If it's a transaction (spending/receiving money), set isTransaction: true.
         - If it's a question about whether they CAN spend, budget advice, or any other question, set isTransaction: false.
  
      2. IF TRANSACTION (isTransaction: true):
         - Extract amount, description, type, and date.
         - CHECK FOR INSTALLMENTS: Look for patterns like "em X vezes", "X parcelas", "10x", "12x", "parcelado em X" (or English equivalents like "in 10 installments"). 
           Examples: 
           - "1200 em 10x" -> amount: 1200, installments: 10.
           - "Compra de 500 parcelado em 5 vezes" -> amount: 500, installments: 5.
           - "300 no crédito em 3x" -> amount: 300, installments: 3.
           If found, set "installments" to that integer. Default is 1.
         - CATEGORY MATCHING: Map to one of: [${categoriesStr}].
           * SPECIAL RULE: If text contains "guardar", "investir", "poupança", "reserva", "aplicação", map to "Economias".
         - "message": A short, friendly confirmation in ${targetLang}. If installments > 1, mention it.
  
      3. IF NOT TRANSACTION (isTransaction: false):
         - Use the FINANCIAL CONTEXT below to give personalized, data-driven advice.
         - "message": Answer the user's question with specific budget data in ${targetLang}. Be helpful, concise, and friendly.
         - If asking "Can I spend X on Y?", check the relevant category budget and day of month.
         - Leave amount, description, category, type, date as null/undefined.
      ${financialContext}
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
                    message: { type: "string", description: "If isTransaction is FALSE, answer the user's question here with budget data. If TRUE, provide a short confirmation." }
                },
                required: ["isTransaction", "amount", "description", "category", "type", "date", "installments", "message"],
                additionalProperties: false
            };

            messages = [
                { role: "system", content: "You are a smart personal financial assistant. You help users track expenses AND give budget-aware advice. Output JSON only." },
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

        } else if (type === 'chat') {
            const currentDate = new Date().toISOString().split('T')[0];
            const history = previousMessages || []; // Use destructured variable

            const systemPrompt = `
      You are Midas, a helpful and friendly financial assistant. 
      Today is ${currentDate}.
      Language: ${targetLang}.
      
      RESPONSE STYLE:
      - **BE CONCISE**: Answer in 1-2 sentences by default. Be direct and friendly.
      - **ONLY explain details** if the user explicitly asks "why?", "how?", "explain", or similar follow-up questions.
      - Use simple, conversational language. Avoid jargon unless asked.
      - Use **bold** for key numbers or amounts (e.g., **R$ 50**).
      
      CATEGORY MAPPING (use this to identify which budget to check):
      - **Alimentação**: comida, doces, lanche, almoço, jantar, café, restaurante, supermercado, feira, padaria, ifood, delivery
      - **Transporte**: uber, 99, gasolina, combustível, estacionamento, ônibus, metrô, passagem
      - **Lazer**: cinema, netflix, spotify, viagem, festa, bar, show, jogo
      - **Compras**: roupa, sapato, eletrônico, celular, presente, objeto, coisa (generic purchases)
      - **Saúde**: médico, remédio, farmácia, academia, psicólogo
      - **Moradia**: aluguel, condomínio, luz, água, gás, internet
      - **Educação**: curso, livro, faculdade, escola
      - If unsure which category, ASK the user: "Isso seria Alimentação ou Compras?"
      
      YOUR KNOWLEDGE:
      ${financialContext}
      
      EXAMPLES:
      User: "posso gastar 50 com doces?"
      Good: "Pode sim! Você tem **R$ 238** livres em Alimentação. 👍"
      
      User: "posso comprar uma camisa de 100?"
      Good: "Pode! Ainda sobram **R$ 150** em Compras."
            `;

            messages = [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: prompt }
            ];

            // No responseFormat needed (defaults to text)

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

        // --- COMMON: Call OpenAI API ---
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
