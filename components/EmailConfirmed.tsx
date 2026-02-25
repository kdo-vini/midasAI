import React from 'react';
import { CheckCircle } from 'lucide-react';

interface EmailConfirmedProps {
    onContinue: () => void;
}

export const EmailConfirmed: React.FC<EmailConfirmedProps> = ({ onContinue }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Email Confirmado!
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Sua conta foi verificada com sucesso. Você já pode acessar a plataforma.
                </p>
                <button
                    onClick={onContinue}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                    Continuar para o Login
                </button>
            </div>
        </div>
    );
};
