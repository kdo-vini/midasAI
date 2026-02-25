import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, History, ChevronRight, AlertCircle } from 'lucide-react';

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { parseStatementWithAI, StatementReport } from '../services/supabase';

interface ParsedTransaction {
    date: string;
    description: string;
    value: number;
    category?: string;
    bank?: string;
}

interface StatementImportProps {
    userId: string;
    reportsThisMonth: number;
    maxReports: number;
    previousReports: StatementReport[];
    onReportGenerated: (report: StatementReport) => void;
    onViewReport: (report: StatementReport) => void;
}

export const StatementImport: React.FC<StatementImportProps> = ({
    userId,
    reportsThisMonth,
    maxReports,
    previousReports,
    onReportGenerated,
    onViewReport
}) => {

    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Loading progress state
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');

    const loadingMessages = [
        '📄 Lendo arquivos...',
        '🔍 Identificando transações...',
        '🤖 IA analisando padrões...',
        '🏷️ Categorizando gastos...',
        '📊 Calculando totais...',
        '💡 Gerando conselhos...',
        '✨ Finalizando relatório...'
    ];

    // Rotate loading messages during processing
    React.useEffect(() => {
        if (!isProcessing) {
            setLoadingProgress(0);
            setLoadingMessage('');
            return;
        }

        let messageIndex = 0;
        let progress = 0;

        setLoadingMessage(loadingMessages[0]);

        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 2500);

        const progressInterval = setInterval(() => {
            progress = Math.min(progress + Math.random() * 8 + 2, 90);
            setLoadingProgress(progress);
        }, 400);

        return () => {
            clearInterval(messageInterval);
            clearInterval(progressInterval);
        };
    }, [isProcessing]);

    const canGenerateReport = reportsThisMonth < maxReports;

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
        ).slice(0, 2);
        if (droppedFiles.length > 0) {
            setFiles(droppedFiles);
            setError(null);
        } else {
            setError('Selecione arquivos CSV ou XLSX');
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []).slice(0, 2);
        if (selectedFiles.length > 0) {
            setFiles(selectedFiles);
            setError(null);
        }
    }, []);

    const parseFile = async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            if (file.name.endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data),
                    error: (err) => reject(err)
                });
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target?.result as ArrayBuffer);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                        // Get raw data as array of arrays to find header row
                        const rawRows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                        // Find header row - look for row containing "data", "valor", or "descrição"
                        let headerRowIndex = 0;
                        for (let i = 0; i < Math.min(20, rawRows.length); i++) {
                            const row = rawRows[i];
                            if (!row) continue;
                            const rowStr = row.map((c: any) => String(c || '').toLowerCase()).join(' ');
                            if (
                                (rowStr.includes('data') && (rowStr.includes('valor') || rowStr.includes('descrição') || rowStr.includes('descricao'))) ||
                                (rowStr.includes('transação') && rowStr.includes('valor'))
                            ) {
                                headerRowIndex = i;
                                console.log(`📍 Header encontrado na linha ${i + 1}:`, row);
                                break;
                            }
                        }

                        // Extract headers and data starting from detected row
                        const headers = rawRows[headerRowIndex] || [];
                        const dataRows = rawRows.slice(headerRowIndex + 1);

                        // Convert to objects with headers as keys
                        const jsonData = dataRows
                            .filter((row: any[]) => row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''))
                            .map((row: any[]) => {
                                const obj: Record<string, any> = {};
                                headers.forEach((header: any, idx: number) => {
                                    if (header) {
                                        obj[String(header)] = row[idx];
                                    }
                                });
                                return obj;
                            });

                        console.log(`📊 Excel parseado: ${jsonData.length} linhas de dados`);
                        resolve(jsonData);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        });
    };

    const normalizeTransactions = (rawData: any[]): ParsedTransaction[] => {
        if (rawData.length === 0) return [];

        // Log first row for debugging
        console.log('📊 Colunas encontradas:', Object.keys(rawData[0]));
        console.log('📄 Primeira linha:', rawData[0]);

        return rawData.map(row => {
            const keys = Object.keys(row);

            // Expanded date detection - Brazilian bank formats
            const dateKey = keys.find(k =>
                /data|date|dt|lançamento|lancamento|transação|transacao|movimento|vencimento/i.test(k)
            );

            // Expanded value detection - many variations
            const valueKey = keys.find(k =>
                /valor|value|amount|quantia|importância|importancia|saldo|credito|debito|crédito|débito|r\$|reais|montante/i.test(k)
            );

            // Expanded description detection
            const descKey = keys.find(k =>
                /descri|description|memo|histórico|historico|detalhe|observ|lançamento|lancamento|nome|titulo|título|origem|destino|favorecido|pagador|estabelecimento/i.test(k)
            );

            // Bank detection
            const bankKey = keys.find(k =>
                /banco|bank|instituição|instituicao|conta/i.test(k)
            );

            // Category detection  
            const categoryKey = keys.find(k =>
                /categoria|category|tipo|natureza|classificação|classificacao/i.test(k)
            );

            // Parse value - detect format and handle correctly
            let value = 0;
            if (valueKey) {
                const rawValue = row[valueKey];
                if (typeof rawValue === 'string') {
                    // Remove currency symbols and spaces
                    let cleaned = rawValue.replace(/[R$\s]/g, '').trim();
                    // Handle both negative formats: -100 or (100)
                    const isNegative = cleaned.startsWith('-') || cleaned.startsWith('(');
                    cleaned = cleaned.replace(/[()-]/g, '');

                    // Detect format: American (99.00) vs Brazilian (99,00)
                    // If ends with .XX (dot + 2 digits), it's American format
                    // If ends with ,XX (comma + 2 digits), it's Brazilian format
                    const americanMatch = cleaned.match(/\.\d{2}$/);
                    const brazilianMatch = cleaned.match(/,\d{2}$/);

                    if (americanMatch) {
                        // American format: 1,234.56 -> remove commas (thousand sep), keep dot (decimal)
                        cleaned = cleaned.replace(/,/g, '');
                    } else if (brazilianMatch) {
                        // Brazilian format: 1.234,56 -> remove dots (thousand sep), replace comma with dot
                        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                    } else {
                        // No clear decimal, try to parse as-is
                        // If has only dot, treat as decimal; if has only comma, treat as decimal
                        if (cleaned.includes(',') && !cleaned.includes('.')) {
                            cleaned = cleaned.replace(',', '.');
                        }
                    }

                    value = parseFloat(cleaned) || 0;
                    if (isNegative) value = -value;
                } else {
                    value = parseFloat(rawValue) || 0;
                }
            }

            // Get description - try multiple columns if primary not found
            let description = '';
            if (descKey) {
                description = String(row[descKey] || '').trim();
            } else {
                // Fallback: use the column with longest string value
                const stringCols = keys.filter(k => typeof row[k] === 'string' && row[k].length > 3);
                if (stringCols.length > 0) {
                    const longestCol = stringCols.reduce((a, b) =>
                        String(row[a]).length > String(row[b]).length ? a : b
                    );
                    description = String(row[longestCol]).trim();
                }
            }

            // Get date - try to parse various formats
            let date = '';
            if (dateKey) {
                date = String(row[dateKey] || '').trim();
            }

            return {
                date,
                description,
                value,
                bank: bankKey ? String(row[bankKey] || '').trim() : undefined,
                category: categoryKey ? String(row[categoryKey] || '').trim() : undefined
            };
        }).filter(t => {
            // More lenient filter: keep if we have at least description OR date, AND value != 0
            const hasContent = (t.description.length > 0 || t.date.length > 0) && t.value !== 0;
            return hasContent;
        });
    };

    const handleAnalyze = async () => {
        if (!canGenerateReport) {
            setError(`Você atingiu o limite de ${maxReports} relatórios este mês`);
            return;
        }

        if (files.length === 0) {
            setError('Selecione pelo menos um arquivo');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Parse all files
            const allTransactions: ParsedTransaction[] = [];
            for (const file of files) {
                const rawData = await parseFile(file);
                const normalized = normalizeTransactions(rawData);
                allTransactions.push(...normalized);
            }

            if (allTransactions.length === 0) {
                throw new Error('Nenhuma transação encontrada nos arquivos');
            }

            // Send to AI for categorization via Supabase Edge Function
            const report = await parseStatementWithAI(allTransactions, userId);
            onReportGenerated(report);
            setFiles([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                    Importar Extrato
                </h2>
                <p className="text-slate-400 mt-2">
                    Envie extratos CSV ou XLSX de qualquer banco
                </p>
            </div>

            {/* Usage Counter */}
            <div className="flex justify-center">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${canGenerateReport
                    ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
                    : 'bg-red-900/30 text-red-400 border border-red-800'
                    }`}>
                    {reportsThisMonth}/{maxReports} relatórios este mês
                </div>
            </div>

            {/* Upload Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
          ${isDragging
                        ? 'border-emerald-400 bg-emerald-900/20'
                        : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
                    }
          ${!canGenerateReport ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-emerald-400' : 'text-slate-500'}`} />

                {files.length > 0 ? (
                    <div className="space-y-2">
                        {files.map((f, i) => (
                            <div key={i} className="text-emerald-400 font-medium">
                                📄 {f.name}
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <p className="text-slate-300 font-medium">
                            Clique ou arraste arquivos aqui
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                            CSV ou XLSX • Máximo 2 arquivos
                        </p>
                    </>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading Progress Bar */}
            {isProcessing && (
                <div className="bg-slate-800/80 border border-emerald-800/50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                        <span className="text-slate-200 font-medium animate-pulse">
                            {loadingMessage}
                        </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                    <p className="text-center text-slate-500 text-sm">
                        Isso pode levar alguns segundos...
                    </p>
                </div>
            )}

            {/* Analyze Button */}
            {!isProcessing && (
                <button
                    onClick={handleAnalyze}
                    disabled={files.length === 0 || !canGenerateReport}
                    className={`
                        w-full py-4 rounded-xl font-semibold text-lg transition-all
                        ${files.length === 0 || !canGenerateReport
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                        }
                    `}
                >
                    Analisar Gastos
                </button>
            )}

            {/* Previous Reports */}
            {previousReports.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
                        <History className="w-5 h-5 text-slate-400" />
                        Relatórios Anteriores
                    </h3>
                    <div className="space-y-2">
                        {previousReports.slice(0, 5).map(report => (
                            <button
                                key={report.id}
                                onClick={() => onViewReport(report)}
                                className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
                            >
                                <div className="text-left">
                                    <p className="text-slate-200 font-medium">{report.file_name}</p>
                                    <p className="text-slate-500 text-sm">
                                        {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
