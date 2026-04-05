'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Users, User, Phone, Mail, MapPin, Hash,
    Calendar, Loader2, CheckCircle, AlertCircle, Upload,
    CreditCard, Copy, Check, X,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function NewClubPage() {
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

    // Location cascade
    const [states, setStates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);

    // Logo
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        clubName: '',
        registrationNumber: '',
        establishedYear: new Date().getFullYear().toString(),
        stateId: '',
        districtId: '',
        address: '',
        contactPersonName: '',
        phone: '',
        email: '',
        clubLogo: '',
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
        updateField('districtId', '');
        api.get(`/locations/states/${formData.stateId}/districts`).then(res => {
            const data = res.data?.data || res.data;
            setDistricts(Array.isArray(data) ? data : []);
        }).catch(() => {});
    }, [formData.stateId]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
            updateField('clubLogo', reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!formData.clubName.trim()) errs.clubName = 'Club name is required';
        // registrationNumber is optional
        if (!formData.stateId) errs.stateId = 'Please select a state';
        if (!formData.districtId) errs.districtId = 'Please select a district';
        if (!formData.address.trim() || formData.address.trim().length < 10) errs.address = 'Address must be at least 10 characters';
        if (!formData.contactPersonName.trim()) errs.contactPersonName = 'Contact person name is required';
        if (!formData.phone.trim()) errs.phone = 'Phone number is required';
        else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) errs.phone = 'Enter valid 10-digit mobile';
        if (!formData.clubLogo) errs.clubLogo = 'Club logo is required';
        if (!formData.termsAccepted) errs.termsAccepted = 'You must accept the terms';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsLoading(true);
        setError(null);

        try {
            const payload = {
                name: formData.clubName.trim(),
                clubName: formData.clubName.trim(),
                registrationNumber: formData.registrationNumber.trim() || undefined,
                establishedYear: Number(formData.establishedYear),
                stateId: Number(formData.stateId),
                districtId: Number(formData.districtId),
                address: formData.address.trim(),
                contactPerson: formData.contactPersonName.trim(),
                contactPersonName: formData.contactPersonName.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim() || undefined,
                logo: formData.clubLogo,
                clubLogo: formData.clubLogo,
                code: formData.registrationNumber.trim().toUpperCase(),
                termsAccepted: true,
            };

            if (paymentMode === 'offline') {
                await api.post('/clubs', payload);
                setSuccess(true);
                toast.success('Club created successfully!');
                setTimeout(() => router.push('/dashboard/clubs'), 2000);
            } else {
                const res = await api.post('/affiliations/club/initiate', payload);
                const order = res.data?.data || res.data;
                if (order?.razorpayOrderId) {
                    const link = `${window.location.origin}/register/payment?orderId=${order.razorpayOrderId}&amount=${order.amount}&name=${encodeURIComponent(formData.clubName)}&uid=${encodeURIComponent(order.uid || '')}&type=club&key=${order.key}`;
                    setPaymentLink(link);
                    setSuccess(true);
                    toast.success('Registration initiated! Share the payment link.');
                } else {
                    throw new Error('Failed to create payment order');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to create club');
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

    const labelClass = 'block text-sm font-medium text-gray-600 mb-1.5';

    const FieldError = ({ field }: { field: string }) =>
        fieldErrors[field] ? <p className="mt-1 text-xs text-red-500">{fieldErrors[field]}</p> : null;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/clubs" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Club</h1>
                    <p className="text-gray-500">Register a new skating club with SSFI</p>
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
                            <p className="text-sm text-green-600">Share the payment link below with the club owner to complete registration.</p>
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
                    <Link href="/dashboard/clubs" className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Clubs
                    </Link>
                </motion.div>
            )}

            {success && !paymentLink && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    Club created successfully! Redirecting...
                </motion.div>
            )}

            {/* Form */}
            {!success && (
                <div className="space-y-4">
                    {/* Club Details */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50">
                            <Users className="w-5 h-5 text-emerald-600" />
                            <h2 className="font-semibold text-gray-900">Club Details</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Club Name *</label>
                                <input type="text" value={formData.clubName} onChange={e => updateField('clubName', e.target.value)}
                                    placeholder="Enter club name" className={inputClass('clubName')} />
                                <FieldError field="clubName" />
                            </div>
                            <div>
                                <label className={labelClass}>Registration Number</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" value={formData.registrationNumber}
                                        onChange={e => updateField('registrationNumber', e.target.value)}
                                        placeholder="Club registration number" className={`${inputClass('registrationNumber')} pl-9`} />
                                </div>
                                <FieldError field="registrationNumber" />
                            </div>
                            <div>
                                <label className={labelClass}>Established Year</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="number" min="1900" max={new Date().getFullYear()}
                                        value={formData.establishedYear} onChange={e => updateField('establishedYear', e.target.value)}
                                        placeholder="YYYY" className={`${inputClass('establishedYear')} pl-9`} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>State *</label>
                                <select value={formData.stateId} onChange={e => updateField('stateId', e.target.value)}
                                    className={inputClass('stateId')}>
                                    <option value="">Select State</option>
                                    {states.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <FieldError field="stateId" />
                            </div>
                            <div>
                                <label className={labelClass}>District *</label>
                                <select value={formData.districtId} onChange={e => updateField('districtId', e.target.value)}
                                    disabled={!formData.stateId} className={`${inputClass('districtId')} ${!formData.stateId ? 'opacity-50' : ''}`}>
                                    <option value="">{formData.stateId ? 'Select District' : 'Select state first'}</option>
                                    {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <FieldError field="districtId" />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Club Address *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <textarea value={formData.address} onChange={e => updateField('address', e.target.value)}
                                        rows={3} placeholder="Enter complete club address"
                                        className={`${inputClass('address')} pl-9 resize-none`} />
                                </div>
                                <FieldError field="address" />
                            </div>
                        </div>
                    </div>

                    {/* Contact Person */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50">
                            <User className="w-5 h-5 text-emerald-600" />
                            <h2 className="font-semibold text-gray-900">Contact Person</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Contact Person Name *</label>
                                <input type="text" value={formData.contactPersonName}
                                    onChange={e => updateField('contactPersonName', e.target.value)}
                                    placeholder="Full name" className={inputClass('contactPersonName')} />
                                <FieldError field="contactPersonName" />
                            </div>
                            <div>
                                <label className={labelClass}>Mobile Number *</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm">+91</span>
                                    <input type="tel" value={formData.phone}
                                        onChange={e => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="10-digit number" className={`${inputClass('phone')} rounded-l-none`} />
                                </div>
                                <FieldError field="phone" />
                            </div>
                            <div>
                                <label className={labelClass}>Email (optional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="email" value={formData.email}
                                        onChange={e => updateField('email', e.target.value)}
                                        placeholder="club@email.com" className={`${inputClass('email')} pl-9`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Club Logo */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
                            <h2 className="font-semibold text-gray-900 text-sm">Club Logo *</h2>
                        </div>
                        <div className="p-5 flex items-center gap-4">
                            {logoPreview ? (
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                                    <button type="button" onClick={() => { setLogoPreview(null); updateField('clubLogo', ''); }}
                                        className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <label className={`w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${fieldErrors.clubLogo ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    <span className="text-[10px] text-gray-500 text-center">Upload Logo</span>
                                    <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                                </label>
                            )}
                            <div className="text-xs text-gray-400">PNG, JPG up to 5MB</div>
                        </div>
                        <FieldError field="clubLogo" />
                    </div>

                    {/* Terms & Payment */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                            <h2 className="font-semibold text-gray-900">Terms & Payment</h2>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Terms */}
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
                        <Link href="/dashboard/clubs"
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-center text-sm">
                            Cancel
                        </Link>
                        <button type="button" onClick={handleSubmit} disabled={isLoading}
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-50">
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                            ) : paymentMode === 'offline' ? (
                                <><CheckCircle className="w-5 h-5" /> Create Club</>
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
