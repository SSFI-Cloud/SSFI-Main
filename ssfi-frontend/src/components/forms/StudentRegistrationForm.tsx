'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  User, Home, Shield, Users, MapPin, FileText,
  ChevronLeft, ChevronRight, Check, Loader2, RefreshCw,
} from 'lucide-react';

import { useRegistrationStore } from '@/lib/store/registrationStore';
import { useRegisterStudent } from '@/lib/hooks/useStudent';
import { registrationSchema } from '@/lib/validations/student';
import { useRenewal, type MemberLookupResult } from '@/lib/hooks/useAffiliationLookup';
import AffiliationLookupStep from './affiliation/AffiliationLookupStep';
import type { StudentRegistrationData } from '@/types/student';

import PersonalInfoStep from './steps/PersonalInfoStep';
import FamilySchoolStep from './steps/FamilySchoolStep';
import NomineeStep from './steps/NomineeStep';
import ClubCoachStep from './steps/ClubCoachStep';
import AddressStep from './steps/AddressStep';
import DocumentsStep from './steps/DocumentsStep';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User, description: 'Basic details' },
  { id: 2, title: 'Family & School', icon: Home, description: 'Guardian & education' },
  { id: 3, title: 'Nominee', icon: Shield, description: 'Insurance nominee' },
  { id: 4, title: 'Club & Coach', icon: Users, description: 'Training details' },
  { id: 5, title: 'Address', icon: MapPin, description: 'Location details' },
  { id: 6, title: 'Verify & Submit', icon: FileText, description: 'KYC & documents' },
];

type Mode = 'choose' | 'renew' | 'new';

