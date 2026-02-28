'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, Phone, Mail, MapPin, Calendar, Hash,
    Users, AlertCircle, CheckCircle2, Loader2,
    GraduationCap, Heart, Trophy, Shield
} from 'lucide-react';

interface StudentProfile {
    id: number;
    ssfi_id: string;
    name: string;
    father_name: string;
    mother_name: string | null;
    dob: string;
    gender: string;
    blood_group: string | null;
    mobile: string;
    email: string | null;
    address: string | null;
    city: string | null;
    pincode: string | null;
    school_name: string | null;
    coach_name: string;
    category_name: string | null;
    club_name: string;
    district_name: string;
    state_name: string;
    nominee_name: string | null;
    nominee_relation: string | null;
    approval_status: string;
    profile_image: string | null;
    created_at: string;
}

interface StudentViewModalProps {
    student: StudentProfile | null;
    isLoading: boolean;
    onClose: () => void;
}

const calcAge = (dob: string) => {
    if (!dob) return '—';
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() - birth.getMonth() < 0 || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
};

const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const Field = ({ icon: Icon, label, value, mono = false }: { icon: any; label: string; value: string; mono?: boolean }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-200 last:border-0">
        <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-gray-500" />
        </div>
        <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className={`text-sm text-gray-900 font-medium ${mono ? 'font-mono text-blue-600' : ''}`}>{value || '—'}</p>
        </div>
    </div>
);

export default function StudentViewModal({ student, isLoading, onClose }: StudentViewModalProps) {
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
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${student?.gender === 'FEMALE' ? 'bg-pink-100' : 'bg-cyan-100'}`}>
                                <User className={`w-5 h-5 ${student?.gender === 'FEMALE' ? 'text-pink-600' : 'text-cyan-600'}`} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 leading-tight">{student?.name || 'Loading...'}</h2>
                                <p className="text-xs text-gray-600">
                                    {student ? `${student.club_name} · ${student.district_name}` : 'Student Profile'}
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
                                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                            </div>
                        ) : !student ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
                                <AlertCircle className="w-10 h-10 text-gray-500" />
                                <p className="text-sm">Failed to load student profile.</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Profile header */}
                                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                                    <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center ${student.gender === 'FEMALE' ? 'bg-pink-100' : 'bg-cyan-100'}`}>
                                        {student.profile_image
                                            ? <img src={`http://localhost:5001${student.profile_image}`} alt={student.name} className="object-cover w-full h-full" />
                                            : <User className={`w-8 h-8 ${student.gender === 'FEMALE' ? 'text-pink-600' : 'text-cyan-600'}`} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-gray-900 font-semibold text-base">{student.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${student.approval_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {student.approval_status === 'APPROVED' ? <><CheckCircle2 className="w-3 h-3" /> Verified</> : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mt-0.5">{student.gender} · Age {calcAge(student.dob)}</p>
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            <div className="flex items-center gap-1">
                                                <Hash className="w-3 h-3 text-gray-500" />
                                                <span className="text-xs font-mono text-blue-600">{student.ssfi_id}</span>
                                            </div>
                                            {student.category_name && (
                                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">{student.category_name}</span>
                                            )}
                                            {student.blood_group && (
                                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">{student.blood_group.replace('_POSITIVE','+').replace('_NEGATIVE','-')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Club',     value: student.club_name,     Icon: Shield,  color: 'text-blue-600',   bg: 'bg-blue-50' },
                                        { label: 'District', value: student.district_name, Icon: MapPin,  color: 'text-green-600',  bg: 'bg-green-50' },
                                        { label: 'State',    value: student.state_name,    Icon: Trophy,  color: 'text-purple-600', bg: 'bg-purple-50' },
                                    ].map(({ label, value, Icon, color, bg }) => (
                                        <div key={label} className={`${bg} rounded-xl p-3 text-center border border-gray-100`}>
                                            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                                            <p className="text-xs font-bold text-gray-900 truncate" title={value}>{value}</p>
                                            <p className="text-xs text-gray-600">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Personal Details */}
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-5 pl-3 border-l-2 border-blue-500">Personal Details</p>
                                    <div className="bg-white rounded-xl border border-gray-200 px-4">
                                        <Field icon={User}     label="Father's Name"  value={student.father_name} />
                                        {student.mother_name && <Field icon={User} label="Mother's Name" value={student.mother_name} />}
                                        <Field icon={Calendar} label="Date of Birth"  value={fmtDate(student.dob)} />
                                        <Field icon={Phone}    label="Mobile"         value={student.mobile} />
                                        {student.email && <Field icon={Mail} label="Email" value={student.email} />}
                                        {student.address && <Field icon={MapPin} label="Address" value={[student.address, student.city, student.pincode].filter(Boolean).join(', ')} />}
                                    </div>
                                </div>

                                {/* Academic & Coaching */}
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-5 pl-3 border-l-2 border-blue-500">Academic & Coaching</p>
                                    <div className="bg-white rounded-xl border border-gray-200 px-4">
                                        {student.school_name && <Field icon={GraduationCap} label="School" value={student.school_name} />}
                                        <Field icon={Users} label="Coach" value={student.coach_name} />
                                    </div>
                                </div>

                                {/* Nominee */}
                                {(student.nominee_name || student.nominee_relation) && (
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-5 pl-3 border-l-2 border-blue-500">Nominee / Insurance</p>
                                        <div className="bg-white rounded-xl border border-gray-200 px-4">
                                            {student.nominee_name && <Field icon={Heart} label="Nominee Name" value={student.nominee_name} />}
                                            {student.nominee_relation && <Field icon={User} label="Relation" value={student.nominee_relation} />}
                                        </div>
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
