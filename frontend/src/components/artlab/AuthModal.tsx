'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, Sparkles, Check } from 'lucide-react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any, token: string) => void;
};

export default function AuthModal({ isOpen, onClose, onSuccess }: Props) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin ? { email, password } : { email, password, displayName };

        try {
            const res = await fetch(`http://localhost:4000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Authentication failed');
            }

            onSuccess(data.user, data.token);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMockOAuth = async (provider: 'google' | 'twitter') => {
        setLoading(true);
        setError(null);
        
        // Simulating the OAuth redirect and callback
        setTimeout(async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/auth/oauth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider,
                        providerId: `mock_${provider}_${Date.now()}`,
                        email: `demo_${provider}@example.com`,
                        displayName: `${provider === 'google' ? 'Google' : 'Twitter'} User`
                    }),
                });

                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || 'OAuth failed');

                onSuccess(data.user, data.token);
                onClose();
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Box */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-sm bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="p-8 pb-6 text-center border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
                    <div className="mx-auto w-12 h-12 bg-black text-white dark:bg-white dark:text-black rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <Sparkles size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        Save your masterworks permanently
                    </p>
                </div>

                {/* Body */}
                <div className="p-8 pt-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {!isLogin && (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User size={16} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Artist Name"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#202024] border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Mail size={16} />
                            </div>
                            <input
                                type="email"
                                required
                                placeholder="Email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#202024] border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={16} />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#202024] border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black text-sm font-black transition-colors"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="relative flex py-6 items-center">
                        <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-[10px] uppercase font-black tracking-widest text-gray-400">or continue with</span>
                        <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => handleMockOAuth('google')}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202024] hover:bg-gray-50 dark:hover:bg-[#2a2a2e] text-gray-700 dark:text-gray-300 text-sm font-bold transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMockOAuth('twitter')}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] text-sm font-bold transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                            Twitter
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 text-center">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="text-xs font-bold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
