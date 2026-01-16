import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingDown, TrendingUp, Lightbulb, ChevronDown, ChevronUp, Wallet, Receipt } from 'lucide-react';

interface ParsedTransaction {
    date: string;
    description: string;
    value: number;
    category?: string;
    bank?: string;
}

interface StatementReport {
    id: string;
    file_name: string;
    period_start: string;
    period_end: string;
    total_income: number;
    total_expense: number;
    categories: Record<string, number>;
    transactions: ParsedTransaction[];
    banks: string[];
    ai_advice: string;
    created_at: string;
}

interface StatementReportViewProps {
    report: StatementReport;
    onBack: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const StatementReportView: React.FC<StatementReportViewProps> = ({ report, onBack }) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Separate income and expenses
    const incomeTransactions = report.transactions.filter(t => t.value > 0);
    const expenseTransactions = report.transactions.filter(t => t.value < 0);

    // Category data for expenses only
    const categoryData = Object.entries(report.categories)
        .filter(([name]) => name !== 'Receitas')
        .map(([name, value]) => ({ name, value: Math.abs(value) }))
        .sort((a, b) => b.value - a.value);

    // Top expenses
    const topExpenses = expenseTransactions
        .sort((a, b) => a.value - b.value)
        .slice(0, 5)
        .map(t => ({ name: t.description.slice(0, 18), value: Math.abs(t.value) }));

    // Group transactions by category
    const transactionsByCategory: Record<string, ParsedTransaction[]> = {};
    expenseTransactions.forEach(t => {
        const cat = t.category || 'Outros';
        if (!transactionsByCategory[cat]) transactionsByCategory[cat] = [];
        transactionsByCategory[cat].push(t);
    });

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-100">{report.file_name}</h2>
                    <p className="text-slate-500 text-sm">
                        {new Date(report.created_at).toLocaleDateString('pt-BR', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            {/* ========================== */}
            {/* SEÇÃO: ENTRADAS & RECEITAS */}
            {/* ========================== */}
            {incomeTransactions.length > 0 && (
                <div className="bg-emerald-900/10 border border-emerald-800/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                            <Wallet className="w-5 h-5" />
                            Entradas & Receitas
                        </h3>
                        <span className="text-emerald-400 text-sm font-medium">
                            {incomeTransactions.length} {incomeTransactions.length === 1 ? 'entrada' : 'entradas'}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {incomeTransactions.map((t, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-emerald-800/30 last:border-0">
                                <div>
                                    <p className="text-slate-200 font-medium">{t.description}</p>
                                    <p className="text-slate-500 text-sm">{t.date}</p>
                                </div>
                                <span className="text-emerald-400 font-bold text-lg">
                                    {formatCurrency(t.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-800/50 flex justify-between">
                        <span className="text-emerald-300 font-medium">Total Entradas</span>
                        <span className="text-emerald-400 font-bold text-xl">{formatCurrency(report.total_income)}</span>
                    </div>
                </div>
            )}

            {/* ======================== */}
            {/* SEÇÃO: SAÍDAS & GASTOS */}
            {/* ======================== */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Saídas & Gastos
                </h3>

                {/* Charts Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Pie Chart */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <h4 className="text-slate-300 font-semibold mb-3 text-sm">📊 Distribuição por Categoria</h4>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value) || 0)}
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-500 text-center py-8">Sem dados</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {categoryData.slice(0, 5).map((cat, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS[i] + '25', color: COLORS[i] }}>
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Bar Chart - Top Gastos */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <h4 className="text-slate-300 font-semibold mb-3 text-sm">🔥 Top Gastos</h4>
                        {topExpenses.length > 0 ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={topExpenses} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={75} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value) || 0)}
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" fill="#ef4444" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-500 text-center py-8">Sem dados</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ==================== */}
            {/* SEÇÃO: RESUMO GERAL */}
            {/* ==================== */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-slate-200 font-semibold flex items-center gap-2">
                        📋 Resumo Geral
                    </h3>
                    <span className="text-slate-500 text-sm">{categoryData.length} categorias</span>
                </div>
                <div className="divide-y divide-slate-700/50">
                    {categoryData.map((cat, i) => {
                        const catTransactions = transactionsByCategory[cat.name] || [];
                        const isExpanded = expandedCategory === cat.name;

                        return (
                            <div key={i}>
                                <button
                                    onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <div className="text-left">
                                            <p className="text-slate-200 font-medium">{cat.name}</p>
                                            <p className="text-slate-500 text-sm">
                                                {catTransactions.length} transaç{catTransactions.length === 1 ? 'ão' : 'ões'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-red-400 font-bold">{formatCurrency(-cat.value)}</span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && catTransactions.length > 0 && (
                                    <div className="bg-slate-900/50 border-t border-slate-700/50 p-4">
                                        <div className="space-y-2">
                                            {catTransactions.map((t, j) => (
                                                <div key={j} className="flex justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-500">{t.date}</span>
                                                        <span className="text-slate-300">{t.description}</span>
                                                    </div>
                                                    <span className="text-red-400 font-medium">{formatCurrency(t.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Total Footer */}
                <div className="p-4 bg-red-900/20 border-t border-red-800/50 flex justify-between">
                    <span className="text-red-300 font-semibold">Total Gastos</span>
                    <span className="text-red-400 font-bold text-xl">{formatCurrency(Math.abs(report.total_expense))}</span>
                </div>
            </div>

            {/* ======================== */}
            {/* SEÇÃO: CONSELHO DA IA */}
            {/* ======================== */}
            {report.ai_advice && (
                <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-800/50 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                        <Lightbulb className="w-5 h-5" />
                        <span className="font-bold">Conselho do Analista</span>
                    </div>
                    <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                        {report.ai_advice}
                    </div>
                </div>
            )}

            {/* Balance Summary */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                <span className="text-slate-300 font-medium">Saldo do Período</span>
                <span className={`text-2xl font-bold ${report.total_income + report.total_expense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(report.total_income + report.total_expense)}
                </span>
            </div>
        </div>
    );
};
