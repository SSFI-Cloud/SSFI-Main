'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, KeyRound, Lock, Eye, EyeOff,
    ArrowRight, ArrowLeft, Loader2, CheckCircle2, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api/client';

type Step = 'phone' | 'otp' | 'password' | 'done';

const STEP_LABELS = ['Enter Phone', 'Verify OTP', 'New Password'];
const STEP_KEYS: Step[] = ['phone', 'otp', 'password'];

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Helpers ──────────────────────────────────────────────────────────────

    const startResendTimer = () => {
        setResendTimer(60);
        const interval = setInterval(() => {
            setResendTimer(t => {
                if (t <= 1) { clearInterval(interval); return 0; }
                return t - 1;
            });
        }, 1000);
    };

    const currentStepIndex = STEP_KEYS.indexOf(step as any);

    // ── Step 1: Request OTP ──────────────────────────────────────────────────

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.trim()))
            errs.phone = 'Enter a valid 10-digit mobile number';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { phone: phone.trim() });
            toast.success('OTP sent to your registered email');
            startResendTimer();
            setStep('otp');
            setErrors({});
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step 2: Verify OTP ───────────────────────────────────────────────────

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!otp.trim() || !/^\d{6}$/.test(otp.trim()))
            errs.otp = 'Enter the 6-digit OTP';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        // We'll verify during password reset (single API call), just move forward
        setStep('password');
        setErrors({});
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { phone: phone.trim() });
            toast.success('New OTP sent');
            startResendTimer();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step 3: Reset Password ───────────────────────────────────────────────

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};

        if (!newPassword) {
            errs.newPassword = 'Password is required';
        } else {
            if (newPassword.length < 8)           errs.newPassword = 'At least 8 characters';
            else if (!/[A-Z]/.test(newPassword))  errs.newPassword = 'Include at least one uppercase letter';
            else if (!/[a-z]/.test(newPassword))  errs.newPassword = 'Include at least one lowercase letter';
            else if (!/[0-9]/.test(newPassword))  errs.newPassword = 'Include at least one number';
            else if (!/[^A-Za-z0-9]/.test(newPassword)) errs.newPassword = 'Include at least one special character';
        }
        if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
        else if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

        if (Object.keys(errs).length) { setErrors(errs); return; }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                phone: phone.trim(),
                otp: otp.trim(),
                newPassword,
            });
            toast.success('Password reset successfully!');
            setStep('done');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Reset failed';
            // If OTP error, go back to OTP step
            if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expired')) {
                toast.error(msg + ' — please re-enter your OTP');
                setStep('otp');
                setOtp('');
            } else {
                toast.error(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-dark-900 flex">
            {/* Left side — form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-4">
                            <h1 className="text-4xl font-display font-bold text-white">SSFI</h1>
                        </Link>
                        <h2 className="text-2xl font-bold text-white mb-1">Forgot Password</h2>
                        <p className="text-gray-400 text-sm">Enter your phone number — OTP will be sent to your registered email</p>
                    </div>

                    {/* Progress Steps (hide on done) */}
                    {step !== 'done' && (
                        <div className="flex items-center mb-8">
                            {STEP_LABELS.map((label, i) => (
                                <div key={label} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                                            i < currentStepIndex
                                                ? 'bg-primary-500 border-primary-500 text-white'
                                                : i === currentStepIndex
                                                    ? 'border-primary-500 text-primary-400 bg-primary-500/10'
                                                    : 'border-white/20 text-gray-600 bg-transparent'
                                        }`}>
                                            {i < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                        </div>
                                        <span className={`text-xs mt-1 font-medium ${i === currentStepIndex ? 'text-primary-400' : 'text-gray-600'}`}>
                                            {label}
                                        </span>
                                    </div>
                                    {i < STEP_LABELS.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all duration-300 ${i < currentStepIndex ? 'bg-primary-500' : 'bg-white/10'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <AnimatePresence mode="wait">

                        {/* ── STEP 1: Phone ── */}
                        {step === 'phone' && (
                            <motion.form
                                key="phone"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                                onSubmit={handleSendOtp}
                                className="space-y-5"
                            >
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Registered Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => { setPhone(e.target.value); setErrors({}); }}
                                            placeholder="Enter 10-digit mobile number"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                            maxLength={10}
                                        />
                                    </div>
                                    {errors.phone && <p className="mt-1.5 text-sm text-red-400">{errors.phone}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending OTP...</> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
                                </button>

                                <p className="text-center text-sm text-gray-400">
                                    Remember your password?{' '}
                                    <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-semibold">Login</Link>
                                </p>
                            </motion.form>
                        )}

                        {/* ── STEP 2: OTP ── */}
                        {step === 'otp' && (
                            <motion.form
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                                onSubmit={handleVerifyOtp}
                                className="space-y-5"
                            >
                                <p className="text-sm text-gray-400 text-center">
                                    OTP sent to the email address registered with <span className="text-white font-semibold">+91 {phone}</span>
                                </p>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Enter 6-digit OTP
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}); }}
                                            placeholder="000000"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all tracking-[0.4em] text-center font-mono text-lg"
                                            maxLength={6}
                                        />
                                    </div>
                                    {errors.otp && <p className="mt-1.5 text-sm text-red-400">{errors.otp}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || otp.length < 6}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <>Verify OTP <ArrowRight className="w-5 h-5" /></>}
                                </button>

                                <div className="flex items-center justify-between text-sm">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('phone'); setOtp(''); setErrors({}); }}
                                        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Change number
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resendTimer > 0 || isLoading}
                                        className="flex items-center gap-1 text-primary-400 hover:text-primary-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {/* ── STEP 3: New Password ── */}
                        {step === 'password' && (
                            <motion.form
                                key="password"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                                onSubmit={handleResetPassword}
                                className="space-y-5"
                            >
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => { setNewPassword(e.target.value); setErrors(prev => ({ ...prev, newPassword: undefined })); }}
                                            placeholder="Min 8 chars, upper, lower, number, symbol"
                                            className="w-full pl-10 pr-12 py-3 rounded-lg bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.newPassword && <p className="mt-1.5 text-sm text-red-400">{errors.newPassword}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                                            placeholder="Re-enter new password"
                                            className="w-full pl-10 pr-12 py-3 rounded-lg bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword}</p>}
                                </div>

                                {/* Password strength hint */}
                                <p className="text-xs text-gray-500">
                                    Password must be at least 8 characters and contain uppercase, lowercase, number and special character.
                                </p>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Resetting...</> : <>Reset Password <ArrowRight className="w-5 h-5" /></>}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep('otp'); setErrors({}); }}
                                    className="w-full flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to OTP
                                </button>
                            </motion.form>
                        )}

                        {/* ── DONE ── */}
                        {step === 'done' && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="text-center space-y-6"
                            >
                                <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Password Reset Successful!</h3>
                                    <p className="text-gray-400 text-sm">Your password has been updated. You can now login with your new password.</p>
                                </div>
                                <Link
                                    href="/auth/login"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] transition-all duration-300"
                                >
                                    Go to Login <ArrowRight className="w-5 h-5" />
                                </Link>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Right Side */}
            <div className="hidden lg:block flex-1 relative bg-gradient-to-br from-primary-600 to-accent-600">
                <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="text-center">
                        <h2 className="text-5xl font-display font-bold text-white mb-6">
                            Join India's Premier
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
