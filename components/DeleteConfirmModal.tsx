import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteSingle: () => void;
    onDeleteAll: () => void;
    installmentInfo: string; // e.g., "Carro (5/30)"
    totalInstallments?: number; // Total count in series
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onDeleteSingle,
    onDeleteAll,
    installmentInfo,
    totalInstallments
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {t('deleteModal.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        {t('deleteModal.subtitle')}: <strong>{installmentInfo}</strong>
                    </p>

                    <div className="space-y-3">
                        {/* Delete Single Button */}
                        <button
                            onClick={() => {
                                onDeleteSingle();
                                onClose();
                            }}
                            className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('deleteModal.deleteSingle')}
                        </button>

                        {/* Delete All Button */}
                        <button
                            onClick={() => {
                                onDeleteAll();
                                onClose();
                            }}
                            className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            {totalInstallments
                                ? t('deleteModal.deleteAllCount', { count: totalInstallments })
                                : t('deleteModal.deleteAll')}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        {t('deleteModal.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};
