'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  User, Mail, Phone, MapPin, Camera,
  ChevronLeft, Check, Loader2, X, RefreshCw, Building2, Shield, Home,
} from 'lucide-react';

import { useDistrictSecretaryRegistration } from '@/lib/hooks/useAffiliation';
import { useStates, useDistricts } from '@/lib/hooks/useStudent';
import { useRenewal, type MemberLookupResult } from '@/lib/hooks/useAffiliationLookup';
import AffiliationLookupStep from './AffiliationLookupStep';
import type { DistrictSecretaryFormData } from '@/types/affiliation';
import { GENDERS } from '@/types/affiliation';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  stateId: z.string().min(1, 'Please select a state'),
  districtId: z.string().min(1, 'Please select a district'),
  residentialAddress: z.string().min(10, 'Address must be at least 10 characters').max(500),
  profilePhoto: z.string().min(1, 'Profile photo is required'),
  logo: z.string().min(1, 'Association logo is required'),
  associationRegistrationCopy: z.string().min(1, 'Association registration copy is required'),
  termsAccepted: z.boolean().refine((v) => v === true, 'You must accept the terms'),
});
type FormData = z.infer<typeof formSchema>;
type Mode = 'choose' | 'renew' | 'new';

const inputCls = (err?: boolean) =>
  `w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-emerald-500 text-sm transition-all ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:ring-emerald-500/20'}`;

export default function DistrictSecretaryRegistrationForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [renewMember, setRenewMember] = useState<MemberLookupResult | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [regCopyPreview, setRegCopyPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const { initiate, verify, isLoading } = useDistrictSecretaryRegistration();
  const { initiateRenewal, verifyRenewal, isLoading: renewLoading } = useRenewal();
  const { fetchStates, data: states } = useStates();
  const { fetchDistricts, data: districts } = useDistricts();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { gender: 'MALE' },
  });

  const selectedStateId = watch('stateId');

  useEffect(() => { fetchStates(); }, [fetchStates]);
  useEffect(() => { if (selectedStateId) fetchDistricts(selectedStateId); }, [selectedStateId, fetchDistricts]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'profilePhoto' | 'logo' | 'associationRegistrationCopy',
    setPreview: (v: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setPreview(b64);
      setValue(field, b64, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setPhotoPreview(b64);
      setValue('profilePhoto', b64, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setValue('profilePhoto', '');
  };

  const openRazorpay = (order: any, onVerify: (r: any) => Promise<void>) => {
    if (order.key === 'rzp_test_mock') {
      toast.success('Mock payment — simulating success…');
      setTimeout(() => onVerify({
        razorpay_order_id: order.razorpayOrderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature',
      }), 1500);
      return;
    }
    const rzp = new (window as any).Razorpay({
      key: order.key, amount: order.amount, currency: order.currency,
      name: 'SSFI', description: 'District Secretary Registration',
      order_id: order.razorpayOrderId,
      prefill: order.userDetails,
      theme: { color: '#10b981' },
      handler: onVerify,
    });
    rzp.on('payment.failed', (r: any) => toast.error(r.error.description || 'Payment failed'));
    rzp.open();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const order = await initiate(data as DistrictSecretaryFormData);
      openRazorpay(order, async (response) => {
        try {
          const result = await verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (result?.success) {
            toast.success('Registration submitted! Check your email for credentials.');
            router.push(`/register/success?type=district-secretary&uid=${result.uid}`);
          }
        } catch (e: any) { toast.error(e.message || 'Verification failed'); }
      });
    } catch (e: any) { toast.error(e.message || 'Registration failed'); }
  };

  const handleRenew = async () => {
    if (!renewMember) return;
    try {
      const order = await initiateRenewal('DISTRICT_SECRETARY', renewMember.uid);
      if (!order) return;
      openRazorpay(order, async (response) => {
        try {
          const result = await verifyRenewal(response);
          if (result?.success) {
            toast.success('Membership renewed!');
            router.push(`/register/success?type=district-secretary&uid=${result.uid}&renewed=true`);
          }
        } catch (e: any) { toast.error(e.message || 'Renewal failed'); }
      });
    } catch (e: any) { toast.error(e.message || 'Renewal initiation failed'); }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <span className="text-white/30">/</span>
            <button onClick={() => router.push('/register')} className="text-white/60 hover:text-white text-sm transition-colors">Registration</button>
            <span className="text-white/30">/</span>
            <span className="text-white/80 text-sm">District Secretary</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-500/20 border border-teal-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs font-medium mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> SSFI Affiliation
              </div>
              <h1 className="text-2xl font-bold">District Secretary Registration</h1>
              <p className="text-white/50 text-sm mt-1">Register or renew your District Secretary affiliation with SSFI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* Step 0: Choose mode */}
          {mode === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Are you a new or existing member?</h2>
                <p className="text-sm text-gray-500 mt-1">Existing members can renew their membership directly.</p>
              </div>
              <div className="p-6">
                <AffiliationLookupStep
                  type="DISTRICT_SECRETARY"
                  onFound={(member) => { setRenewMember(member); setMode('renew'); }}
                  onNew={() => setMode('new')}
                />
              </div>
            </motion.div>
          )}

          {/* Step R: Renewal */}
          {mode === 'renew' && renewMember && (
            <motion.div key="renew" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Renew Membership</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Confirm details and proceed to payment</p>
                </div>
                <button onClick={() => { setMode('choose'); setRenewMember(null); }} className="text-sm text-gray-400 hover:text-gray-600">Change</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-medium text-gray-900">{renewMember.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">UID</span><span className="font-mono text-gray-900">{renewMember.uid}</span></div>
                  {renewMember.stateName && <div className="flex justify-between text-sm"><span className="text-gray-500">State</span><span className="text-gray-900">{renewMember.stateName}</span></div>}
                  {renewMember.districtName && <div className="flex justify-between text-sm"><span className="text-gray-500">District</span><span className="text-gray-900">{renewMember.districtName}</span></div>}
                  {renewMember.expiryDate && <div className="flex justify-between text-sm"><span className="text-gray-500">Current Expiry</span><span className="text-gray-900">{new Date(renewMember.expiryDate).toLocaleDateString('en-IN')}</span></div>}
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm text-amber-700">Renewing will extend your membership by 1 year from the current expiry date.</p>
                </div>
                <button type="button" onClick={handleRenew} disabled={renewLoading}
                  className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-60 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                  {renewLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  Proceed to Payment
                </button>
              </div>
            </motion.div>
          )}

          {/* Step N: New Registration */}
          {mode === 'new' && (
            <motion.div key="new" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setMode('choose')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-sm text-gray-500">New Registration</span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Personal Details */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-500" />
                    <h2 className="font-semibold text-gray-900 text-sm">Personal Details</h2>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                      <input {...register('name')} placeholder="Enter your full name" className={inputCls(!!errors.name)} />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender <span className="text-red-400">*</span></label>
                      <div className="flex gap-2">
                        {GENDERS.map((g) => (
                          <label key={g.value} className={`flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all ${watch('gender') === g.value ? 'bg-teal-50 border-teal-400 text-teal-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                            <input {...register('gender')} type="radio" value={g.value} className="sr-only" />
                            {g.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">State <span className="text-red-400">*</span></label>
                      <select {...register('stateId')} className={inputCls(!!errors.stateId)}>
                        <option value="">Select State</option>
                        {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      {errors.stateId && <p className="mt-1 text-xs text-red-500">{errors.stateId.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">District <span className="text-red-400">*</span></label>
                      <select {...register('districtId')} disabled={!selectedStateId} className={`${inputCls(!!errors.districtId)} ${!selectedStateId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <option value="">Select District</option>
                        {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      {errors.districtId && <p className="mt-1 text-xs text-red-500">{errors.districtId.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input {...register('email')} type="email" placeholder="your@email.com" className={`${inputCls(!!errors.email)} pl-9`} />
                      </div>
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <span className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400 text-sm border-r border-gray-200 pr-2">+91</span>
                        <input {...register('phone')} type="tel" maxLength={10} placeholder="10-digit number" className={`${inputCls(!!errors.phone)} pl-20`} />
                      </div>
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Residential Address <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea {...register('residentialAddress')} rows={3} placeholder="Enter your complete address" className={`${inputCls(!!errors.residentialAddress)} pl-9 resize-none`} />
                      </div>
                      {errors.residentialAddress && <p className="mt-1 text-xs text-red-500">{errors.residentialAddress.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Documents & Photos — compact grid */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-teal-500" />
                    <h2 className="font-semibold text-gray-900 text-sm">Documents & Photos</h2>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Profile Photo */}
                      <div className="flex flex-col items-center gap-1.5">
                        {photoPreview ? (
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                            <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                            <button type="button" onClick={removePhoto} className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <div onClick={() => photoRef.current?.click()} className={`w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${errors.profilePhoto ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50'}`}>
                            <Camera className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-500 text-center leading-tight">Profile Photo</span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500 font-medium">Profile Photo <span className="text-red-400">*</span></span>
                        <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />
                        {errors.profilePhoto && <p className="text-[10px] text-red-500">Required</p>}
                      </div>

                      {/* Association Logo */}
                      <div className="flex flex-col items-center gap-1.5">
                        {logoPreview ? (
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain bg-white p-2" />
                            <button type="button" onClick={() => { setLogoPreview(null); setValue('logo', ''); }} className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <div onClick={() => document.getElementById('district-logo-input')?.click()} className={`w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${errors.logo ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50'}`}>
                            <Shield className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-500 text-center leading-tight">Assoc. Logo</span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500 font-medium">Association Logo <span className="text-red-400">*</span></span>
                        <input id="district-logo-input" type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo', setLogoPreview)} className="hidden" />
                        {errors.logo && <p className="text-[10px] text-red-500">Required</p>}
                      </div>

                      {/* Registration Copy */}
                      <div className="flex flex-col items-center gap-1.5">
                        {regCopyPreview ? (
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center bg-teal-50 flex-shrink-0">
                            <Check className="w-6 h-6 text-teal-500" />
                            <button type="button" onClick={() => { setRegCopyPreview(null); setValue('associationRegistrationCopy', ''); }} className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <div onClick={() => document.getElementById('district-regcopy-input')?.click()} className={`w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${errors.associationRegistrationCopy ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50'}`}>
                            <Shield className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-500 text-center leading-tight">Reg. Copy</span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500 font-medium">Reg. Certificate <span className="text-red-400">*</span></span>
                        <input id="district-regcopy-input" type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'associationRegistrationCopy', setRegCopyPreview)} className="hidden" />
                        {errors.associationRegistrationCopy && <p className="text-[10px] text-red-500">Required</p>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-3">JPG, PNG up to 5MB each. Reg. certificate can also be PDF.</p>
                  </div>
                </div>

                {/* Terms & Submit */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <label className="flex items-start gap-3 cursor-pointer mb-5">
                    <input type="checkbox" {...register('termsAccepted')} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500/20" />
                    <span className="text-sm text-gray-600">
                      I declare that all information provided is accurate. I agree to SSFI&apos;s{' '}
                      <a href="/terms" className="text-teal-500 hover:underline">Terms &amp; Conditions</a> and{' '}
                      <a href="/privacy" className="text-teal-500 hover:underline">Privacy Policy</a>.
                    </span>
                  </label>
                  {errors.termsAccepted && <p className="mb-4 text-xs text-red-500">{errors.termsAccepted.message}</p>}

                  <button type="submit" disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-60 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25">
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Check className="w-5 h-5" /> Submit &amp; Pay Registration Fee</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
