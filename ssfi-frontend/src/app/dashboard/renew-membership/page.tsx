'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, CreditCard, Loader2, AlertTriangle, ExternalLink, ArrowLeft, Camera, User, Phone, Mail } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useKYC } from '@/lib/hooks/useKYC';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePayment } from '@/hooks/usePayment';
import { useStates, useDistricts, useClubs } from '@/lib/hooks/useStudent';
import { GENDERS, BLOOD_GROUPS } from '@/types/student';
import { FATHER_OCCUPATIONS, ACADEMIC_BOARDS } from '@/lib/validations/student';

type Step = 'kyc' | 'kyc_verifying' | 'review_profile' | 'photo_contact' | 'payment' | 'success';

const NOMINEE_RELATIONS = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Guardian', 'Other'];

const inputCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const sectionCls = 'border border-gray-200 rounded-lg p-4 space-y-4';

export default function RenewMembershipPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { step: kycStep, result: kycResult, error: kycError, isLoading: kycLoading, initializeDigilocker, reopenDigilocker, reset: resetKyc } = useKYC();
  const { initiatePayment, isLoading: payLoading } = usePayment({
    onSuccess: () => handlePaymentSuccess(),
  });

  const [step, setStep] = useState<Step>('kyc');
  const [error, setError] = useState<string | null>(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [renewalResult, setRenewalResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Location hooks
  const { fetchStates, data: states } = useStates();
  const { fetchDistricts, clearDistricts, data: districts } = useDistricts();
  const { fetchClubs, clearClubs, data: clubs } = useClubs();

  // Check if already active
  useEffect(() => {
    api.get('/renewal/status').then(res => {
      const data = res.data?.data;
      if (data && !data.needsRenewal && data.accountStatus === 'ACTIVE') {
        router.push('/dashboard');
      }
    }).catch(() => {});
  }, [router]);

  // When KYC completes, verify with backend
  useEffect(() => {
    if (kycStep === 'verified' && kycResult && !kycVerified) {
      verifyKycWithBackend();
    }
  }, [kycStep, kycResult]);

  const verifyKycWithBackend = async () => {
    if (!kycResult) return;
    setStep('kyc_verifying');
    setError(null);

    try {
      await api.post('/renewal/verify-kyc', {
        maskedAadhaar: kycResult.maskedAadhaar,
        fullName: kycResult.fullName,
        dob: kycResult.dob,
      });
      setKycVerified(true);
      await fetchProfile();
      setStep('review_profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'KYC verification failed. Please try again.');
      setStep('kyc');
      resetKyc();
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api.get('/auth/me');
      const d = res.data?.data?.user || res.data?.data;
      const p = d?.profile;
      if (p) {
        const stateId = String(p.state?.id || '');
        const districtId = String(p.district?.id || '');
        setProfileData({
          name: p.name || '',
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
          gender: p.gender || '',
          bloodGroup: p.bloodGroup || '',
          fatherName: p.fatherName || '',
          motherName: p.motherName || '',
          fatherOccupation: p.fatherOccupation || '',
          schoolName: p.schoolName || '',
          academicBoard: p.academicBoard || '',
          nomineeName: p.nomineeName || '',
          nomineeRelation: p.nomineeRelation || '',
          nomineeAge: p.nomineeAge ? String(p.nomineeAge) : '',
          stateId,
          districtId,
          clubId: String(p.club?.id || ''),
          addressLine1: p.addressLine1 || '',
          city: p.city || '',
          pincode: p.pincode || '',
          coachName: p.coachName || '',
          coachPhone: p.coachPhone || '',
          phone: d.phone || '',
          email: d.email || '',
        });
        setPhotoFile(p.profilePhoto || null);
        // Load cascading dropdowns
        await fetchStates();
        if (stateId) await fetchDistricts(stateId);
        if (districtId) await fetchClubs(districtId);
      }
    } catch {
      setError('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setProfileData((prev: Record<string, any>) => ({ ...prev, [key]: value }));
    setProfileErrors((prev: Record<string, string>) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleStateChange = async (stateId: string) => {
    updateField('stateId', stateId);
    updateField('districtId', '');
    updateField('clubId', '');
    clearDistricts();
    clearClubs();
    if (stateId) await fetchDistricts(stateId);
  };

  const handleDistrictChange = async (districtId: string) => {
    updateField('districtId', districtId);
    updateField('clubId', '');
    clearClubs();
    if (districtId) await fetchClubs(districtId);
  };

  const validateProfile = (): boolean => {
    const errs: Record<string, string> = {};
    if (!profileData.name || profileData.name.length < 2) errs.name = 'Name is required';
    if (!profileData.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    if (!profileData.gender) errs.gender = 'Gender is required';
    if (!profileData.fatherName || profileData.fatherName.length < 2) errs.fatherName = 'Father name is required';
    if (!profileData.motherName || profileData.motherName.length < 2) errs.motherName = 'Mother name is required';
    if (!profileData.schoolName || profileData.schoolName.length < 2) errs.schoolName = 'School name is required';
    if (!profileData.nomineeName || profileData.nomineeName.length < 2) errs.nomineeName = 'Nominee name is required';
    if (!profileData.nomineeRelation) errs.nomineeRelation = 'Nominee relation is required';
    if (!profileData.nomineeAge || Number(profileData.nomineeAge) < 18) errs.nomineeAge = 'Nominee must be 18+';
    if (!profileData.addressLine1 || profileData.addressLine1.length < 5) errs.addressLine1 = 'Address is required (min 5 chars)';
    if (!profileData.city || profileData.city.length < 2) errs.city = 'City is required';
    if (!profileData.pincode || !/^\d{6}$/.test(profileData.pincode)) errs.pincode = 'Valid 6-digit pincode required';
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setProfileSaving(true);
    setError(null);
    try {
      const { phone, email, ...studentFields } = profileData;
      await api.put('/auth/profile', studentFields);
      setStep('photo_contact');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoFile(reader.result as string);
      setPhotoChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const validateContact = (): boolean => {
    const errs: Record<string, string> = {};
    if (!profileData.phone || !/^[6-9]\d{9}$/.test(profileData.phone)) errs.phone = 'Valid 10-digit phone required';
    if (!profileData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) errs.email = 'Valid email required';
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveContact = async () => {
    if (!validateContact()) return;
    setContactSaving(true);
    setError(null);
    try {
      await api.put('/renewal/update-profile-for-renewal', {
        phone: profileData.phone,
        email: profileData.email,
        ...(photoChanged && photoFile ? { profilePhoto: photoFile } : {}),
      });
      setStep('payment');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update contact info');
    } finally {
      setContactSaving(false);
    }
  };

  const handlePayment = async () => {
    setError(null);
    try {
      await initiatePayment(
        {
          amount: 500,
          payment_type: 'MEMBERSHIP_RENEWAL',
          entity_id: Number(user?.id) || 0,
          entity_type: 'USER',
          notes: { purpose: 'Membership Renewal' },
        },
        { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
      );
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Payment failed');
    }
  };

  const handlePaymentSuccess = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await api.post('/renewal/self-renew', { paymentId: 'razorpay_confirmed' });
      setRenewalResult(res.data?.data);
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Renewal failed after payment. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const progressSteps = ['kyc', 'review_profile', 'photo_contact', 'payment', 'success'] as const;
  const progressLabels = ['Identity', 'Review Profile', 'Photo & Contact', 'Payment', 'Complete'];

  const getStepIndex = (s: Step) => {
    if (s === 'kyc' || s === 'kyc_verifying') return 0;
    return progressSteps.indexOf(s as any);
  };

  const currentIdx = getStepIndex(step);

  const FieldError = ({ field }: { field: string }) =>
    profileErrors[field] ? <p className="text-xs text-red-500 mt-1">{profileErrors[field]}</p> : null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" /> Renew Membership
          </h1>
          <p className="text-teal-100 text-sm mt-1">Complete verification, review your details, and pay to renew</p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            {progressSteps.map((s, i) => {
              const isDone = i < currentIdx;
              const isActive = i === currentIdx;
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-6 h-0.5 ${isDone ? 'bg-teal-500' : 'bg-gray-200'}`} />}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-teal-500 text-white' : isActive ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-500' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${isActive || isDone ? 'text-gray-900' : 'text-gray-400'}`}>{progressLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ===== Step 1: KYC Verification ===== */}
          {(step === 'kyc' || step === 'kyc_verifying') && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-1">Aadhaar Verification Required</h3>
                <p className="text-sm text-blue-700">
                  To renew your membership, you must verify your identity through Digilocker.
                </p>
              </div>

              {kycStep === 'verified' && kycResult ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Identity Verified</span>
                  </div>
                  <p className="text-sm text-green-700">Name: {kycResult.fullName}</p>
                  <p className="text-sm text-green-700">Aadhaar: {kycResult.maskedAadhaar}</p>
                  {step === 'kyc_verifying' && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying with SSFI records...
                    </div>
                  )}
                </div>
              ) : kycStep === 'waiting_for_user' || kycStep === 'polling' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                    <span className="font-semibold text-yellow-900">Waiting for Digilocker...</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">Complete the verification in the Digilocker popup window.</p>
                  <button onClick={reopenDigilocker} className="text-sm text-yellow-800 underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Reopen Digilocker window
                  </button>
                </div>
              ) : (
                <button
                  onClick={initializeDigilocker}
                  disabled={kycLoading}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {kycLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                  Verify with Digilocker
                </button>
              )}

              {kycError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{kycError}</p>
                  <button onClick={resetKyc} className="text-sm text-red-800 underline mt-1">Try Again</button>
                </div>
              )}
            </div>
          )}

          {/* ===== Step 2: Review & Edit Profile ===== */}
          {step === 'review_profile' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-1">Review Your Details</h3>
                <p className="text-sm text-blue-700">Please review and update your information. All mandatory fields must be filled before proceeding.</p>
              </div>

              {profileLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  <span className="ml-3 text-gray-600">Loading your profile...</span>
                </div>
              ) : (
                <>
                  {/* Personal Details */}
                  <div className={sectionCls}>
                    <h4 className="font-semibold text-gray-800 text-sm">Personal Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Full Name *</label>
                        <input className={`${inputCls} bg-gray-50`} value={profileData.name || ''} readOnly title="Name verified via Aadhaar KYC" />
                        <p className="text-xs text-gray-400 mt-0.5">Verified via Aadhaar</p>
                      </div>
                      <div>
                        <label className={labelCls}>Date of Birth *</label>
                        <input type="date" className={inputCls} value={profileData.dateOfBirth || ''} onChange={e => updateField('dateOfBirth', e.target.value)} />
                        <FieldError field="dateOfBirth" />
                      </div>
                      <div>
                        <label className={labelCls}>Gender *</label>
                        <select className={inputCls} value={profileData.gender || ''} onChange={e => updateField('gender', e.target.value)}>
                          <option value="">Select Gender</option>
                          {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                        </select>
                        <FieldError field="gender" />
                      </div>
                      <div>
                        <label className={labelCls}>Blood Group</label>
                        <select className={inputCls} value={profileData.bloodGroup || ''} onChange={e => updateField('bloodGroup', e.target.value)}>
                          <option value="">Select Blood Group</option>
                          {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Family Details */}
                  <div className={sectionCls}>
                    <h4 className="font-semibold text-gray-800 text-sm">Family Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Father&apos;s Name *</label>
                        <input className={inputCls} value={profileData.fatherName || ''} onChange={e => updateField('fatherName', e.target.value)} />
                        <FieldError field="fatherName" />
                      </div>
                      <div>
                        <label className={labelCls}>Mother&apos;s Name *</label>
                        <input className={inputCls} value={profileData.motherName || ''} onChange={e => updateField('motherName', e.target.value)} />
                        <FieldError field="motherName" />
                      </div>
                      <div>
                        <label className={labelCls}>Father&apos;s Occupation</label>
                        <select className={inputCls} value={profileData.fatherOccupation || ''} onChange={e => updateField('fatherOccupation', e.target.value)}>
                          <option value="">Select Occupation</option>
                          {FATHER_OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* School Details */}
                  <div className={sectionCls}>
                    <h4 className="font-semibold text-gray-800 text-sm">School / Education</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>School / College Name *</label>
                        <input className={inputCls} value={profileData.schoolName || ''} onChange={e => updateField('schoolName', e.target.value)} />
                        <FieldError field="schoolName" />
                      </div>
                      <div>
                        <label className={labelCls}>Academic Board</label>
                        <select className={inputCls} value={profileData.academicBoard || ''} onChange={e => updateField('academicBoard', e.target.value)}>
                          <option value="">Select Board</option>
                          {ACADEMIC_BOARDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Nominee Details */}
                  <div className={sectionCls}>
                    <h4 className="font-semibold text-gray-800 text-sm">Nominee Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelCls}>Nominee Name *</label>
                        <input className={inputCls} value={profileData.nomineeName || ''} onChange={e => updateField('nomineeName', e.target.value)} />
                        <FieldError field="nomineeName" />
                      </div>
                      <div>
                        <label className={labelCls}>Relation *</label>
                        <select className={inputCls} value={profileData.nomineeRelation || ''} onChange={e => updateField('nomineeRelation', e.target.value)}>
                          <option value="">Select Relation</option>
                          {NOMINEE_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <FieldError field="nomineeRelation" />
                      </div>
                      <div>
                        <label className={labelCls}>Nominee Age *</label>
                        <input type="number" className={inputCls} value={profileData.nomineeAge || ''} onChange={e => updateField('nomineeAge', e.target.value)} min={18} />
                        <FieldError field="nomineeAge" />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className={sectionCls}>
                    <h4 className="font-semibold text-gray-800 text-sm">State / District / Club</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelCls}>State</label>
                        <select className={inputCls} value={profileData.stateId || ''} onChange={e => handleStateChange(e.target.value)}>
                          <option value="">Select State</option>
                          {states.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>District</label>
                        <select className={inputCls} value={profileData.districtId || ''} onChange={e => handleDistrictChange(e.target.value)}>
                          <option value="">Select District</option>
                          {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Club</label>
                        <select className={inputCls} value={profileData.clubId || ''} onChange={e => updateField('clubId', e.target.value)}>
                          <option value="">Select Club</option>
                          {clubs.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className={sectionCls}>
                    <h4 className="font-semibold text-gray-800 text-sm">Address</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-3">
                        <label className={labelCls}>Address *</label>
                        <input className={inputCls} value={profileData.addressLine1 || ''} onChange={e => updateField('addressLine1', e.target.value)} placeholder="Full address" />
                        <FieldError field="addressLine1" />
                      </div>
                      <div>
                        <label className={labelCls}>City *</label>
                        <input className={inputCls} value={profileData.city || ''} onChange={e => updateField('city', e.target.value)} />
                        <FieldError field="city" />
                      </div>
                      <div>
                        <label className={labelCls}>Pincode *</label>
                        <input className={inputCls} value={profileData.pincode || ''} onChange={e => updateField('pincode', e.target.value)} maxLength={6} />
                        <FieldError field="pincode" />
                      </div>
                    </div>
                  </div>

                  {/* Coach */}
                  <div className={sectionCls}>
                    <h4 className="font-semibold text-gray-800 text-sm">Coach Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Coach Name</label>
                        <input className={inputCls} value={profileData.coachName || ''} onChange={e => updateField('coachName', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Coach Phone</label>
                        <input className={inputCls} value={profileData.coachPhone || ''} onChange={e => updateField('coachPhone', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {profileSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    Confirm & Continue
                  </button>
                </>
              )}
            </div>
          )}

          {/* ===== Step 3: Photo & Contact ===== */}
          {step === 'photo_contact' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-1">Photo & Contact Verification</h3>
                <p className="text-sm text-blue-700">Review your profile photo and verify your login credentials.</p>
              </div>

              {/* Photo Section */}
              <div className={sectionCls}>
                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Camera className="w-4 h-4" /> Profile Photo</h4>
                <div className="flex items-center gap-6">
                  <div className="w-28 h-28 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {photoFile ? (
                      <img src={photoFile} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      {photoChanged ? 'New photo selected. This will replace your current photo.' : 'Your current profile photo. You can replace it if needed.'}
                    </p>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" /> Replace Photo
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className={sectionCls}>
                <h4 className="font-semibold text-gray-800 text-sm">Login Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}><Phone className="w-3.5 h-3.5 inline mr-1" />Phone Number *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-gray-600 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">+91</span>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        value={profileData.phone || ''}
                        onChange={e => updateField('phone', e.target.value)}
                        maxLength={10}
                        placeholder="10-digit number"
                      />
                    </div>
                    <FieldError field="phone" />
                  </div>
                  <div>
                    <label className={labelCls}><Mail className="w-3.5 h-3.5 inline mr-1" />Email Address *</label>
                    <input
                      type="email"
                      className={inputCls}
                      value={profileData.email || ''}
                      onChange={e => updateField('email', e.target.value)}
                      placeholder="your@email.com"
                    />
                    <FieldError field="email" />
                  </div>
                </div>

                {/* Important Warning */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mt-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">VERY IMPORTANT</p>
                      <p className="text-sm text-amber-800 mt-1">
                        Your <strong>phone number</strong> and <strong>email address</strong> are used as your login credentials.
                        Please make sure they are correct before continuing. If you change them here, your new phone/email
                        will be required for future logins.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveContact}
                disabled={contactSaving}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {contactSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Confirm & Proceed to Payment
              </button>
            </div>
          )}

          {/* ===== Step 4: Payment ===== */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-900 font-medium">Profile verified and updated successfully</span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Renewal Payment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete the payment to renew your SSFI membership for 12 months.
                </p>
                <button
                  onClick={handlePayment}
                  disabled={payLoading || processing}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payLoading || processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  Pay & Renew
                </button>
              </div>
            </div>
          )}

          {/* ===== Step 5: Success ===== */}
          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Membership Renewed!</h3>
              <p className="text-gray-600">
                Your SSFI membership has been renewed successfully.
              </p>
              {renewalResult && (
                <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-1">
                  <p><span className="text-gray-500">UID:</span> <span className="font-mono font-bold">{renewalResult.uid}</span></p>
                  <p><span className="text-gray-500">Valid until:</span> <span className="font-bold text-green-700">{new Date(renewalResult.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                  <p><span className="text-gray-500">Status:</span> <span className="text-green-600 font-semibold">{renewalResult.accountStatus}</span></p>
                </div>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
