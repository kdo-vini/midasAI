import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Loader2, Mail, Lock, Sparkles } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { useTranslation } from 'react-i18next';

export const Login: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) {
                    // Handle signup errors
                    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already registered')) {
                        toast.error(t('login.errors.emailExists'));
                    } else if (error.message.toLowerCase().includes('password') && error.message.toLowerCase().includes('weak')) {
                        toast.error(t('login.errors.weakPassword'));
                    } else {
                        toast.error(error.message);
                    }
                    setLoading(false);
                    return;
                }

                toast.success(t('login.signupSuccess'), { duration: 5000 });
                toast.info(t('login.verifyEmail'), { duration: 5000 });
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    // Handle login errors - 400 errors are typically invalid credentials
                    console.error('Login error:', error);

                    if (error.status === 400 || error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('incorrect')) {
                        toast.error(t('login.errors.invalidCredentials'));
                    } else if (error.message.toLowerCase().includes('not confirmed') || error.message.toLowerCase().includes('email not confirmed')) {
                        toast.error(t('login.errors.emailNotConfirmed'));
                    } else if (error.message.toLowerCase().includes('email')) {
                        toast.error(t('login.errors.invalidEmail'));
                    } else {
                        // Generic error message
                        toast.error(t('login.errors.invalidCredentials'));
                    }
                    setLoading(false);
                    return;
                }

                toast.success(t('login.loginSuccess'));
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            toast.error(t('login.errors.networkError'));
            setLoading(false);
        } finally {
            if (!isSignUp) {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            <Toaster position="top-center" richColors theme="dark" />
            <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-indigo-50 dark:border-slate-700 transition-colors duration-300">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-indigo-600 dark:bg-indigo-500 p-3 rounded-xl mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Midas AI</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('login.subtitle')}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('login.emailLabel')}</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500"
                                placeholder={t('login.emailPlaceholder')}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('login.passwordLabel')}</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500"
                                placeholder={t('login.passwordPlaceholder')}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isSignUp ? t('login.createAccount') : t('login.enter')
                        )}
                    </button>
                </form>

                {isSignUp && (
                    <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        {t('login.agreeToPrivacy')}
                        <button
                            type="button"
                            onClick={() => setShowPrivacy(true)}
                            className="text-indigo-600 hover:underline dark:text-indigo-400 font-medium focus:outline-none"
                        >
                            {t('login.privacyPolicy')}
                        </button>
                    </p>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline"
                    >
                        {isSignUp ? t('login.haveAccount') : t('login.needAccount')}
                    </button>
                </div>
            </div>

            <PrivacyPolicyModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
            />
        </div>
    );
};
