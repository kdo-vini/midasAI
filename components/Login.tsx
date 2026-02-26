import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle, User } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { Logo } from './Logo';
import zxcvbn from 'zxcvbn';

const validatePassword = (pass: string) => {
    if (pass.length < 8) {
        return { isValid: false, message: 'A senha deve ter no mínimo 8 caracteres' };
    }

    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSymbol = /[^A-Za-z0-9]/.test(pass);

    const criteriaCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
    if (criteriaCount < 4) {
        return { isValid: false, message: 'A senha deve conter: letras maiúsculas, minúsculas, números e símbolos especiais' };
    }

    const result = zxcvbn(pass);
    if (result.score < 3) {
        return { isValid: false, message: 'Senha muito fácil de adivinhar. Evite sequências comuns e dados pessoais' };
    }

    return { isValid: true, message: '' };
};

export const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showEmailSent, setShowEmailSent] = useState<'signup' | 'reset' | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) {
                    toast.error('As senhas não coincidem');
                    setLoading(false);
                    return;
                }

                if (!displayName.trim()) {
                    toast.error('Digite seu nome');
                    setLoading(false);
                    return;
                }

                const passwordCheck = validatePassword(password);
                if (!passwordCheck.isValid) {
                    toast.error(passwordCheck.message);
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) {
                    const errorMsg = error.message.toLowerCase();
                    if (errorMsg.includes('already registered') || errorMsg.includes('user already registered')) {
                        toast.error('Este email já está cadastrado');
                    } else if (errorMsg.includes('password') || errorMsg.includes('senha')) {
                        toast.error('Senha fraca. Certifique-se de usar pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos.');
                    } else {
                        // Prevent leaking huge scary English database errors to the user
                        if (error.message.length > 60) {
                            toast.error('Não foi possível realizar o cadastro no momento. Tente novamente mais tarde.');
                            console.error('Supabase raw error:', error.message);
                        } else {
                            toast.error(error.message);
                        }
                    }
                    setLoading(false);
                    return;
                }

                if (data?.user) {
                    await supabase.from('user_profiles').upsert({
                        user_id: data.user.id,
                        display_name: displayName.trim(),
                    }, { onConflict: 'user_id' });
                }

                setShowEmailSent('signup');
                setLoading(false);
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    console.error('Login error:', error);

                    if (error.status === 400 || error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('incorrect')) {
                        toast.error('Email ou senha incorretos');
                    } else if (error.message.toLowerCase().includes('not confirmed') || error.message.toLowerCase().includes('email not confirmed')) {
                        toast.error('Confirme seu email antes de fazer login');
                    } else if (error.message.toLowerCase().includes('email')) {
                        toast.error('Email inválido');
                    } else {
                        toast.error('Email ou senha incorretos');
                    }
                    setLoading(false);
                    return;
                }

                toast.success('Login realizado com sucesso!');
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            toast.error('Erro de conexão. Tente novamente');
            setLoading(false);
        } finally {
            if (!isSignUp) {
                setLoading(false);
            }
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Digite seu email');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}`,
            });

            if (error) {
                toast.error(error.message);
                setLoading(false);
                return;
            }

            setShowEmailSent('reset');
        } catch (error) {
            toast.error('Erro ao enviar email');
        } finally {
            setLoading(false);
        }
    };

    // Email Sent Confirmation Screen
    if (showEmailSent) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <Toaster position="top-center" richColors theme="dark" />
                <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {showEmailSent === 'signup' ? 'Verifique seu email!' : 'Email enviado!'}
                    </h2>

                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        {showEmailSent === 'signup'
                            ? `Enviamos um link de confirmação para ${email}. Clique no link para ativar sua conta.`
                            : `Enviamos instruções para redefinir sua senha para ${email}.`
                        }
                    </p>

                    <div className="space-y-3">
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            Não recebeu? Verifique sua pasta de spam.
                        </p>

                        <button
                            onClick={() => {
                                setShowEmailSent(null);
                                setShowForgotPassword(false);
                                setEmail('');
                                setPassword('');
                            }}
                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium hover:underline"
                        >
                            Voltar para o login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Forgot Password Screen
    if (showForgotPassword) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <Toaster position="top-center" richColors theme="dark" />
                <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setShowForgotPassword(false)}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>

                    <div className="flex flex-col items-center mb-6">
                        <Logo className="text-3xl mb-2" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Esqueceu sua senha?</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-1">
                            Digite seu email e enviaremos instruções para redefinir sua senha.
                        </p>
                    </div>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Enviar link de recuperação'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Main Login/Signup Screen
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            <Toaster position="top-center" richColors theme="dark" />
            <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-indigo-50 dark:border-slate-700 transition-colors duration-300">
                <div className="flex flex-col items-center mb-8">
                    <Logo className="text-3xl mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Seu assistente financeiro inteligente</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
                            {!isSignUp && (
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                                >
                                    Esqueci minha senha
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* Signup only fields */}
                    {isSignUp && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Senha</label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="Digite a senha novamente"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Como quer ser chamado?</label>
                                <div className="relative">
                                    <User className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="Seu nome"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isSignUp ? 'Criar Conta' : 'Entrar'
                        )}
                    </button>
                </form>

                {isSignUp && (
                    <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        Ao criar sua conta, você concorda com nossa {' '}
                        <button
                            type="button"
                            onClick={() => setShowPrivacy(true)}
                            className="text-indigo-600 hover:underline dark:text-indigo-400 font-medium focus:outline-none"
                        >
                            Política de Privacidade
                        </button>
                    </p>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline"
                    >
                        {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Crie uma agora'}
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
