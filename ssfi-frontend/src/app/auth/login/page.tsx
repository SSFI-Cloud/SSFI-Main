'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight, Phone, Hash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';

type LoginMode = 'phone' | 'uid';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [mode, setMode] = useState<LoginMode>('phone');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

    const validate = () => {
        const errs: typeof errors = {};
        if (!identifier.trim()) {
            errs.identifier = mode === 'phone' ? 'Phone number is required' : 'UID is required';
        } else if (mode === 'phone' && !/^[6-9]\d{9}$/.test(identifier.trim())) {
            errs.identifier = 'Enter a valid 10-digit mobile number';
        } else if (mode === 'uid' && !identifier.trim().startsWith('SSFI')) {
            errs.identifier = 'UID should start with SSFI (e.g. SSFI/BS/TN/25/S0001)';
        }
        if (!password) errs.password = 'Password is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', {
                identifier: identifier.trim(),
                password,
            });

            if (response.data.success) {
                const { accessToken, refreshToken, user } = response.data.data;
                if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
                await login(accessToken, user);
            } else {
                toast.error(response.data.message || 'Login failed');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = (m: LoginMode) => {
        setMode(m);
        setIdentifier('');
        setErrors({});
    };

    return (
        <div className="min-h-screen bg-dark-900 flex">
            {/* Left Side — Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-6">
                            <h1 className="text-4xl font-display font-bold text-white">SSFI</h1>
                        </Link>
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-gray-400">Login to your SSFI account</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex rounded-xl bg-dark-800 border border-white/10 p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => switchMode('phone')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                mode === 'phone'
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Phone className="w-4 h-4" />
                            Phone Number
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode('uid')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                mode === 'uid'
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Hash className="w-4 h-4" />
                            SSFI UID
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={onSubmit} className="space-y-5">
                        {/* Identifier */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                                {mode === 'phone' ? 'Phone Number' : 'SSFI UID'}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    {mode === 'phone'
                                        ? <Phone className="w-4 h-4" />
                                        : <Hash className="w-4 h-4" />}
                                </div>
                                <input
                                    type={mode === 'phone' ? 'tel' : 'text'}
                                    value={identifier}
                                    onChange={e => { setIdentifier(e.target.value); setErrors(prev => ({ ...prev, identifier: undefined })); }}
                                    placeholder={mode === 'phone' ? 'Enter 10-digit mobile number' : 'e.g. SSFI/BS/TN/25/S0001'}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                />
                            </div>
                            {errors.identifier && (
                                <p className="mt-1.5 text-sm text-red-400">{errors.identifier}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 pr-12 rounded-lg bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
                            )}
                        </div>

                        {/* Forgot Password */}
                        <div className="flex items-center justify-end">
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Logging in...</>
                            ) : (
                                <>Login <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    {/* Back to Home */}
                    <p className="mt-8 text-center text-gray-400">
                        <Link
                            href="/"
                            className="font-semibold text-primary-400 hover:text-primary-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            Back to Home
                        </Link>
                    </p>
                </motion.div>
            </div>

            {/* Right Side */}
            <div className="hidden lg:block flex-1 relative bg-gradient-to-br from-primary-600 to-accent-600">
                <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="text-center">
                        <img src="/images/logo/login-logo.webp" alt="SSFI" className="mx-auto mb-8 h-28 w-auto object-contain" />
                        <h2 className="text-5xl font-display font-bold text-white mb-6">
                            Join India&apos;s Premier
                            <br />
                            Skating Federation
                        </h2>
                        <p className="text-xl text-white/80 max-w-md mx-auto">
                            10,000+ registered athletes • 28 states • 500+ clubs
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
