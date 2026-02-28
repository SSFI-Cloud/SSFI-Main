'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar,
    GraduationCap, Heart, Shield, Loader2, AlertCircle, CheckCircle,
    Users, Hash, Camera
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/lib/hooks/useAuth';

const BLOOD_GROUPS = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','O_POSITIVE','O_NEGATIVE','AB_POSITIVE','AB_NEGATIVE'];
const SKATE_CATEGORIES = ['SPEED_QUAD','SPEED_INLINE','RECREATIONAL','ARTISTIC','INLINE_HOCKEY','BEGINNER'];
const ACADEMIC_BOARDS = ['STATE','CBSE','ICSE','OTHER'];
const NOMINEE_RELATIONS = ['FATHER','MOTHER','GUARDIAN','OTHER'];

const formatBG = (bg: string) => bg.replace('_POSITIVE','+').replace('_NEGATIVE','-');

interface FormData {
    firstName: string; lastName: string; dateOfBirth: string; gender: string;
    bloodGroup: string; email: string; phone: string;
    fatherName: string; motherName: string; schoolName: string;
    academicBoard: string; className: string;
    nomineeName: string; nomineeAge: number; nomineeRelation: string; nomineePhone: string;
    coachName: string; categoryId: string;
    address: string; city: string; state: string; district: string; pincode: string;
}

