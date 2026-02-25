import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { UserCategory, TransactionType } from '../types';
import { Transaction } from '../types';

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    categories: UserCategory[];
    onAdd: (name: string, type: 'INCOME' | 'EXPENSE') => void;
    onUpdate: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    transactions: Transaction[];
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
    isOpen,
    onClose,
    categories,
    onAdd,
    onUpdate,
    onDelete,
    transactions
}) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

    if (!isOpen) return null;

    const getCategoryUsageCount = (categoryName: string) => {
        return transactions.filter(t => t.category === categoryName).length;
    };

    const handleAdd = () => {
        if (!newCategoryName.trim()) return;

        if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase() && c.type === activeTab)) {
            alert('Já existe uma categoria com este nome');
            return;
        }

        onAdd(newCategoryName.trim(), activeTab);
        setNewCategoryName('');
    };

    const handleUpdate = (id: string) => {
        if (!editingName.trim()) return;

        if (categories.some(c => c.id !== id && c.name.toLowerCase() === editingName.trim().toLowerCase())) {
            alert('Já existe uma categoria com este nome');
            return;
        }

        onUpdate(id, editingName.trim());
        setEditingId(null);
        setEditingName('');
    };

    const handleDelete = (id: string, name: string) => {
        const usageCount = getCategoryUsageCount(name);

        if (usageCount > 0) {
            alert(`Esta categoria está sendo usada em ${usageCount} transações`);
            return;
        }

        if (confirm(`Tem certeza que deseja deletar "${name}"?`)) {
            onDelete(id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Gerenciar Categorias
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setActiveTab('EXPENSE')}
                            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'EXPENSE' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                        >
                            Gastos / Saídas
                        </button>
                        <button
                            onClick={() => setActiveTab('INCOME')}
                            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'INCOME' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                        >
                            Receitas / Entradas
                        </button>
                    </div>

                    {/* Add New Category */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Adicionar Nova Categoria
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder="Nome da categoria..."
                                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!newCategoryName.trim()}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Categories List */}
                    <div>
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Suas categorias ({categories.filter(c => c.type === activeTab).length})
                        </h3>
                        <div className="space-y-2">
                            {categories.filter(c => c.type === activeTab).map(category => {
                                const usageCount = getCategoryUsageCount(category.name);
                                const isEditing = editingId === category.id;

                                return (
                                    <div
                                        key={category.id}
                                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                                    >
                                        {isEditing ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleUpdate(category.id)}
                                                    className="flex-1 px-3 py-1 border border-indigo-300 dark:border-indigo-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleUpdate(category.id)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                                                >
                                                    Salvar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditingName('');
                                                    }}
                                                    className="px-3 py-1 bg-slate-400 hover:bg-slate-500 text-white rounded text-sm"
                                                >
                                                    Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                                            {category.name}
                                                        </span>
                                                        {category.isDefault && (
                                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                                                Padrão
                                                            </span>
                                                        )}
                                                    </div>
                                                    {usageCount > 0 && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            Usada em {usageCount} transações
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setEditingId(category.id);
                                                        setEditingName(category.name);
                                                    }}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(category.id, category.name)}
                                                    disabled={category.isDefault}
                                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title={category.isDefault ? 'Categorias padrão não podem ser deletadas' : 'Deletar'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-1">Dicas:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                                    <li>Categorias padrão podem ser renomeadas mas não deletadas</li>
                                    <li>Categorias em uso em transações não podem ser deletadas</li>
                                    <li>Adicione categorias personalizadas para melhor organização</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
