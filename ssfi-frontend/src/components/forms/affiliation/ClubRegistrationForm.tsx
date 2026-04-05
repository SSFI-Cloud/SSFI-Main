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
  Users, User, Mail, Phone, MapPin, Hash,
  Calendar, Upload, ChevronLeft, Check, Loader2, X, RefreshCw, Shield, Home,
} from 'lucide-react';

import { useClubRegistration } from '@/lib/hooks/useAffiliation';
import { useStates, useDistricts } from '@/lib/hooks/useStudent';
import { useRenewal, type MemberLookupResult } from '@/lib/hooks/useAffiliationLookup';
import { api } from '@/lib/api/client';
import AffiliationLookupStep from './AffiliationLookupStep';
import type { ClubFormData } from '@/types/affiliation';

const formSchema = z.object({
  clubName: z.string().min(3, 'Club name must be at least 3 characters').max(200),
  registrationNumber: z.string().max(50).optional().or(z.literal('')),
  establishedYear: z.coerce.number().min(1900).max(new Date().getFullYear(), 'Year cannot be in the future'),
  contactPersonName: z.string().min(2, 'Contact person name is required').max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  stateId: z.string().min(1, 'Please select a state'),
  districtId: z.string().min(1, 'Please select a district'),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500),
  clubLogo: z.string().min(1, 'Club logo is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  termsAccepted: z.boolean().refine((v) => v === true, 'You must accept the terms'),
});
type FormData = z.infer<typeof formSchema>;
type Mode = 'choose' | 'renew' | 'new';

const inputCls = (err?: boolean) =>
  `w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-teal-500 text-sm transition-all ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:ring-teal-500/20'}`;

