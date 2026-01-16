import React from 'react';
import { Crown, Loader2, X } from 'lucide-react';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
}

// Direct Stripe Payment Link with 7-day trial
const PAYMENT_LINK = 'https://buy.stripe.com/dRm4gAfBNbPn7HK5dx00003';

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, userEmail }) => {
    const [loading, setLoading] = React.useState(false);

    const handleSubscribe = () => {
        setLoading(true);
        // Redirect to Stripe Payment Link with prefilled email
        const url = userEmail
            ? `${PAYMENT_LINK}?prefilled_email=${encodeURIComponent(userEmail)}`
            : PAYMENT_LINK;
        window.location.href = url;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-slate-900" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Seu período de teste expirou
                    </h2>
                    <p className="text-slate-400">
                        Continue usando o Midas AI e mantenha suas finanças organizadas
                    </p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-baseline mb-4">
                        <span className="text-slate-300">Plano Mensal</span>
                        <div>
                            <span className="text-3xl font-bold text-white">R$ 14,90</span>
                            <span className="text-slate-400">/mês</span>
                        </div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            Transações ilimitadas
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            Importação de extratos com IA
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            Chat financeiro inteligente
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            Relatórios e insights
                        </li>
                    </ul>
                </div>

                <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Crown className="w-5 h-5" />
                            Assinar Agora
                        </>
                    )}
                </button>

                <p className="text-center text-slate-500 text-xs mt-4">
                    Cancele a qualquer momento. Sem compromisso.
                </p>
            </div>
        </div>
    );
};
