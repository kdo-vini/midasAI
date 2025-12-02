import React from 'react';
import { X, Shield, Lock, Eye, Server } from 'lucide-react';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Política de Privacidade</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Última atualização: 02 de Dezembro de 2025</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">

                    <p>
                        A sua privacidade é fundamental para nós. Esta Política de Privacidade descreve como o <strong>Midas AI</strong> coleta, usa, armazena e protege as informações pessoais e financeiras que você nos fornece.
                    </p>

                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-indigo-500" />
                            1. Dados que Coletamos
                        </h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Dados Pessoais:</strong> Endereço de e-mail e ID de usuário.</li>
                            <li><strong>Dados Financeiros:</strong> Transações, valores, datas, categorias e orçamentos.</li>
                            <li><strong>Entradas de Texto/Voz:</strong> O texto natural ou transcrição de voz enviado para a IA.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <Server className="w-4 h-4 text-indigo-500" />
                            2. Processamento e Terceiros
                        </h3>
                        <p className="mb-2">Utilizamos serviços confiáveis para operar:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong>Supabase (Banco de Dados):</strong> Armazenamento seguro com <em>Row Level Security (RLS)</em>. Apenas você tem acesso aos seus registros.
                            </li>
                            <li>
                                <strong>OpenAI (Inteligência Artificial):</strong> Processa textos para extrair dados. Seus dados não são usados para treinar os modelos deles.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-indigo-500" />
                            3. Segurança e Direitos
                        </h3>
                        <p className="mb-2">Levamos a segurança a sério:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Criptografia via HTTPS (TLS/SSL).</li>
                            <li>Controle rigoroso de acesso ao banco de dados.</li>
                        </ul>
                        <p className="mt-4 font-medium text-slate-800 dark:text-slate-200">Seus Direitos:</p>
                        <p>Você tem total controle para acessar, corrigir ou excluir seus dados a qualquer momento através das configurações do aplicativo ("Deletar Conta").</p>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Contato</h3>
                        <p>Dúvidas? Entre em contato:</p>
                        <ul className="mt-2 space-y-1">
                            <li>📧 techne.br@gmail.com</li>
                            <li>📱 (14) 99153-7503</li>
                        </ul>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};