export default function ClubRegistrationForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [renewMember, setRenewMember] = useState<MemberLookupResult | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const { initiate, verify, isLoading } = useClubRegistration();
  const { initiateRenewal, verifyRenewal, isLoading: renewLoading } = useRenewal();
  const { fetchStates, data: states } = useStates();
  const { fetchDistricts, data: districts, clearDistricts } = useDistricts();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { status: 'ACTIVE', establishedYear: new Date().getFullYear() },
  });

  const selectedStateId = watch('stateId');

  useEffect(() => { fetchStates(); }, [fetchStates]);
  useEffect(() => {
    if (selectedStateId) { fetchDistricts(selectedStateId); setValue('districtId', ''); }
    else clearDistricts();
  }, [selectedStateId, fetchDistricts, clearDistricts, setValue]);

  useEffect(() => {
    api.get('/registration-windows/check/renewal-status', { params: { type: 'club' } })
      .then(res => { if (!res.data?.data?.renewalEnabled) setMode('new'); })
      .catch(() => {});
  }, []);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setLogoPreview(reader.result as string); setValue('clubLogo', reader.result as string); };
    reader.readAsDataURL(file);
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
      name: 'SSFI', description: 'Club Affiliation Fee',
      order_id: order.razorpayOrderId, prefill: order.userDetails,
      theme: { color: '#14b8a6' }, handler: onVerify,
    });
    rzp.on('payment.failed', (r: any) => toast.error(r.error.description || 'Payment failed'));
    rzp.open();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const order = await initiate(data as ClubFormData);
      openRazorpay(order, async (response) => {
        try {
          const result = await verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (result?.success) {
            toast.success('Club registration submitted! Check your email.');
            router.push(`/register/success?type=club&uid=${result.uid}`);
          }
        } catch (e: any) { toast.error(e.message || 'Verification failed'); }
      });
    } catch (e: any) { toast.error(e.message || 'Registration failed'); }
  };

  const handleRenew = async () => {
    if (!renewMember) return;
    try {
      const order = await initiateRenewal('CLUB', renewMember.uid);
      if (!order) return;
      openRazorpay(order, async (response) => {
        try {
          const result = await verifyRenewal(response);
          if (result?.success) {
            toast.success('Club membership renewed!');
            router.push(`/register/success?type=club&uid=${result.uid}&renewed=true`);
          }
        } catch (e: any) { toast.error(e.message || 'Renewal failed'); }
      });
    } catch (e: any) { toast.error(e.message || 'Renewal failed'); }
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
            <span className="text-white/80 text-sm">Club</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-500/20 border border-teal-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs font-medium mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> SSFI Affiliation
              </div>
              <h1 className="text-2xl font-bold">Club Registration</h1>
              <p className="text-white/50 text-sm mt-1">Affiliate your skating club or renew existing membership with SSFI</p>
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
                <h2 className="text-lg font-semibold text-gray-900">New club or renewal?</h2>
                <p className="text-sm text-gray-500 mt-1">Existing clubs can renew their affiliation directly.</p>
              </div>
              <div className="p-6">
                <AffiliationLookupStep
                  type="CLUB"
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
                  <h2 className="text-lg font-semibold text-gray-900">Renew Club Affiliation</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Confirm details and proceed to payment</p>
                </div>
                <button onClick={() => { setMode('choose'); setRenewMember(null); }} className="text-sm text-gray-400 hover:text-gray-600">Change</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Club Name</span><span className="font-medium text-gray-900">{renewMember.clubName || renewMember.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">UID</span><span className="font-mono text-gray-900">{renewMember.uid}</span></div>
                  {renewMember.stateName && <div className="flex justify-between text-sm"><span className="text-gray-500">State</span><span className="text-gray-900">{renewMember.stateName}</span></div>}
                  {renewMember.districtName && <div className="flex justify-between text-sm"><span className="text-gray-500">District</span><span className="text-gray-900">{renewMember.districtName}</span></div>}
                  {renewMember.expiryDate && <div className="flex justify-between text-sm"><span className="text-gray-500">Current Expiry</span><span className="text-gray-900">{new Date(renewMember.expiryDate).toLocaleDateString('en-IN')}</span></div>}
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm text-amber-700">Renewing will extend your club affiliation by 1 year from the current expiry date.</p>
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
                <span className="text-sm text-gray-500">New Club Registration</span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Club Details */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-500" />
                    <h2 className="font-semibold text-gray-900">Club Details</h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Club Name <span className="text-red-400">*</span></label>
                      <input {...register('clubName')} placeholder="Enter club name" className={inputCls(!!errors.clubName)} />
                      {errors.clubName && <p className="mt-1 text-xs text-red-500">{errors.clubName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Number</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input {...register('registrationNumber')} placeholder="Club registration number" className={`${inputCls(!!errors.registrationNumber)} pl-9`} />
                      </div>
                      {errors.registrationNumber && <p className="mt-1 text-xs text-red-500">{errors.registrationNumber.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Established Year</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input {...register('establishedYear')} type="number" min="1900" max={new Date().getFullYear()} placeholder="YYYY" className={`${inputCls(!!errors.establishedYear)} pl-9`} />
                      </div>
                      {errors.establishedYear && <p className="mt-1 text-xs text-red-500">{errors.establishedYear.message}</p>}
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
                        <option value="">{selectedStateId ? 'Select District' : 'Select state first'}</option>
                        {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      {errors.districtId && <p className="mt-1 text-xs text-red-500">{errors.districtId.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Club Address <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea {...register('address')} rows={3} placeholder="Enter complete club address" className={`${inputCls(!!errors.address)} pl-9 resize-none`} />
                      </div>
                      {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Contact Person */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-500" />
                    <h2 className="font-semibold text-gray-900">Contact Person</h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Person Name <span className="text-red-400">*</span></label>
                      <input {...register('contactPersonName')} placeholder="Full name" className={inputCls(!!errors.contactPersonName)} />
                      {errors.contactPersonName && <p className="mt-1 text-xs text-red-500">{errors.contactPersonName.message}</p>}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-gray-400">(Optional)</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input {...register('email')} type="email" placeholder="club@email.com" className={`${inputCls(!!errors.email)} pl-9`} />
                      </div>
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Club Logo — compact */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900 text-sm">Club Logo <span className="text-red-400">*</span></h2>
                  </div>
                  <div className="p-5 flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {logoPreview ? (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                          <button type="button" onClick={() => { setLogoPreview(null); setValue('clubLogo', ''); }}
                            className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => logoRef.current?.click()} className={`w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${errors.clubLogo ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50'}`}>
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-[10px] text-gray-500 text-center">Upload Logo</span>
                        </div>
                      )}
                      <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                    </div>
                    <div className="text-xs text-gray-400">PNG, JPG up to 5MB</div>
                    {errors.clubLogo && <p className="text-xs text-red-500">{errors.clubLogo.message}</p>}
                  </div>
                </div>

                {/* Terms & Submit */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
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
