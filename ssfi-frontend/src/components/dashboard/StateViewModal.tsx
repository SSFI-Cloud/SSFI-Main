'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, Phone, Mail, MapPin, Calendar, Clock,
    Shield, Hash, Globe, Building2, Users, AlertCircle,
    CheckCircle2, XCircle, Loader2
} from 'lucide-react';

interface SecretaryProfile {
    uid: string | null;
    name: string;
    gender: string;
    email: string;
    phone: string;
    residentialAddress: string;
    associationName: string | null;
    profilePhoto: string | null;
    status: string;
    registrationDate: string | null;
    expiryDate: string | null;
    accountStatus: string | null;
    membershipStatus: 'ACTIVE' | 'EXPIRED' | 'PENDING';
}

interface StateProfile {
    id: number;
    state_name: string;
    code: string;
    logo: string | null;
    website: string | null;
    districtsCount: number;
    clubsCount: number;
    skatersCount: number;
    eventsCount: number;
    secretary: SecretaryProfile | null;
}

interface StateViewModalProps {
    state: StateProfile | null;
    isLoading: boolean;
    onClose: () => void;
}

const StatusBadge = ({ status }: { status: 'ACTIVE' | 'EXPIRED' | 'PENDING' }) => {
    const config = {
        ACTIVE: { label: 'Active', bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-500/30', Icon: CheckCircle2 },
        EXPIRED: { label: 'Expired', bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500/30', Icon: XCircle },
        PENDING: { label: 'Pending Approval', bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-500/30', Icon: AlertCircle },
    }[status];

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}>
            <config.Icon className="w-3.5 h-3.5" />
            {config.label}
        </span>
    );
};

const Field = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-200 last:border-0">
        <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-gray-500" />
        </div>
        <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm text-gray-900 font-semibold">{value || '—'}</p>
        </div>
    </div>
);

const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function StateViewModal({ state, isLoading, onClose }: StateViewModalProps) {
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[#f8f9fb] rounded-2xl w-full max-w-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-gray-900" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                    {state?.state_name || 'Loading...'}
                                </h2>
                                <p className="text-xs text-gray-600">State Details & Secretary Information</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100/60 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                            </div>
                        ) : !state ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
                                <AlertCircle className="w-10 h-10 text-gray-500" />
                                <p className="text-sm">Failed to load profile. Please try again.</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">

                                {/* State Stats Strip */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Districts', value: state?.districtsCount ?? 0, Icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50' },
                                        { label: 'Clubs', value: state?.clubsCount ?? 0, Icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Skaters', value: state?.skatersCount ?? 0, Icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                                    ].map(({ label, value, Icon, color, bg }) => (
                                        <div key={label} className={`${bg} rounded-xl p-4 text-center border border-gray-100`}>
                                            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                                            <p className="text-xs text-gray-600">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Secretary Section */}
                                {state.secretary ? (
                                    <div className="space-y-0 divide-y divide-gray-100">
                                        {/* Secretary header: photo + name + status */}
                                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                            {/* Photo */}
                                            <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {state.secretary.profilePhoto ? (
                                                    <img
                                                        src={`https://api.ssfiskate.com/${state.secretary.profilePhoto}`}
                                                        alt={state.secretary.name}
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <User className="w-7 h-7 text-gray-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-gray-900 font-semibold text-base">{state.secretary.name}</h3>
                                                    <StatusBadge status={state.secretary.membershipStatus} />
                                                </div>
                                                <p className="text-gray-600 text-sm mt-0.5">State Secretary — {state.state_name}</p>
                                                {state.secretary.uid && (
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Hash className="w-3 h-3 text-gray-500" />
                                                        <span className="text-xs font-mono text-emerald-600">{state.secretary.uid}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Association & Personal Details Grid */}
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-5 pl-3 border-l-2 border-emerald-500">Personal Details</p>
                                            <div className="bg-white rounded-xl border border-gray-200 px-4">
                                                {state.secretary.associationName && (
                                                    <Field icon={Shield} label="State Association" value={state.secretary.associationName} />
                                                )}
                                                <Field icon={User} label="Gender" value={state.secretary.gender} />
                                                <Field icon={Phone} label="Phone" value={state.secretary.phone} />
                                                <Field icon={Mail} label="Email" value={state.secretary.email} />
                                                <Field icon={MapPin} label="Address" value={state.secretary.residentialAddress} />
                                            </div>
                                        </div>

                                        {/* Membership Dates */}
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-5 pl-3 border-l-2 border-emerald-500">Membership</p>
                                            <div className="bg-white rounded-xl border border-gray-200 px-4">
                                                <Field
                                                    icon={Calendar}
                                                    label="Registration Date"
                                                    value={formatDate(state.secretary.registrationDate)}
                                                />
                                                <Field
                                                    icon={Clock}
                                                    label="Expiry Date"
                                                    value={formatDate(state.secretary.expiryDate)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-xl border border-gray-100">
                                        <User className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                                        <p className="text-sm">No approved secretary registered for this state</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
