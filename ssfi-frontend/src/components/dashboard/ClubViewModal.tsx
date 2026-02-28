'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, Phone, Mail, MapPin, Calendar, Clock,
    Hash, Shield, Users, AlertCircle, Globe,
    CheckCircle2, XCircle, Loader2, Building2
} from 'lucide-react';

interface ClubOwner {
    uid: string | null;
    name: string;
    gender: string;
    phone: string;
    email: string;
    profilePhoto: string | null;
    registrationDate: string | null;
    expiryDate: string | null;
    accountStatus: string | null;
    membershipStatus: 'ACTIVE' | 'EXPIRED' | 'PENDING';
}

interface ClubProfile {
    id: number;
    club_name: string;
    code: string;
    uid: string | null;
    registration_number: string | null;
    established_year: string;
    address: string | null;
    website: string | null;
    status: string;
    district_name: string;
    district_code: string;
    state_name: string;
    state_code: string;
    skatersCount: number;
    owner: ClubOwner | null;
}

interface ClubViewModalProps {
    club: ClubProfile | null;
    isLoading: boolean;
    onClose: () => void;
}

const StatusBadge = ({ status }: { status: 'ACTIVE' | 'EXPIRED' | 'PENDING' }) => {
    const configs = {
        ACTIVE:  { label: 'Active',           bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-500/30', Icon: CheckCircle2 },
        EXPIRED: { label: 'Expired',           bg: 'bg-red-100',     text: 'text-red-600',     border: 'border-red-500/30',     Icon: XCircle },
        PENDING: { label: 'Pending Approval',  bg: 'bg-amber-100',   text: 'text-amber-600',   border: 'border-amber-500/30',   Icon: AlertCircle },
    };
    const cfg = configs[status] || configs.PENDING;
    const { Icon } = cfg;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <Icon className="w-3.5 h-3.5" />{cfg.label}
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

const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function ClubViewModal({ club, isLoading, onClose }: ClubViewModalProps) {
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
                            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-gray-900" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                    {club?.club_name || 'Loading...'}
                                </h2>
                                <p className="text-xs text-gray-600">
                                    {club ? `${club.state_name} · ${club.state_code} · Est. ${club.established_year}` : 'Club Details & Owner Information'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100/60 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : !club ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
                                <AlertCircle className="w-10 h-10 text-gray-500" />
                                <p className="text-sm">Failed to load profile. Please try again.</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Stats strip */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Skaters',  value: club.skatersCount,  Icon: Users,    color: 'text-purple-600', bg: 'bg-purple-50' },
                                        { label: 'District', value: club.district_name, Icon: Building2, color: 'text-blue-600',   bg: 'bg-blue-50' },
                                        { label: 'Est. Year', value: club.established_year, Icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                                    ].map(({ label, value, Icon, color, bg }) => (
                                        <div key={label} className={`${bg} rounded-xl p-3 text-center border border-gray-100`}>
                                            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                                            <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
                                            <p className="text-xs text-gray-600">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Club details */}
                                {(club.address || club.website) && (
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-5 pl-3 border-l-2 border-blue-500">Club Details</p>
                                        <div className="bg-white rounded-xl border border-gray-200 px-4">
                                            {club.address && <Field icon={MapPin} label="Address" value={club.address} />}
                                            {club.website && <Field icon={Globe} label="Website" value={club.website} />}
                                        </div>
                                    </div>
                                )}

                                {/* Owner section */}
                                {club.owner ? (
                                    <div className="space-y-0 divide-y divide-gray-100">
                                        {/* Owner header */}
                                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                            <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {club.owner.profilePhoto
                                                    ? <img src={`http://localhost:5001${club.owner.profilePhoto}`} alt="Club Owner" className="object-cover w-full h-full" />
                                                    : <User className="w-7 h-7 text-gray-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-gray-900 font-semibold">Club Owner</h3>
                                                    <StatusBadge status={club.owner.membershipStatus} />
                                                </div>
                                                <p className="text-gray-600 text-sm mt-0.5">{club.owner.gender} · {club.owner.phone}</p>
                                                {club.owner.uid && (
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Hash className="w-3 h-3 text-gray-500" />
                                                        <span className="text-xs font-mono text-blue-600">{club.owner.uid}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Owner personal details */}
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-5 pl-3 border-l-2 border-blue-500">Owner Details</p>
                                            <div className="bg-white rounded-xl border border-gray-200 px-4">
                                                <Field icon={User}  label="Gender" value={club.owner.gender} />
                                                <Field icon={Phone} label="Phone"  value={club.owner.phone} />
                                                <Field icon={Mail}  label="Email"  value={club.owner.email} />
                                            </div>
                                        </div>

                                        {/* Membership dates */}
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-5 pl-3 border-l-2 border-blue-500">Membership</p>
                                            <div className="bg-white rounded-xl border border-gray-200 px-4">
                                                <Field icon={Calendar} label="Registration Date" value={fmtDate(club.owner.registrationDate)} />
                                                <Field icon={Clock}    label="Expiry Date"        value={fmtDate(club.owner.expiryDate)} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-xl border border-gray-100">
                                        <User className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                                        <p className="text-sm">No owner registered for this club</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                        <button onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
