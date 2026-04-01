'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Building2, User, Mail, Phone, MapPin,
    Camera, Shield, Upload, Loader2, CheckCircle, AlertCircle,
    CreditCard, Copy, Check, X,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const GENDERS = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
];

export default function NewDistrictPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Payment
    const [paymentMode, setPaymentMode] = useState<'offline' | 'online'>('offline');
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    // Cascading location
    const [states, setStates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);

    // File previews
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [regCopyPreview, setRegCopyPreview] = useState<string | null>(null);
    const photoRef = useRef<HTMLInputElement>(null);
    const logoRef = useRef<HTMLInputElement>(null);
    const regCopyRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        // Location
        stateId: '',
        // Secretary personal details
        secretaryName: '',
        secretaryGender: 'MALE',
        districtId: '',
        associationName: '',
        secretaryEmail: '',
        secretaryPhone: '',
        residentialAddress: '',
        // Documents
        profilePhoto: '',
        associationLogo: '',
        registrationCopy: '',
        termsAccepted: false,
    });

    // Fetch states
    useEffect(() => {
        api.get('/locations/states').then(res => {
            const data = res.data?.data || res.data;
            setStates(Array.isArray(data) ? data : []);
        }).catch(() => {});
    }, []);

    // Fetch districts when state changes
    useEffect(() => {
        if (!formData.stateId) { setDistricts([]); return; }
        api.get(`/locations/states/${formData.stateId}/districts`).then(res => {
            const data = res.data?.data || res.data;
            setDistricts(Array.isArray(data) ? data : []);
        }).catch(() => {});
    }, [formData.stateId]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const handleFileUpload = (field: string, setPreview: (v: string | null) => void) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
            const reader = new FileReader();
            reader.onloadend = () => {
                const b64 = reader.result as string;
                setPreview(b64);
                updateField(field, b64);
            };
            reader.readAsDataURL(file);
        };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!formData.stateId) errs.stateId = 'Please select a state';
        if (!formData.districtId) errs.districtId = 'Please select a district';
        if (!formData.secretaryName.trim()) errs.secretaryName = 'Secretary name is required';
        if (!formData.secretaryEmail.trim()) errs.secretaryEmail = 'Email is required';
        if (!formData.secretaryPhone.trim()) errs.secretaryPhone = 'Phone is required';
        else if (!/^[6-9]\d{9}$/.test(formData.secretaryPhone.trim())) errs.secretaryPhone = 'Enter valid 10-digit mobile';
        if (!formData.residentialAddress.trim() || formData.residentialAddress.trim().length < 10) errs.residentialAddress = 'Address must be at least 10 characters';
        if (!formData.profilePhoto) errs.profilePhoto = 'Profile photo is required';
        if (!formData.associationLogo) errs.associationLogo = 'Association logo is required';
        if (!formData.registrationCopy) errs.registrationCopy = 'Registration certificate is required';
        if (!formData.termsAccepted) errs.termsAccepted = 'You must accept the terms';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsLoading(true);
        setError(null);

        try {
            const payload: any = {
                // Location
                stateId: Number(formData.stateId),
                districtId: Number(formData.districtId),
                // Secretary
                secretaryName: formData.secretaryName.trim(),
                secretaryGender: formData.secretaryGender,
                secretaryEmail: formData.secretaryEmail.trim(),
                secretaryPhone: formData.secretaryPhone.trim(),
                secretaryAddress: formData.residentialAddress.trim(),
                associationName: formData.associationName.trim() || undefined,
                // Documents
                profilePhoto: formData.profilePhoto,
                logo: formData.associationLogo,
                associationRegistrationCopy: formData.registrationCopy,
                termsAccepted: true,
            };

            if (paymentMode === 'offline') {
                await api.post('/districts', payload);
                setSuccess(true);
                toast.success('District created successfully!');
                setTimeout(() => router.push('/dashboard/districts'), 2000);
            } else {
                const affiliationPayload = {
                    name: formData.secretaryName.trim(),
                    gender: formData.secretaryGender,
                    email: formData.secretaryEmail.trim(),
                    phone: formData.secretaryPhone.trim(),
                    stateId: formData.stateId,
                    districtId: formData.districtId,
                    residentialAddress: formData.residentialAddress.trim(),
                    associationName: formData.associationName.trim() || undefined,
                    profilePhoto: formData.profilePhoto,
                    logo: formData.associationLogo,
                    associationRegistrationCopy: formData.registrationCopy,
                    termsAccepted: true,
                };

                const res = await api.post('/affiliations/district-secretary/initiate', affiliationPayload);
                const order = res.data?.data || res.data;
                if (order?.razorpayOrderId) {
                    const link = `${window.location.origin}/register/payment?orderId=${order.razorpayOrderId}&amount=${order.amount}&name=${encodeURIComponent(formData.secretaryName)}&uid=${encodeURIComponent(order.uid || '')}&type=district-secretary&key=${order.key}`;
                    setPaymentLink(link);
                    setSuccess(true);
                    toast.success('Registration initiated! Share the payment link.');
                } else {
                    throw new Error('Failed to create payment order');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to create district');
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
        `w-full px-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all ${fieldErrors[field] ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`;

    const labelClass = 'block text-xs font-medium text-gray-600 mb-1.5';

    const FieldError = ({ field }: { field: string }) =>
        fieldErrors[field] ? <p className="mt-1 text-xs text-red-500">{fieldErrors[field]}</p> : null;

    const PhotoBox = ({ preview, onUpload, onRemove, label, field }: {
        preview: string | null; onUpload: () => void; onRemove: () => void; label: string; field: string;
    }) => preview ? (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <button type="button" onClick={onRemove} className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600">
                <X className="w-3 h-3" />
            </button>
        </div>
    ) : (
        <div onClick={onUpload} className={`w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 transition-all flex-shrink-0 ${fieldErrors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50'}`}>
            <Camera className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-500 text-center leading-tight">{label}</span>
        </div>
    );

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/districts" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New District</h1>
                    <p className="text-gray-500">Register a new district with secretary details</p>
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
                            <p className="text-sm text-green-600">Share the payment link below with the district secretary.</p>
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
                    <Link href="/dashboard/districts" className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Districts
                    </Link>
                </motion.div>
            )}

            {success && !paymentLink && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    District created successfully! Redirecting...
                </motion.div>
            )}

            {/* Form */}
            {!success && (
                <div className="space-y-4">
                    {/* Secretary Details */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50">
                            <User className="w-4 h-4 text-emerald-500" />
                            <h2 className="font-semibold text-gray-900 text-sm">District Secretary Details</h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Full Name *</label>
                                <input type="text" value={formData.secretaryName}
                                    onChange={e => updateField('secretaryName', e.target.value)}
                                    placeholder="Enter secretary's full name" className={inputClass('secretaryName')} />
                                <FieldError field="secretaryName" />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Association Name *</label>
                                <input type="text" value={formData.associationName}
                                    onChange={e => updateField('associationName', e.target.value)}
                                    placeholder="e.g., District Skating Association" className={inputClass('associationName')} />
                                <FieldError field="associationName" />
                            </div>
                            <div>
                                <label className={labelClass}>Gender *</label>
                                <div className="flex gap-2">
                                    {GENDERS.map(g => (
                                        <button key={g.value} type="button" onClick={() => updateField('secretaryGender', g.value)}
                                            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${formData.secretaryGender === g.value ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>State *</label>
                                <select value={formData.stateId} onChange={e => { updateField('stateId', e.target.value); updateField('districtId', ''); }}
                                    className={inputClass('stateId')}>
                                    <option value="">Select State</option>
                                    {states.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <FieldError field="stateId" />
                            </div>
                            <div>
                                <label className={labelClass}>District *</label>
                                <select value={formData.districtId} onChange={e => updateField('districtId', e.target.value)}
                                    disabled={!formData.stateId}
                                    className={`${inputClass('districtId')} ${!formData.stateId ? 'opacity-50' : ''}`}>
                                    <option value="">Select District</option>
                                    {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <FieldError field="districtId" />
                            </div>
                            <div>
                                <label className={labelClass}>Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="email" value={formData.secretaryEmail}
                                        onChange={e => updateField('secretaryEmail', e.target.value)}
                                        placeholder="secretary@email.com" className={`${inputClass('secretaryEmail')} pl-9`} />
                                </div>
                                <FieldError field="secretaryEmail" />
                            </div>
                            <div>
                                <label className={labelClass}>Mobile Number *</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm">+91</span>
                                    <input type="tel" value={formData.secretaryPhone}
                                        onChange={e => updateField('secretaryPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="10-digit number" className={`${inputClass('secretaryPhone')} rounded-l-none`} />
                                </div>
                                <FieldError field="secretaryPhone" />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Residential Address *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <textarea value={formData.residentialAddress}
                                        onChange={e => updateField('residentialAddress', e.target.value)}
                                        rows={2} placeholder="Enter complete residential address"
                                        className={`${inputClass('residentialAddress')} pl-9 resize-none`} />
                                </div>
                                <FieldError field="residentialAddress" />
                            </div>
                        </div>
                    </div>

                    {/* Documents & Photos */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50">
                            <Upload className="w-4 h-4 text-emerald-500" />
                            <h2 className="font-semibold text-gray-900 text-sm">Documents & Photos</h2>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col items-center gap-1.5">
                                    <PhotoBox preview={photoPreview} onUpload={() => photoRef.current?.click()}
                                        onRemove={() => { setPhotoPreview(null); updateField('profilePhoto', ''); }}
                                        label="Profile Photo" field="profilePhoto" />
                                    <span className="text-xs text-gray-500 font-medium text-center">Profile Photo *</span>
                                    <input ref={photoRef} type="file" accept="image/*"
                                        onChange={handleFileUpload('profilePhoto', setPhotoPreview)} className="hidden" />
                                    <FieldError field="profilePhoto" />
                                </div>
                                <div className="flex flex-col items-center gap-1.5">
                                    <PhotoBox preview={logoPreview} onUpload={() => logoRef.current?.click()}
                                        onRemove={() => { setLogoPreview(null); updateField('associationLogo', ''); }}
                                        label="Assoc. Logo" field="associationLogo" />
                                    <span className="text-xs text-gray-500 font-medium text-center">Association Logo *</span>
                                    <input ref={logoRef} type="file" accept="image/*"
                                        onChange={handleFileUpload('associationLogo', setLogoPreview)} className="hidden" />
                                    <FieldError field="associationLogo" />
                                </div>
                                <div className="flex flex-col items-center gap-1.5">
                                    {regCopyPreview ? (
                                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center bg-emerald-50 flex-shrink-0">
                                            <Check className="w-6 h-6 text-emerald-500" />
                                            <button type="button" onClick={() => { setRegCopyPreview(null); updateField('registrationCopy', ''); }}
                                                className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div onClick={() => regCopyRef.current?.click()}
                                            className={`w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 transition-all flex-shrink-0 ${fieldErrors.registrationCopy ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                                            <Shield className="w-5 h-5 text-gray-400" />
                                            <span className="text-[10px] text-gray-500 text-center leading-tight">Reg. Copy</span>
                                        </div>
                                    )}
                                    <span className="text-xs text-gray-500 font-medium text-center">Reg. Certificate *</span>
                                    <input ref={regCopyRef} type="file" accept="image/*,.pdf"
                                        onChange={handleFileUpload('registrationCopy', setRegCopyPreview)} className="hidden" />
                                    <FieldError field="registrationCopy" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 text-center mt-3">JPG, PNG up to 5MB each. Registration certificate can also be PDF.</p>
                        </div>
                    </div>

                    {/* Terms & Payment */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                            <h2 className="font-semibold text-gray-900">Terms & Payment</h2>
                        </div>
                        <div className="p-6 space-y-5">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={formData.termsAccepted}
                                    onChange={e => updateField('termsAccepted', e.target.checked)}
                                    className="mt-0.5 w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500/50" />
                                <span className="text-sm text-gray-600">
                                    I declare that all information provided is accurate. I agree to SSFI&apos;s{' '}
                                    <a href="/terms" target="_blank" className="text-emerald-600 hover:underline">Terms &amp; Conditions</a> and{' '}
                                    <a href="/privacy" target="_blank" className="text-emerald-600 hover:underline">Privacy Policy</a>.
                                </span>
                            </label>
                            <FieldError field="termsAccepted" />

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
                                        <p className="text-sm text-gray-500 ml-8">Register now, collect payment separately</p>
                                    </button>
                                    <button type="button" onClick={() => setPaymentMode('online')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMode === 'online' ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMode === 'online' ? 'border-emerald-500' : 'border-gray-300'}`}>
                                                {paymentMode === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                                            </div>
                                            <span className="font-semibold text-gray-900">Online Payment</span>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-8">Generate Razorpay link to share</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-2">
                        <Link href="/dashboard/districts"
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-center text-sm">
                            Cancel
                        </Link>
                        <button type="button" onClick={handleSubmit} disabled={isLoading}
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-50">
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                            ) : paymentMode === 'offline' ? (
                                <><CheckCircle className="w-5 h-5" /> Create District</>
                            ) : (
                                <><CreditCard className="w-5 h-5" /> Generate Payment Link</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
