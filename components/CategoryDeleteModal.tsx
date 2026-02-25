import React, { useState } from 'react';
import { X, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import { UserCategory } from '../types';

interface CategoryDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoryName: string;
    categoryId: string | null;
    usageCount: number;
    usageCountCurrentMonth: number;
    availableCategories: UserCategory[];
    onReassign: (oldName: string, newName: string) => void;
    onDeleteAll: () => void;
}

export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
    isOpen,
    onClose,
    categoryName,
    categoryId,
    usageCount,
    usageCountCurrentMonth,
    availableCategories,
    onReassign,
    onDeleteAll
}) => {
    const [selectedReassign, setSelectedReassign] = useState('');
    const [confirmText, setConfirmText] = useState('');

    if (!isOpen) return null;

    // Filter out the category being deleted
    const reassignOptions = availableCategories.filter(
        c => c.name.toLowerCase() !== categoryName.toLowerCase()
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Excluir Categoria
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <p className="text-slate-600 dark:text-slate-300">
                        A categoria <strong className="text-slate-900 dark:text-white">"{categoryName}"</strong> está sendo usada em <strong className="text-amber-600 dark:text-amber-400">{usageCount} transações</strong> ({usageCountCurrentMonth} neste mês).
                        O que você deseja fazer?
                    </p>

                    <div className="space-y-4">
                        {/* Option 1: Reassign */}
                        <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-white dark:bg-slate-800">
                            <h3 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                                <ArrowRight className="w-4 h-4 text-indigo-500" />
                                Reatribuir e Excluir (Recomendado)
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Mantém o histórico intacto. As transações serão movidas para outra categoria oficial.
                            </p>

                            <div className="flex gap-2">
                                <select
                                    value={selectedReassign}
                                    onChange={(e) => setSelectedReassign(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                >
                                    <option value="" disabled>Selecione o destino...</option>
                                    {reassignOptions.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => {
                                        if (selectedReassign) {
                                            onReassign(categoryName, selectedReassign);
                                            onClose();
                                        }
                                    }}
                                    disabled={!selectedReassign}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Mover e Excluir
                                </button>
                            </div>
                        </div>

                        {/* Option 2: Cascading Delete */}
                        <div className="border border-red-200 dark:border-red-900/50 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
                            <h3 className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                                <Trash2 className="w-4 h-4" />
                                Excluir Permanentemente
                            </h3>
                            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                                Esta ação <strong>apagará a categoria e todas as suas {usageCount} transações</strong> do banco de dados de uma só vez, alterando os relatórios.
                            </p>

                            <div className="space-y-3">
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Para confirmar a exclusão cascata, digite <strong>DELETAR</strong>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="DELETAR"
                                        className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:outline-none text-sm font-mono uppercase"
                                    />
                                    <button
                                        onClick={() => {
                                            if (confirmText.toUpperCase() === 'DELETAR') {
                                                onDeleteAll();
                                                onClose();
                                            }
                                        }}
                                        disabled={confirmText.toUpperCase() !== 'DELETAR'}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:dark:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                    >
                                        Excluir Tudo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
