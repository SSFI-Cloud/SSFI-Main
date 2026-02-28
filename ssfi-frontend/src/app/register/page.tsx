'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Users,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Lock,
  GraduationCap,
} from 'lucide-react';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useRegistrationStatuses } from '@/lib/hooks/useAffiliation';
import type { RegistrationType, RegistrationStatus } from '@/types/affiliation';
import { REGISTRATION_TYPES, formatRegistrationDate, getDaysRemaining } from '@/types/affiliation';

export default function AffiliationRegistrationPage() {
  const { fetchStatuses, data: statuses, isLoading, error } = useRegistrationStatuses();

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const getStatusIcon = (status: RegistrationStatus | undefined) => {
    if (!status) return <Lock className="w-6 h-6" />;
    if (status.isOpen) return <CheckCircle2 className="w-6 h-6" />;
    return <Lock className="w-6 h-6" />;
  };

  const getRegistrationTypeIcon = (type: RegistrationType) => {
    switch (type) {
      case 'STATE_SECRETARY':
        return <MapPin className="w-8 h-8" />;
      case 'DISTRICT_SECRETARY':
        return <Building2 className="w-8 h-8" />;
      case 'CLUB':
        return <Users className="w-8 h-8" />;
      case 'STUDENT':
        return <GraduationCap className="w-8 h-8" />;
    }
  };

  const getStatus = (type: RegistrationType): RegistrationStatus | undefined => {
    if (!statuses) return undefined;
    return statuses[type];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-50/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-teal-50/40 rounded-full blur-[120px]" />
      </div>

      <Header />
      <div className="pt-36 pb-12 relative max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            Register
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-gray-900 mb-4 tracking-tight">
            Affiliation{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              Registration
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Join the Skating Sports Federation of India. Register as a State Secretary,
            District Secretary, or affiliate your Club.
          </p>
        </motion.div>

        {/* Registration Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REGISTRATION_TYPES.map((regType, index) => {
              const status = getStatus(regType.value);
              const isOpen = status?.isOpen || false;
              const window = status?.window;

              return (
                <motion.div
                  key={regType.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${isOpen
                    ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-100/40'
                    : 'border-gray-200'
                    }`}
                >
                  {/* Status Badge */}
                  <div
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${isOpen
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-gray-50 text-gray-400 border border-gray-200'
                      }`}
                  >
                    {isOpen ? 'Open' : 'Closed'}
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isOpen
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-50 text-gray-400'
                        }`}
                    >
                      {getRegistrationTypeIcon(regType.value)}
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{regType.label}</h3>
                    <p className="text-gray-500 text-sm mb-4">{regType.description}</p>

                    {/* Window Info */}
                    {window && (
                      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <span className="text-gray-500">
                            {formatRegistrationDate(window.startDate)} -{' '}
                            {formatRegistrationDate(window.endDate)}
                          </span>
                        </div>
                        {isOpen && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-600 font-medium">
                              {getDaysRemaining(window.endDate)} days remaining
                            </span>
                          </div>
                        )}
                        {window.baseFee > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">Fee:</span>
                            <span className="text-gray-900 font-semibold">₹{window.baseFee}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message */}
                    <p
                      className={`text-sm mb-6 ${isOpen ? 'text-emerald-600' : 'text-gray-400'
                        }`}
                    >
                      {status?.message || 'Registration status unavailable'}
                    </p>

                    {/* Action Button */}
                    {isOpen ? (
                      <Link
                        href={`/register/${regType.value.toLowerCase().replace('_', '-')}`}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-200/40"
                      >
                        Register Now
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-400 border border-gray-200 rounded-xl font-semibold cursor-not-allowed"
                      >
                        <Lock className="w-5 h-5" />
                        Registration Closed
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gray-50 rounded-2xl border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                Registration windows are opened periodically by SSFI admin
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                Complete all required fields and upload valid documents
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                Aadhaar card is mandatory for identity verification
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                Applications are reviewed by the appropriate authority
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                You will receive SMS/Email notification upon approval
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                Contact info@ssfiskate.com for any queries
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-400 text-sm mt-8"
        >
          Already registered?{' '}
          <Link href="/auth/login" className="text-emerald-600 hover:underline">
            Login here
          </Link>
        </motion.p>
      </div>
      <Footer />
    </div>
  );
}
