'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle, Home, LogIn, RefreshCw, Mail, ArrowRight,
  Shield, Building2, Users, User,
} from 'lucide-react';
import { Suspense } from 'react';

const typeConfig: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
  badgeBorder: string;
}> = {
  'state-secretary': {
    label: 'State Secretary',
    icon: <Shield className="w-7 h-7 text-blue-400" />,
    color: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-500/10 text-blue-400',
    badgeBorder: 'border-blue-500/20',
  },
  'district-secretary': {
    label: 'District Secretary',
    icon: <Building2 className="w-7 h-7 text-purple-400" />,
    color: 'from-purple-500 to-indigo-600',
    badge: 'bg-purple-500/10 text-purple-400',
    badgeBorder: 'border-purple-500/20',
  },
  'club': {
    label: 'Club Affiliation',
    icon: <Users className="w-7 h-7 text-pink-400" />,
    color: 'from-pink-500 to-rose-600',
    badge: 'bg-pink-500/10 text-pink-400',
    badgeBorder: 'border-pink-500/20',
  },
  'student': {
    label: 'Student Registration',
    icon: <User className="w-7 h-7 text-green-400" />,
    color: 'from-green-500 to-emerald-600',
    badge: 'bg-green-500/10 text-green-400',
    badgeBorder: 'border-green-500/20',
  },
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'student';
  const uid = searchParams.get('uid');
  const isRenewal = searchParams.get('renewed') === 'true';

  const config = typeConfig[type] || typeConfig['student'];

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Dark hero strip */}
      <div className="bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 ${config.badge} border ${config.badgeBorder} rounded-full text-xs font-medium mb-4`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" /> SSFI Affiliation
          </div>
          <h1 className="text-2xl font-bold">{isRenewal ? 'Membership Renewed!' : 'Registration Submitted!'}</h1>
          <p className="text-white/50 text-sm mt-2">
            {isRenewal
              ? 'Your membership has been renewed successfully.'
              : 'Your application has been received and is under admin review.'}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* Gradient top strip */}
          <div className={`h-1.5 bg-gradient-to-r ${config.color}`} />

          <div className="p-8 text-center">
            {/* Animated check */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`w-20 h-20 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isRenewal
                ? `${config.label} Renewed`
                : `${config.label} Application Submitted`}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {isRenewal
                ? 'Your membership has been extended. Login to view your updated profile.'
                : 'Your application is now pending admin review. You will receive an email notification once approved.'}
            </p>

            {/* UID box */}
            {uid && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6"
              >
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Your SSFI UID</p>
                <p className="text-2xl font-bold font-mono text-blue-700 break-all">{uid}</p>
                <p className="text-xs text-gray-400 mt-2">Save this UID — you will need it to login and track your application</p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link href="/" className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all">
                <Home className="w-4 h-4" /> Home
              </Link>
              <Link href="/auth/login" className={`flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r ${config.color} text-white rounded-xl font-medium text-sm shadow-sm`}>
                <LogIn className="w-4 h-4" /> Login
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Email notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Check your email</p>
            <p className="text-sm text-gray-500 mt-0.5">A confirmation email with your UID and credentials has been sent to your registered email address.</p>
          </div>
        </motion.div>

        {/* Next steps */}
        {!isRenewal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-amber-50 border border-amber-100 rounded-2xl p-5"
          >
            <p className="text-sm font-semibold text-amber-800 mb-3">What happens next?</p>
            <div className="space-y-2.5">
              {[
                'An SSFI admin will review your application',
                'You\'ll receive an email notification when approved',
                'After approval, login with your UID and phone number as password',
                'Complete your profile and access the dashboard',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</div>
                  <p className="text-sm text-amber-800">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Register again */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Register another member
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
