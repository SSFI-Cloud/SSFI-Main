'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, CheckCircle, AlertCircle, RefreshCw, Calendar, User, Phone } from 'lucide-react';
import { useAffiliationLookup, type RegistrationType, type MemberLookupResult } from '@/lib/hooks/useAffiliationLookup';

interface AffiliationLookupStepProps {
  type: RegistrationType;
  onFound: (member: MemberLookupResult) => void;
  onNew: () => void;
}

const typeLabels: Record<RegistrationType, string> = {
  STATE_SECRETARY: 'State Secretary',
  DISTRICT_SECRETARY: 'District Secretary',
  CLUB: 'Club',
  STUDENT: 'Student',
};

export default function AffiliationLookupStep({ type, onFound, onNew }: AffiliationLookupStepProps) {
  const [identifier, setIdentifier] = useState('');
  const { lookup, result, isLoading, error, reset } = useAffiliationLookup();

  const handleLookup = async () => {
    if (!identifier.trim()) return;
    const member = await lookup(type, identifier.trim());
    if (member) onFound(member);
  };

  const statusColor = (status: string) => {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const accountColor = (status: string | null) => {
    if (status === 'ACTIVE') return 'bg-green-100 text-green-700';
    if (status === 'EXPIRED') return 'bg-red-100 text-red-700';
    if (status === 'LOCKED') return 'bg-gray-100 text-gray-600';
    return 'bg-gray-50 text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Lookup Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Phone Number or SSFI UID
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); reset(); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder={`Enter your registered phone or SSFI UID`}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleLookup}
            disabled={isLoading || !identifier.trim()}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Enter your registered mobile number (e.g. 9876543210) or your SSFI UID (e.g. SSFI-25-KA-...)
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Member Not Found</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{result.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{result.uid}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor(result.status)}`}>
                  {result.status}
                </span>
                {result.accountStatus && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${accountColor(result.accountStatus)}`}>
                    {result.accountStatus}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              {result.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>+91 {result.phone}</span>
                </div>
              )}
              {result.expiryDate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Expires: {new Date(result.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {result.stateName && (
                <div className="text-gray-600">
                  <span className="text-gray-400">State: </span>{result.stateName}
                </div>
              )}
              {result.districtName && (
                <div className="text-gray-600">
                  <span className="text-gray-400">District: </span>{result.districtName}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onFound(result)}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Renew Membership
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* New Registration CTA */}
      <button
        type="button"
        onClick={onNew}
        className="w-full py-3 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-600 rounded-xl font-medium text-sm transition-all"
      >
        Register as New {typeLabels[type]}
      </button>
    </div>
  );
}