export default function EditStudentPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [studentName, setStudentName] = useState('');
    const [ssfiId, setSsfiId] = useState('');

    const [form, setForm] = useState<FormData>({
        firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
        bloodGroup: '', email: '', phone: '',
        fatherName: '', motherName: '', schoolName: '',
        academicBoard: 'STATE', className: '',
        nomineeName: '', nomineeAge: 18, nomineeRelation: 'FATHER', nomineePhone: '',
        coachName: '', categoryId: '',
        address: '', city: '', state: '', district: '', pincode: '',
    });

    useEffect(() => {
        if (!token || !id) return;
        const fetchStudent = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`http://localhost:5001/api/v1/students/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const s = res.data?.data?.student || res.data?.data || res.data;
                setStudentName(`${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || '');
                setSsfiId(s.ssfi_id || s.uid || '');
                setForm({
                    firstName: s.first_name || s.name?.split(' ')[0] || '',
                    lastName: s.last_name || s.name?.split(' ').slice(1).join(' ') || '',
                    dateOfBirth: s.dob ? s.dob.split('T')[0] : '',
                    gender: s.gender || 'MALE',
                    bloodGroup: s.blood_group || '',
                    email: s.email || '',
                    phone: s.mobile || s.phone || '',
                    fatherName: s.father_name || '',
                    motherName: s.mother_name || '',
                    schoolName: s.school_name || '',
                    academicBoard: s.academic_board || 'STATE',
                    className: s.class_name || '',
                    nomineeName: s.nominee_name || '',
                    nomineeAge: s.nominee_age || 18,
                    nomineeRelation: s.nominee_relation || 'FATHER',
                    nomineePhone: s.nominee_phone || '',
                    coachName: s.coach_name || '',
                    categoryId: String(s.category_id || s.skate_category || ''),
                    address: s.address || '',
                    city: s.city || '',
                    state: s.state_name || s.state || '',
                    district: s.district_name || s.district || '',
                    pincode: s.pincode || '',
                });
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load student data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudent();
    }, [token, id]);

    const set = (field: keyof FormData, value: string | number) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            await axios.put(`http://localhost:5001/api/v1/students/${id}`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(true);
            setTimeout(() => router.push('/dashboard/students'), 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update student');
            setIsSaving(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow text-sm";
    const selectCls = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm";
    const labelCls = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

    if (isLoading) return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-3">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                <p className="text-gray-500 text-sm">Loading student data...</p>
            </div>
        </div>
    );

    if (error && !form.firstName) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-900 font-semibold">Failed to load student</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <Link href="/dashboard/students" className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600">
                Back to Students
            </Link>
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/students"
                        className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Edit Student</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            {studentName && <p className="text-sm text-gray-500">{studentName}</p>}
                            {ssfiId && <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100">#{ssfiId}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success banner */}
            {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-700 font-medium text-sm">Student updated successfully! Redirecting...</p>
                </motion.div>
            )}

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Personal Info */}
                <Section title="Personal Information" icon={User} color="blue">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>First Name *</label>
                            <input className={inputCls} value={form.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="First name" />
                        </div>
                        <div>
                            <label className={labelCls}>Last Name *</label>
                            <input className={inputCls} value={form.lastName} onChange={e => set('lastName', e.target.value)} required placeholder="Last name" />
                        </div>
                        <div>
                            <label className={labelCls}>Date of Birth *</label>
                            <input type="date" className={inputCls} value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />
                        </div>
                        <div>
                            <label className={labelCls}>Gender *</label>
                            <select className={selectCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Blood Group</label>
                            <select className={selectCls} value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                                <option value="">Select</option>
                                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{formatBG(bg)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Phone *</label>
                            <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="10-digit mobile" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelCls}>Email</label>
                            <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
                        </div>
                    </div>
                </Section>

                {/* Family & School */}
                <Section title="Family & School" icon={GraduationCap} color="green">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Father's Name *</label>
                            <input className={inputCls} value={form.fatherName} onChange={e => set('fatherName', e.target.value)} required placeholder="Father's full name" />
                        </div>
                        <div>
                            <label className={labelCls}>Mother's Name</label>
                            <input className={inputCls} value={form.motherName} onChange={e => set('motherName', e.target.value)} placeholder="Mother's full name" />
                        </div>
                        <div>
                            <label className={labelCls}>School Name</label>
                            <input className={inputCls} value={form.schoolName} onChange={e => set('schoolName', e.target.value)} placeholder="School / college name" />
                        </div>
                        <div>
                            <label className={labelCls}>Academic Board</label>
                            <select className={selectCls} value={form.academicBoard} onChange={e => set('academicBoard', e.target.value)}>
                                {ACADEMIC_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Class / Grade</label>
                            <input className={inputCls} value={form.className} onChange={e => set('className', e.target.value)} placeholder="e.g. 8th" />
                        </div>
                    </div>
                </Section>

                {/* Nominee */}
                <Section title="Nominee / Insurance" icon={Heart} color="red">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Nominee Name</label>
                            <input className={inputCls} value={form.nomineeName} onChange={e => set('nomineeName', e.target.value)} placeholder="Nominee full name" />
                        </div>
                        <div>
                            <label className={labelCls}>Relation</label>
                            <select className={selectCls} value={form.nomineeRelation} onChange={e => set('nomineeRelation', e.target.value)}>
                                {NOMINEE_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Nominee Age</label>
                            <input type="number" className={inputCls} value={form.nomineeAge} onChange={e => set('nomineeAge', Number(e.target.value))} min={1} max={120} />
                        </div>
                        <div>
                            <label className={labelCls}>Nominee Phone</label>
                            <input className={inputCls} value={form.nomineePhone} onChange={e => set('nomineePhone', e.target.value)} placeholder="10-digit number" />
                        </div>
                    </div>
                </Section>

                {/* Skating */}
                <Section title="Skating Details" icon={Shield} color="purple">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Coach Name</label>
                            <input className={inputCls} value={form.coachName} onChange={e => set('coachName', e.target.value)} placeholder="Coach's name" />
                        </div>
                        <div>
                            <label className={labelCls}>Skate Category</label>
                            <select className={selectCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                                <option value="">Select category</option>
                                {SKATE_CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Section>

                {/* Address */}
                <Section title="Address" icon={MapPin} color="amber">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className={labelCls}>Street Address</label>
                            <textarea className={`${inputCls} resize-none`} rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Door no, street, locality" />
                        </div>
                        <div>
                            <label className={labelCls}>City</label>
                            <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
                        </div>
                        <div>
                            <label className={labelCls}>Pincode</label>
                            <input className={inputCls} value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="6-digit pincode" />
                        </div>
                        <div>
                            <label className={labelCls}>District</label>
                            <input className={inputCls} value={form.district} readOnly placeholder="Auto-filled from club" />
                        </div>
                        <div>
                            <label className={labelCls}>State</label>
                            <input className={inputCls} value={form.state} readOnly placeholder="Auto-filled from club" />
                        </div>
                    </div>
                </Section>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={isSaving || success}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <Link href="/dashboard/students"
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

function Section({ title, icon: Icon, color, children }: {
    title: string; icon: any; color: 'blue'|'green'|'red'|'purple'|'amber'; children: React.ReactNode
}) {
    const colors = {
        blue:   'from-blue-500 to-indigo-600',
        green:  'from-green-500 to-emerald-600',
        red:    'from-red-500 to-rose-600',
        purple: 'from-purple-500 to-violet-600',
        amber:  'from-amber-400 to-orange-500',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}