export default function StudentRegistrationForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [renewMember, setRenewMember] = useState<MemberLookupResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentStep, formData, updateFormData, completedSteps,
    setCurrentStep, nextStep, prevStep, markStepComplete, resetForm,
  } = useRegistrationStore();

  const { initiateStudentRegistration, verifyStudentPayment } = useRegisterStudent();
  const { initiateRenewal, verifyRenewal, isLoading: renewLoading } = useRenewal();

  const handleStepComplete = (stepData: Partial<StudentRegistrationData>) => {
    updateFormData(stepData);
    markStepComplete(currentStep);
    if (currentStep < 6) nextStep();
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const validationResult = registrationSchema.safeParse(formData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues;
        toast.error(errors[0]?.message || 'Please check all required fields');
        return;
      }

      // Step 1: Submit registration + create payment order
      const order = await initiateStudentRegistration(formData as StudentRegistrationData);

      // Step 2: Open Razorpay checkout
      openRazorpay(order, async (response) => {
        try {
          // Step 3: Verify payment
          const result = await verifyStudentPayment(response);
          if (result?.success) {
            toast.success('Registration & payment successful!');
            resetForm();
            router.push(`/register/success?type=student&uid=${result.uid || order.uid}`);
          }
        } catch (e: any) {
          toast.error(e.message || 'Payment verification failed');
        }
      });
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      name: 'SSFI', description: 'Student Registration',
      order_id: order.razorpayOrderId, prefill: order.userDetails,
      theme: { color: '#10b981' }, handler: onVerify,
    });
    rzp.on('payment.failed', (r: any) => toast.error(r.error.description || 'Payment failed'));
    rzp.open();
  };

  const handleRenew = async () => {
    if (!renewMember) return;
    try {
      const order = await initiateRenewal('STUDENT', renewMember.uid);
      if (!order) return;
      openRazorpay(order, async (response) => {
        try {
          const result = await verifyRenewal(response);
          if (result?.success) {
            toast.success('Student membership renewed!');
            router.push(`/register/success?type=student&uid=${result.uid}&renewed=true`);
          }
        } catch (e: any) { toast.error(e.message || 'Renewal failed'); }
      });
    } catch (e: any) { toast.error(e.message || 'Renewal failed'); }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <PersonalInfoStep onComplete={handleStepComplete} />;
      case 2: return <FamilySchoolStep onComplete={handleStepComplete} />;
      case 3: return <NomineeStep onComplete={handleStepComplete} />;
      case 4: return <ClubCoachStep onComplete={handleStepComplete} />;
      case 5: return <AddressStep onComplete={handleStepComplete} />;
      case 6: return <DocumentsStep onComplete={handleStepComplete} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50] text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <span className="text-white/30">/</span>
            <button onClick={() => router.push('/register')} className="text-white/60 hover:text-white text-sm transition-colors">Registration</button>
            <span className="text-white/30">/</span>
            <span className="text-white/80 text-sm">Student</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> SSFI Affiliation
              </div>
              <h1 className="text-2xl font-bold">Student Registration</h1>
              <p className="text-white/50 text-sm mt-1">Join the Speed Skating Federation of India</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* Step 0: Choose mode */}
          {mode === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Are you a new or existing member?</h2>
                <p className="text-sm text-gray-500 mt-1">Existing students can renew their membership directly.</p>
              </div>
              <div className="p-6">
                <AffiliationLookupStep
                  type="STUDENT"
                  onFound={(member) => { setRenewMember(member); setMode('renew'); }}
                  onNew={() => setMode('new')}
                />
              </div>
            </motion.div>
          )}

          {/* Step R: Renewal */}
          {mode === 'renew' && renewMember && (
            <motion.div key="renew" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Renew Student Membership</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Confirm details and proceed to payment</p>
                </div>
                <button onClick={() => { setMode('choose'); setRenewMember(null); }} className="text-sm text-gray-400 hover:text-gray-600">Change</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-medium text-gray-900">{renewMember.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">UID</span><span className="font-mono text-gray-900">{renewMember.uid}</span></div>
                  {renewMember.clubName && <div className="flex justify-between text-sm"><span className="text-gray-500">Club</span><span className="text-gray-900">{renewMember.clubName}</span></div>}
                  {renewMember.stateName && <div className="flex justify-between text-sm"><span className="text-gray-500">State</span><span className="text-gray-900">{renewMember.stateName}</span></div>}
                  {renewMember.expiryDate && <div className="flex justify-between text-sm"><span className="text-gray-500">Current Expiry</span><span className="text-gray-900">{new Date(renewMember.expiryDate).toLocaleDateString('en-IN')}</span></div>}
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm text-amber-700">Renewing will extend your membership by 1 year from the current expiry date.</p>
                </div>
                <button type="button" onClick={handleRenew} disabled={renewLoading}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                  {renewLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  Proceed to Payment
                </button>
              </div>
            </motion.div>
          )}

          {/* Step N: New Registration - multi-step wizard */}
          {mode === 'new' && (
            <motion.div key="new" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setMode('choose')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-sm text-gray-400">/ New Registration</span>
              </div>

              {/* Progress Steps */}
              <div className="mb-6">
                <div className="hidden md:flex items-center justify-between relative">
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {STEPS.map((step) => {
                    const Icon = step.icon;
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = currentStep === step.id;
                    const isAccessible = step.id <= currentStep || isCompleted;
                    return (
                      <button key={step.id} onClick={() => isAccessible && setCurrentStep(step.id)}
                        disabled={!isAccessible} className={`relative z-10 flex flex-col items-center ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' : isCurrent ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ring-4 ring-green-500/20' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                          {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <span className={`mt-2 text-xs font-medium transition-colors ${isCurrent ? 'text-green-600' : isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                          {step.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile progress */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">Step {currentStep} of 6</span>
                    <span className="text-sm font-medium text-gray-700">{STEPS[currentStep - 1].title}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      animate={{ width: `${(currentStep / 6) * 100}%` }} transition={{ duration: 0.3 }} />
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Step header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center gap-3">
                  {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="w-5 h-5 text-green-600" />; })()}
                  <div>
                    <h2 className="font-semibold text-gray-900">{STEPS[currentStep - 1].title}</h2>
                    <p className="text-xs text-gray-500">{STEPS[currentStep - 1].description}</p>
                  </div>
                </div>

                {/* Form content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      {renderStep()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                  <button onClick={prevStep} disabled={currentStep === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 hover:bg-white border border-gray-200'}`}>
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex items-center gap-1.5">
                    {STEPS.map((step) => (
                      <div key={step.id} className={`rounded-full transition-all ${step.id === currentStep ? 'w-5 h-2 bg-green-500' : completedSteps.includes(step.id) ? 'w-2 h-2 bg-green-400' : 'w-2 h-2 bg-gray-300'}`} />
                    ))}
                  </div>

                  {currentStep < 6 ? (
                    <button type="submit" form={`step-${currentStep}-form`}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium text-sm shadow-sm">
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <p className="text-center text-gray-400 text-sm mt-6">
                Need help? Contact <a href="mailto:info@ssfiskate.com" className="text-green-600 hover:underline">info@ssfiskate.com</a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
