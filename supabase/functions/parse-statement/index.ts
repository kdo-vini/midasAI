import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface ParsedTransaction {
    date: string;
    description: string;
    value: number;
    category?: string;
    bank?: string;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { transactions, userId } = await req.json();

        if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
        if (!transactions || transactions.length === 0) throw new Error("No transactions provided");

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // Check usage limits
        const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));
        const { data: usage } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .single();

        let reportsThisMonth = 0;
        if (usage) {
            if (usage.last_reset_month === currentMonth) {
                reportsThisMonth = usage.reports_this_month;
            }
        }

        if (reportsThisMonth >= 10) {
            throw new Error("Limite de 10 relatórios/mês atingido");
        }

        // Prepare transactions for AI categorization
        const transactionDescriptions = transactions.map((t: ParsedTransaction, i: number) =>
            `${i + 1}. "${t.description}" (R$ ${Math.abs(t.value).toFixed(2)})`
        ).join('\n');

        const prompt = `Analise estas transações bancárias. Para cada uma, determine:
1. A CATEGORIA correta
2. Se é ENTRADA (dinheiro recebido) ou SAÍDA (dinheiro gasto)

TRANSAÇÕES:
${transactionDescriptions}

REGRAS IMPORTANTES:
- Pagamentos em lojas, restaurantes, serviços = SAÍDA
- Salário, freelance, PIX recebido, "pagamento recebido", vendas = ENTRADA
- Netflix, Spotify, assinaturas = SAÍDA
- Transferências enviadas = SAÍDA
- Na dúvida se é compra/pagamento = SAÍDA

CATEGORIAS:
- Alimentação (restaurantes, supermercado, delivery, ifood, padaria, lanchonete)
- Transporte (uber, gasolina, estacionamento, passagem)
- Moradia (aluguel, condomínio, luz, água, gás, internet)
- Lazer (netflix, spotify, cinema, viagem, bar)
- Compras (roupas, eletrônicos, presentes)
- Saúde (médico, farmácia, academia)
- Educação (cursos, livros, faculdade)
- Receitas (APENAS para entradas: salário, freelance, vendas, recebimentos)
- Outros (não se encaixa nas anteriores)

RESPONDA EM JSON:
{
  "items": [
    {"index": 1, "category": "Alimentação", "isIncome": false},
    {"index": 2, "category": "Receitas", "isIncome": true},
    ...
  ],
  "advice": "ANÁLISE COMPLETA EM FORMATO ESTRUTURADO (use \\n para quebras de linha):\\n\\n📊 RESUMO: [análise geral dos gastos]\\n\\n💡 OPORTUNIDADES DE ECONOMIA:\\n• [dica específica 1 baseada nos dados]\\n• [dica específica 2]\\n• [dica específica 3]\\n\\n⚠️ ATENÇÃO: [maior gasto ou categoria preocupante]\\n\\n✅ PRÓXIMOS PASSOS: [1-2 ações concretas para economizar]"
}`;

        // Call GPT-4o for better reasoning
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Você é um especialista em finanças pessoais. Analise transações bancárias, determine se são entradas ou saídas de dinheiro, e categorize. Responda apenas em JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            }),
        });

        const aiData = await response.json();
        if (aiData.error) throw new Error(aiData.error.message);

        const aiResult = JSON.parse(aiData.choices[0].message.content);
        const itemsData: { index: number; category: string; isIncome: boolean }[] = aiResult.items || [];
        const aiAdvice: string = aiResult.advice || '';

        // Apply categories and correct value signs based on AI analysis
        const categorizedTransactions = transactions.map((t: ParsedTransaction, i: number) => {
            const itemData = itemsData.find(item => item.index === i + 1);
            const isIncome = itemData?.isIncome ?? false;
            const category = itemData?.category || 'Outros';

            // Make value negative for expenses, positive for income
            let correctedValue = Math.abs(t.value);
            if (!isIncome) correctedValue = -correctedValue;

            return {
                ...t,
                value: correctedValue,
                category
            };
        });

        // Calculate totals
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryTotals: Record<string, number> = {};
        const banksSet = new Set<string>();

        categorizedTransactions.forEach((t: ParsedTransaction) => {
            if (t.value > 0) totalIncome += t.value;
            else totalExpense += t.value;

            const cat = t.category || 'Outros';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.value);

            if (t.bank) banksSet.add(t.bank);
        });

        // Determine period
        const dates = categorizedTransactions
            .map((t: ParsedTransaction) => new Date(t.date))
            .filter((d: Date) => !isNaN(d.getTime()))
            .sort((a: Date, b: Date) => a.getTime() - b.getTime());

        const periodStart = dates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
        const periodEnd = dates[dates.length - 1]?.toISOString().split('T')[0] || periodStart;

        // Save report
        const reportData = {
            user_id: userId,
            file_name: `Extrato_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`,
            period_start: periodStart,
            period_end: periodEnd,
            total_income: totalIncome,
            total_expense: totalExpense,
            categories: categoryTotals,
            transactions: categorizedTransactions,
            banks: Array.from(banksSet),
            ai_advice: aiAdvice
        };

        const { data: savedReport, error: saveError } = await supabase
            .from('statement_reports')
            .insert(reportData)
            .select()
            .single();

        if (saveError) throw saveError;

        // Update usage
        await supabase
            .from('user_usage')
            .upsert({
                user_id: userId,
                reports_this_month: reportsThisMonth + 1,
                last_reset_month: currentMonth
            });

        return new Response(
            JSON.stringify(savedReport),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
