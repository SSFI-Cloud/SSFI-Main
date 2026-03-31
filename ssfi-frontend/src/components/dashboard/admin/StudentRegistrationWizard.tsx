'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, User, Home, Shield, Users, MapPin,
    FileText, CheckCircle, AlertCircle, Loader2, CreditCard,
    Upload, Copy, Check, X,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { BLOOD_GROUPS } from '@/types/student';

const STEPS = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Family & School', icon: Home },
    { number: 3, title: 'Nominee', icon: Shield },
    { number: 4, title: 'Club & Coach', icon: Users },
    { number: 5, title: 'Address', icon: MapPin },
    { number: 6, title: 'Documents', icon: FileText },
    { number: 7, title: 'Payment', icon: CreditCard },
];

const NOMINEE_RELATIONS = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Guardian', 'Other'];
const ACADEMIC_BOARDS = [
    { value: 'STATE', label: 'State Board' },
    { value: 'CBSE', label: 'CBSE' },
    { value: 'ICSE', label: 'ICSE' },
    { value: 'NIOS', label: 'NIOS' },
    { value: 'IB', label: 'IB' },
    { value: 'OTHER', label: 'Other' },
];
const FATHER_OCCUPATIONS = [
    'Government Employee', 'Private Employee', 'Self Employed', 'Business',
    'Farmer', 'Doctor', 'Engineer', 'Teacher', 'Retired', 'Other',
];
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function StudentRegistrationWizard() {
    const router = useRouter();
    const { token } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

    // Payment
    const [paymentMode, setPaymentMode] = useState<'offline' | 'online'>('offline');
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    // Club cascade
    const [clubStates, setClubStates] = useState<any[]>([]);
    const [clubDistricts, setClubDistricts] = useState<any[]>([]);
    const [clubsList, setClubsList] = useState<any[]>([]);
    const [clubStateId, setClubStateId] = useState('');
    const [clubDistrictId, setClubDistrictId] = useState('');
    const [clubMode, setClubMode] = useState<'club' | 'school'>('club');

    const [formData, setFormData] = useState({
        // Step 1: Personal
        firstName: '',
        dateOfBirth: '',
        gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
        bloodGroup: '',
        phone: '',
        email: '',
        // Step 2: Family & School
        fatherName: '',
        motherName: '',
        fatherOccupation: '',
        schoolName: '',
        academicBoard: 'STATE',
        // Step 3: Nominee
        nomineeName: '',
        nomineeRelation: 'Father',
        nomineeAge: 18,
        nomineePhone: '',
        // Step 4: Club & Coach
        clubId: '',
        coachName: '',
        coachPhone: '',
        // Step 5: Address
        addressLine1: '',
        addressLine2: '',
        city: '',
        addressState: '',
        pincode: '',
        // Step 6: Documents
        profilePhoto: '' as string,
        birthCertificate: '' as string,
        aadhaarNumber: '',
        termsAccepted: false,
    });

    // Fetch states for club cascade
    useEffect(() => {
        api.get('/locations/states').then(res => {
            const data = res.data?.data || res.data;
            setClubStates(Array.isArray(data) ? data : []);
        }).catch(() => {});
    }, []);

    // Fetch districts when club state changes
    useEffect(() => {
        if (!clubStateId) { setClubDistricts([]); setClubsList([]); return; }
        setClubDistrictId('');
        updateField('clubId', '');
        api.get(`/locations/states/${clubStateId}/districts`).then(res => {
            const data = res.data?.data || res.data;
            setClubDistricts(Array.isArray(data) ? data : []);
        }).catch(() => {});
    }, [clubStateId]);

    // Fetch clubs when club district changes
    useEffect(() => {
        if (!clubDistrictId) { setClubsList([]); return; }
        updateField('clubId', '');
        api.get(`/locations/districts/${clubDistrictId}/clubs`).then(res => {
            const data = res.data?.data || res.data;
            setClubsList(Array.isArray(data) ? data : []);
        }).catch(() => {});
    }, [clubDistrictId]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setStepErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const calculateAge = (dob: string) => {
        if (!dob) return '';
        const birth = new Date(dob);
        const jan1 = new Date(new Date().getFullYear(), 0, 1);
        let age = jan1.getFullYear() - birth.getFullYear();
        const m = jan1.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && jan1.getDate() < birth.getDate())) age--;
        return age > 0 ? `${age} years` : '';
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (file.size > 5 * 1024 * 1024) return reject(new Error('File must be under 5MB'));
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileUpload = async (field: 'profilePhoto' | 'birthCertificate', file: File) => {
        try {
            const base64 = await fileToBase64(file);
            updateField(field, base64);
        } catch (err: any) {
            toast.error(err.message || 'File upload failed');
        }
    };

    const validateStep = (step: number): boolean => {
        const errs: Record<string, string> = {};

        if (step === 1) {
            if (!formData.firstName.trim()) errs.firstName = 'Full name is required';
            if (!formData.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
            if (!formData.phone.trim()) errs.phone = 'Phone number is required';
            else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) errs.phone = 'Enter valid 10-digit mobile';
            if (!formData.bloodGroup) errs.bloodGroup = 'Blood group is required';
        } else if (step === 2) {
            if (!formData.fatherName.trim()) errs.fatherName = "Father's name is required";
            if (!formData.motherName.trim()) errs.motherName = "Mother's name is required";
        } else if (step === 3) {
            if (!formData.nomineeName.trim()) errs.nomineeName = 'Nominee name is required';
            if (!formData.nomineePhone.trim()) errs.nomineePhone = 'Nominee phone is required';
            else if (!/^[6-9]\d{9}$/.test(formData.nomineePhone.trim())) errs.nomineePhone = 'Enter valid 10-digit mobile';
            if (formData.nomineeAge < 18) errs.nomineeAge = 'Nominee must be 18+';
        } else if (step === 4) {
            if (clubMode === 'club' && !formData.clubId) errs.clubId = 'Please select a club';
            if (clubMode === 'school' && !formData.schoolName?.trim()) errs.schoolName = 'School name required (from Step 2)';
        } else if (step === 5) {
            if (!formData.addressLine1.trim()) errs.addressLine1 = 'Address is required';
            if (!formData.city.trim()) errs.city = 'City is required';
            if (!formData.addressState) errs.addressState = 'State is required';
            if (!formData.pincode.trim()) errs.pincode = 'Pincode is required';
            else if (!/^\d{6}$/.test(formData.pincode.trim())) errs.pincode = 'Enter valid 6-digit pincode';
        } else if (step === 6) {
            if (!formData.termsAccepted) errs.termsAccepted = 'You must accept the terms';
        }

        setStepErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) return;
        if (currentStep < 7) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const buildPayload = () => ({
        name: formData.firstName.trim(),
        firstName: formData.firstName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        dob: formData.dateOfBirth,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        fatherName: formData.fatherName.trim(),
        motherName: formData.motherName.trim(),
        fatherOccupation: formData.fatherOccupation || undefined,
        schoolName: formData.schoolName.trim() || undefined,
        academicBoard: formData.academicBoard,
        nomineeName: formData.nomineeName.trim(),
        nomineeRelation: formData.nomineeRelation,
        nomineeAge: formData.nomineeAge,
        nomineePhone: formData.nomineePhone.trim(),
        clubId: Number(formData.clubId),
        coachName: formData.coachName.trim() || undefined,
        coachPhone: formData.coachPhone.trim() || undefined,
        address: formData.addressLine1.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        aadhaarNumber: formData.aadhaarNumber.trim() || undefined,
        profilePhoto: formData.profilePhoto || undefined,
        birthCertificate: formData.birthCertificate || undefined,
        termsAccepted: true,
        kycVerified: false,
    });

    const handleSubmit = async () => {
        if (!validateStep(6)) { setCurrentStep(6); return; }
        setIsLoading(true);
        setError(null);

        try {
            if (paymentMode === 'offline') {
                const payload = buildPayload();
                await api.post('/students', payload);
                setSuccess(true);
                toast.success('Student registered successfully!');
                setTimeout(() => router.push('/dashboard/students'), 2000);
            } else {
                // Online: initiate registration + Razorpay order
                const payload = buildPayload();
                const res = await api.post('/affiliations/student/initiate', payload);
                const order = res.data?.data || res.data;

                if (order?.razorpayOrderId) {
                    const link = `${window.location.origin}/register/payment?orderId=${order.razorpayOrderId}&amount=${order.amount}&name=${encodeURIComponent(order.userDetails?.name || formData.firstName)}&uid=${encodeURIComponent(order.uid || '')}&type=student&key=${order.key}`;
                    setPaymentLink(link);
                    setSuccess(true);
                    toast.success('Registration initiated! Share the payment link.');
                } else {
                    throw new Error('Failed to create payment order');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const copyLink = () => {
        if (!paymentLink) return;
        navigator.clipboard.writeText(paymentLink);
        setLinkCopied(true);
        toast.success('Payment link copied!');
        setTimeout(() => setLinkCopied(false), 3000);
    };

    const inputClass = (field: string) =>
        `w-full px-4 py-3 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${stepErrors[field] ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`;

    const labelClass = 'block text-sm font-medium text-gray-600 mb-1.5';

    const FieldError = ({ field }: { field: string }) =>
        stepErrors[field] ? <p className="mt-1 text-xs text-red-500">{stepErrors[field]}</p> : null;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/students" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Registration</h1>
                    <p className="text-gray-500">Complete all steps to register a new skater</p>
                </div>
            </div>

            {/* Progress */}
            <div className="mb-8 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[600px]">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.number;
                        const isCompleted = currentStep > step.number;
                        return (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <button
                                        type="button"
                                        onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isCompleted ? 'bg-green-500 text-white cursor-pointer' : isActive ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                    </button>
                                    <span className={`text-xs mt-2 font-medium whitespace-nowrap ${isActive ? 'text-emerald-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                        {step.title}
                                    </span>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-100'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success with payment link */}
            {success && paymentLink && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl space-y-4">
                    <div className="flex items-center gap-3 text-green-700">
                        <CheckCircle className="w-6 h-6" />
                        <div>
                            <p className="font-semibold">Registration Initiated!</p>
                            <p className="text-sm text-green-600">Share the payment link below with the student to complete registration.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="text" readOnly value={paymentLink}
                            className="flex-1 px-3 py-2 bg-white border border-green-200 rounded-lg text-sm text-gray-700 truncate" />
                        <button onClick={copyLink}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm whitespace-nowrap">
                            {linkCopied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Link</>}
                        </button>
                    </div>
                    <Link href="/dashboard/students" className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Students
                    </Link>
                </motion.div>
            )}

            {success && !paymentLink && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    Student registered successfully! Redirecting...
                </motion.div>
            )}

            {/* Form */}
            {!success && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Step header */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center gap-3">
                        {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="w-5 h-5 text-emerald-600" />; })()}
                        <h2 className="font-semibold text-gray-900">{STEPS[currentStep - 1].title}</h2>
                    </div>

                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

                                {/* Step 1: Personal Info */}
                                {currentStep === 1 && (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Full Name (as per Aadhaar) *</label>
                                                <input type="text" value={formData.firstName} onChange={e => updateField('firstName', e.target.value)}
                                                    placeholder="Enter full name" className={inputClass('firstName')} />
                                                <FieldError field="firstName" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Date of Birth *</label>
                                                <input type="date" value={formData.dateOfBirth} onChange={e => updateField('dateOfBirth', e.target.value)}
                                                    className={inputClass('dateOfBirth')} />
                                                {formData.dateOfBirth && (
                                                    <p className="mt-1 text-xs text-emerald-600">Age: {calculateAge(formData.dateOfBirth)}</p>
                                                )}
                                                <FieldError field="dateOfBirth" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Gender *</label>
                                                <div className="flex gap-3 mt-1">
                                                    {['MALE', 'FEMALE', 'OTHER'].map(g => (
                                                        <button key={g} type="button" onClick={() => updateField('gender', g)}
                                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${formData.gender === g ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                                            {g.charAt(0) + g.slice(1).toLowerCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Blood Group *</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {BLOOD_GROUPS.map(bg => (
                                                        <button key={bg} type="button" onClick={() => updateField('bloodGroup', bg)}
                                                            className={`py-2 rounded-lg text-sm font-medium border transition-all ${formData.bloodGroup === bg ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                                            {bg}
                                                        </button>
                                                    ))}
                                                </div>
                                                <FieldError field="bloodGroup" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Phone Number *</label>
                                                <div className="flex">
                                                    <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm">+91</span>
                                                    <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                        placeholder="10-digit mobile" className={`${inputClass('phone')} rounded-l-none`} />
                                                </div>
                                                <FieldError field="phone" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Email (optional)</label>
                                                <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)}
                                                    placeholder="student@email.com" className={inputClass('email')} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Family & School */}
                                {currentStep === 2 && (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Father's Name *</label>
                                                <input type="text" value={formData.fatherName} onChange={e => updateField('fatherName', e.target.value)}
                                                    placeholder="Father's full name" className={inputClass('fatherName')} />
                                                <FieldError field="fatherName" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Mother's Name *</label>
                                                <input type="text" value={formData.motherName} onChange={e => updateField('motherName', e.target.value)}
                                                    placeholder="Mother's full name" className={inputClass('motherName')} />
                                                <FieldError field="motherName" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Father's Occupation</label>
                                                <select value={formData.fatherOccupation} onChange={e => updateField('fatherOccupation', e.target.value)}
                                                    className={inputClass('fatherOccupation')}>
                                                    <option value="">Select occupation</option>
                                                    {FATHER_OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>School / College Name</label>
                                                <input type="text" value={formData.schoolName} onChange={e => updateField('schoolName', e.target.value)}
                                                    placeholder="School or college name" className={inputClass('schoolName')} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Academic Board</label>
                                                <select value={formData.academicBoard} onChange={e => updateField('academicBoard', e.target.value)}
                                                    className={inputClass('academicBoard')}>
                                                    {ACADEMIC_BOARDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Nominee */}
                                {currentStep === 3 && (
                                    <div className="space-y-5">
                                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                            <p className="text-sm text-amber-700">The nominee will receive insurance benefits in case of any unfortunate event during skating activities.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Nominee Full Name *</label>
                                                <input type="text" value={formData.nomineeName} onChange={e => updateField('nomineeName', e.target.value)}
                                                    placeholder="Nominee's full name" className={inputClass('nomineeName')} />
                                                <FieldError field="nomineeName" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Relation *</label>
                                                <select value={formData.nomineeRelation} onChange={e => updateField('nomineeRelation', e.target.value)}
                                                    className={inputClass('nomineeRelation')}>
                                                    {NOMINEE_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Nominee Age *</label>
                                                <input type="number" min={18} max={100} value={formData.nomineeAge}
                                                    onChange={e => updateField('nomineeAge', Number(e.target.value))}
                                                    className={inputClass('nomineeAge')} />
                                                <FieldError field="nomineeAge" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Nominee Phone *</label>
                                                <div className="flex">
                                                    <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm">+91</span>
                                                    <input type="tel" value={formData.nomineePhone}
                                                        onChange={e => updateField('nomineePhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                        placeholder="10-digit mobile" className={`${inputClass('nomineePhone')} rounded-l-none`} />
                                                </div>
                                                <FieldError field="nomineePhone" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Club & Coach */}
                                {currentStep === 4 && (
                                    <div className="space-y-5">
                                        {/* Club/School toggle */}
                                        <div className="flex rounded-xl bg-gray-50 border border-gray-200 p-1">
                                            <button type="button" onClick={() => setClubMode('club')}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${clubMode === 'club' ? 'bg-white shadow-sm text-emerald-700 border border-emerald-200' : 'text-gray-500'}`}>
                                                Skating Club
                                            </button>
                                            <button type="button" onClick={() => setClubMode('school')}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${clubMode === 'school' ? 'bg-white shadow-sm text-emerald-700 border border-emerald-200' : 'text-gray-500'}`}>
                                                School Team
                                            </button>
                                        </div>

                                        {clubMode === 'club' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className={labelClass}>State *</label>
                                                    <select value={clubStateId} onChange={e => setClubStateId(e.target.value)}
                                                        className={inputClass('clubState')}>
                                                        <option value="">Select State</option>
                                                        {clubStates.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>District *</label>
                                                    <select value={clubDistrictId} onChange={e => setClubDistrictId(e.target.value)}
                                                        disabled={!clubStateId} className={inputClass('clubDistrict')}>
                                                        <option value="">Select District</option>
                                                        {clubDistricts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Club *</label>
                                                    <select value={formData.clubId} onChange={e => updateField('clubId', e.target.value)}
                                                        disabled={!clubDistrictId} className={inputClass('clubId')}>
                                                        <option value="">Select Club</option>
                                                        {clubsList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                    <FieldError field="clubId" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                                <p className="text-sm text-blue-700">
                                                    School: <strong>{formData.schoolName || 'Not entered (go to Step 2)'}</strong>
                                                </p>
                                                <p className="text-xs text-blue-500 mt-1">The school name from Step 2 will be used as the training institution.</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <label className={labelClass}>Coach Name</label>
                                                <input type="text" value={formData.coachName} onChange={e => updateField('coachName', e.target.value)}
                                                    placeholder="Coach's name" className={inputClass('coachName')} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Coach Phone</label>
                                                <input type="tel" value={formData.coachPhone}
                                                    onChange={e => updateField('coachPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                    placeholder="Coach's mobile number" className={inputClass('coachPhone')} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 5: Address */}
                                {currentStep === 5 && (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Address Line 1 *</label>
                                                <input type="text" value={formData.addressLine1} onChange={e => updateField('addressLine1', e.target.value)}
                                                    placeholder="House no., Street, Area" className={inputClass('addressLine1')} />
                                                <FieldError field="addressLine1" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Address Line 2</label>
                                                <input type="text" value={formData.addressLine2} onChange={e => updateField('addressLine2', e.target.value)}
                                                    placeholder="Landmark, Colony (optional)" className={inputClass('addressLine2')} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>City / Town *</label>
                                                <input type="text" value={formData.city} onChange={e => updateField('city', e.target.value)}
                                                    placeholder="City or town" className={inputClass('city')} />
                                                <FieldError field="city" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>State / UT *</label>
                                                <select value={formData.addressState} onChange={e => updateField('addressState', e.target.value)}
                                                    className={inputClass('addressState')}>
                                                    <option value="">Select State</option>
                                                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <FieldError field="addressState" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Pincode *</label>
                                                <input type="text" value={formData.pincode}
                                                    onChange={e => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    placeholder="6-digit pincode" className={inputClass('pincode')} />
                                                <FieldError field="pincode" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 6: Documents */}
                                {currentStep === 6 && (
                                    <div className="space-y-5">
                                        <div>
                                            <label className={labelClass}>Aadhaar Number</label>
                                            <input type="text" value={formData.aadhaarNumber}
                                                onChange={e => updateField('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                                                placeholder="12-digit Aadhaar number" className={inputClass('aadhaarNumber')} />
                                        </div>

                                        {/* Profile Photo */}
                                        <div>
                                            <label className={labelClass}>Profile Photo</label>
                                            <div className="flex items-center gap-4">
                                                {formData.profilePhoto ? (
                                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                                                        <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => updateField('profilePhoto', '')}
                                                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                        <span className="text-sm text-gray-500">Click to upload photo</span>
                                                        <span className="text-xs text-gray-400 mt-1">JPG, PNG (max 5MB)</span>
                                                        <input type="file" accept="image/*" className="hidden"
                                                            onChange={e => e.target.files?.[0] && handleFileUpload('profilePhoto', e.target.files[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* Birth Certificate */}
                                        <div>
                                            <label className={labelClass}>Birth Certificate</label>
                                            <div className="flex items-center gap-4">
                                                {formData.birthCertificate ? (
                                                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl w-full">
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                        <span className="text-sm text-green-700 flex-1">Birth certificate uploaded</span>
                                                        <button type="button" onClick={() => updateField('birthCertificate', '')}
                                                            className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                        <span className="text-sm text-gray-500">Click to upload birth certificate</span>
                                                        <span className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (max 5MB)</span>
                                                        <input type="file" accept="image/*,.pdf" className="hidden"
                                                            onChange={e => e.target.files?.[0] && handleFileUpload('birthCertificate', e.target.files[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input type="checkbox" checked={formData.termsAccepted}
                                                    onChange={e => updateField('termsAccepted', e.target.checked)}
                                                    className="mt-0.5 w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500/50" />
                                                <span className="text-sm text-gray-600">
                                                    I confirm all information is accurate and accept the <a href="/terms" target="_blank" className="text-emerald-600 hover:underline">Terms & Conditions</a> and <a href="/privacy" target="_blank" className="text-emerald-600 hover:underline">Privacy Policy</a>.
                                                </span>
                                            </label>
                                            <FieldError field="termsAccepted" />
                                        </div>
                                    </div>
                                )}

                                {/* Step 7: Payment */}
                                {currentStep === 7 && (
                                    <div className="space-y-6">
                                        {/* Summary */}
                                        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                                            <h3 className="font-semibold text-gray-900">Registration Summary</h3>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                                <div><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{formData.firstName}</span></div>
                                                <div><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{formData.phone}</span></div>
                                                <div><span className="text-gray-500">DOB:</span> <span className="font-medium text-gray-900">{formData.dateOfBirth}</span></div>
                                                <div><span className="text-gray-500">Gender:</span> <span className="font-medium text-gray-900">{formData.gender}</span></div>
                                                <div><span className="text-gray-500">Father:</span> <span className="font-medium text-gray-900">{formData.fatherName}</span></div>
                                                <div><span className="text-gray-500">Club:</span> <span className="font-medium text-gray-900">{clubsList.find(c => String(c.id) === String(formData.clubId))?.name || formData.schoolName || '—'}</span></div>
                                            </div>
                                        </div>

                                        {/* Payment mode */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-3">Payment Mode</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button type="button" onClick={() => setPaymentMode('offline')}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMode === 'offline' ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'}`}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMode === 'offline' ? 'border-emerald-500' : 'border-gray-300'}`}>
                                                            {paymentMode === 'offline' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                                                        </div>
                                                        <span className="font-semibold text-gray-900">Offline Payment</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 ml-8">Register now, collect payment separately (cash/UPI/bank transfer)</p>
                                                </button>
                                                <button type="button" onClick={() => setPaymentMode('online')}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMode === 'online' ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'}`}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMode === 'online' ? 'border-emerald-500' : 'border-gray-300'}`}>
                                                            {paymentMode === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                                                        </div>
                                                        <span className="font-semibold text-gray-900">Online Payment</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 ml-8">Generate a Razorpay payment link to share with the student</p>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                        <button type="button" onClick={handleBack} disabled={currentStep === 1}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 hover:bg-white border border-gray-200'}`}>
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        {currentStep < 7 ? (
                            <button type="button" onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-medium text-sm shadow-sm">
                                Next <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit} disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium text-sm shadow-sm disabled:opacity-50">
                                {isLoading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                ) : paymentMode === 'offline' ? (
                                    <><CheckCircle className="w-5 h-5" /> Register Student</>
                                ) : (
                                    <><CreditCard className="w-5 h-5" /> Generate Payment Link</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
