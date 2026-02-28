'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Award, Sparkles, User, Phone, Mail,
  Calendar, CheckCircle2, Loader2, Search, AlertCircle,
  ShieldCheck, Fingerprint, CreditCard, ChevronRight, RefreshCw,
  MapPin, Users, Clock,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface Program {
  id: number;
  category: string;
  title: string;
  price: string;
  venue: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  lastDateToApply: string;
  totalSeats: number;
  filledSeats: number;
  ageGroup: string | null;
  minAge: number | null;
  maxAge: number | null;
}

interface StudentData {
  studentId: number;
  userId: number;
  ssfiUid: string;
  fullName: string;
  fatherName: string;
  motherName: string | null;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string | null;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  clubName: string;
  coachName: string;
  nomineeName: string;
  nomineeAge: number;
  nomineeRelation: string;
  approvalStatus: string;
}

const BLOOD_GROUP_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
};

const CAT_CFG: Record<string, { label: string; gradient: string; emoji: string }> = {
  SPEED_SKATING: { label: 'Speed Skating', gradient: 'from-sky-500 to-cyan-500', emoji: '⚡' },
  ARTISTIC: { label: 'Artistic Skating', gradient: 'from-pink-500 to-rose-500', emoji: '🎨' },
  INLINE_HOCKEY: { label: 'Inline Hockey', gradient: 'from-amber-500 to-orange-500', emoji: '🏒' },
  GENERAL: { label: 'General', gradient: 'from-violet-500 to-purple-500', emoji: '⛸️' },
};

// Step indicator
function StepIndicator({ step }: { step: number }) {
  const steps = ['Program & UID', 'Review Details', 'Confirm & Register'];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${done ? 'bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/25'
                  : active ? 'bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/25 ring-4 ring-pink-500/20'
                  : 'bg-gray-100 text-gray-400'}`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : idx}
              </div>
              <span className={`text-xs mt-1.5 font-medium hidden sm:block ${active ? 'text-pink-600' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 md:w-24 h-0.5 mx-1 mb-4 transition-all ${done ? 'bg-gradient-to-r from-pink-500 to-violet-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BeginnerRegForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('programId');

  const [step, setStep] = useState(1);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState(preselectedId || '');
  const [uid, setUid] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [student, setStudent] = useState<StudentData | null>(null);

  // Extra fields student fills in
  const [extras, setExtras] = useState({
    tshirtSize: '',
    skatingExperience: '',
    currentSkillLevel: '',
    whatsapp: '',
  });

  // Declarations
  const [decl1, setDecl1] = useState(false);
  const [decl2, setDecl2] = useState(false);
  const [decl3, setDecl3] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState<{ regNo: string } | null>(null);

  useEffect(() => {
    api.get('/beginner-cert/programs/active').then(res => {
      setPrograms(res.data?.data || []);
    }).catch(console.error).finally(() => setProgramsLoading(false));
  }, []);

  const selectedProgram = programs.find(p => p.id === Number(selectedProgramId));

  // Eligibility check
  const getEligibility = useCallback(() => {
    if (!student || !selectedProgram) return null;
    const issues: string[] = [];

    if (selectedProgram.filledSeats >= selectedProgram.totalSeats) {
      issues.push('Program is fully booked');
    }
    if (new Date(selectedProgram.lastDateToApply) < new Date()) {
      issues.push('Registration deadline has passed');
    }
    if (selectedProgram.minAge || selectedProgram.maxAge) {
      const dob = new Date(student.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (selectedProgram.minAge && age < selectedProgram.minAge) {
        issues.push(`Minimum age is ${selectedProgram.minAge} years (you are ${age})`);
      }
      if (selectedProgram.maxAge && age > selectedProgram.maxAge) {
        issues.push(`Maximum age is ${selectedProgram.maxAge} years (you are ${age})`);
      }
    }

    return { eligible: issues.length === 0, issues };
  }, [student, selectedProgram]);

  const handleLookup = async () => {
    if (!selectedProgramId) {
      toast.error('Please select a program first');
      return;
    }
    if (!uid.trim()) {
      toast.error('Please enter your SSFI UID');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    setStudent(null);
    try {
      const res = await api.get(`/beginner-cert/lookup-student?uid=${encodeURIComponent(uid.trim())}`);
      setStudent(res.data?.data);
      toast.success('Student details fetched successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not find student with this UID';
      setLookupError(msg);
      toast.error(msg);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleProceedToReview = () => {
    if (!student) { toast.error('Please look up your SSFI UID first'); return; }
    const elig = getEligibility();
    if (elig && !elig.eligible) {
      toast.error(elig.issues[0]);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!decl1 || !decl2 || !decl3) {
      toast.error('Please accept all declarations to proceed');
      return;
    }
    if (!student || !selectedProgram) return;

    setSubmitting(true);
    try {
      const payload = {
        programId: Number(selectedProgramId),
        fullName: student.fullName,
        fatherName: student.fatherName,
        motherName: student.motherName || '',
        gender: student.gender,
        dateOfBirth: new Date(student.dateOfBirth).toISOString().split('T')[0],
        phone: student.phone,
        email: student.email || '',
        whatsapp: extras.whatsapp || student.phone,
        address: student.address || '',
        city: student.city,
        district: student.district,
        state: student.state,
        pincode: student.pincode,
        bloodGroup: student.bloodGroup ? BLOOD_GROUP_LABELS[student.bloodGroup] || student.bloodGroup : '',
        skatingExperience: extras.skatingExperience ? parseInt(extras.skatingExperience) : 0,
        currentSkillLevel: extras.currentSkillLevel || 'BEGINNER',
        clubName: student.clubName,
        tshirtSize: extras.tshirtSize || undefined,
        guardianName: student.nomineeName,
        guardianRelation: student.nomineeRelation === 'Father' ? 'FATHER' : student.nomineeRelation === 'Mother' ? 'MOTHER' : 'GUARDIAN',
        guardianPhone: student.phone,
        guardianEmail: student.email || undefined,
        aadhaarNumber: '000000000000', // dummy - real aadhaar already in DB, required by schema
        declaration1: true,
        declaration2: true,
        declaration3: true,
      };

      const res = await api.post('/beginner-cert/register', payload);
      const regNo = res.data?.data?.registrationNumber || 'N/A';
      setRegSuccess({ regNo });
      toast.success('Registration successful!');
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 shadow-sm";
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

  const eligibility = getEligibility();
  const spotsLeft = selectedProgram ? Math.max(0, selectedProgram.totalSeats - selectedProgram.filledSeats) : 0;

  if (programsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50] py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-bold mb-4">
            <Sparkles className="w-4 h-4" /> Registration Form
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Beginner Certification Registration</h1>
          <p className="text-white/50 text-sm">For registered SSFI students only. Enter your SSFI UID to auto-fill your details.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <StepIndicator step={step} />

        <AnimatePresence mode="wait">

          {/* ═══════════════ STEP 1: Program + UID ═══════════════ */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">

              {/* Program Selection */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" /> Select Program
                </h2>
                {programs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No active programs available right now.</p>
                    <Link href="/beginner-certification" className="text-pink-500 text-sm underline mt-1 inline-block">View all programs</Link>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedProgramId}
                      onChange={e => { setSelectedProgramId(e.target.value); setStudent(null); setLookupError(''); }}
                      className={inputCls}
                    >
                      <option value="">-- Choose a program --</option>
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>
                          {CAT_CFG[p.category]?.emoji || '⛸️'} {p.category.replace(/_/g, ' ')}: {p.title} — {p.city} (₹{Number(p.price).toLocaleString()})
                          {p.ageGroup ? ` [Ages ${p.ageGroup}]` : ''}
                        </option>
                      ))}
                    </select>

                    {selectedProgram && (
                      <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-100">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-pink-500" />
                            {new Date(selectedProgram.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(selectedProgram.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-400" />{selectedProgram.venue}, {selectedProgram.city}</span>
                          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-violet-400" />{spotsLeft} seats left</span>
                          <span className="font-bold text-pink-700">₹{Number(selectedProgram.price).toLocaleString()}</span>
                        </div>
                        {selectedProgram.ageGroup && (
                          <p className="text-xs text-violet-600 mt-2 font-medium">Age Group: {selectedProgram.ageGroup}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* SSFI UID Lookup */}
              {selectedProgramId && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-blue-500" /> Enter Your SSFI UID
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Your details will be automatically fetched from our records.</p>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={uid}
                      onChange={e => { setUid(e.target.value); setLookupError(''); setStudent(null); }}
                      onKeyDown={e => e.key === 'Enter' && handleLookup()}
                      placeholder="e.g. SSFI/BS/TN/25/S0001"
                      className={`flex-1 px-4 py-3 bg-gray-50 border ${lookupError ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-pink-400'} rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-sm font-mono`}
                    />
                    <button
                      onClick={handleLookup}
                      disabled={lookupLoading || !uid.trim()}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/35 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Fetch
                    </button>
                  </div>

                  {lookupError && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{lookupError}</span>
                    </motion.div>
                  )}

                  {/* Student Card (after successful lookup) */}
                  {student && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-xl border border-green-200 bg-green-50 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500">
                        <ShieldCheck className="w-5 h-5 text-white" />
                        <div>
                          <p className="text-white font-bold text-sm">Student Found & Verified</p>
                          <p className="text-white/70 text-xs">{student.ssfiUid}</p>
                        </div>
                      </div>
                      {/* Details */}
                      <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-gray-400 text-xs mb-0.5">Full Name</p><p className="font-semibold text-gray-900">{student.fullName}</p></div>
                        <div><p className="text-gray-400 text-xs mb-0.5">Father's Name</p><p className="font-medium text-gray-700">{student.fatherName}</p></div>
                        <div><p className="text-gray-400 text-xs mb-0.5">Gender</p><p className="font-medium text-gray-700">{student.gender}</p></div>
                        <div><p className="text-gray-400 text-xs mb-0.5">Date of Birth</p><p className="font-medium text-gray-700">{new Date(student.dateOfBirth).toLocaleDateString('en-IN')}</p></div>
                        <div><p className="text-gray-400 text-xs mb-0.5">Phone</p><p className="font-medium text-gray-700">{student.phone}</p></div>
                        <div><p className="text-gray-400 text-xs mb-0.5">Email</p><p className="font-medium text-gray-700 truncate">{student.email || '—'}</p></div>
                        <div><p className="text-gray-400 text-xs mb-0.5">Club</p><p className="font-medium text-gray-700">{student.clubName || '—'}</p></div>
                        <div><p className="text-gray-400 text-xs mb-0.5">State</p><p className="font-medium text-gray-700">{student.state}</p></div>
                      </div>

                      {/* Eligibility */}
                      {eligibility && (
                        <div className={`mx-4 mb-4 p-3 rounded-xl text-sm font-medium flex items-start gap-2
                          ${eligibility.eligible ? 'bg-emerald-100 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                          {eligibility.eligible
                            ? <><CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> You are eligible for this program!</>
                            : <><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{eligibility.issues[0]}</span></>
                          }
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Proceed Button */}
              <div className="flex items-center justify-between pt-2">
                <Link href="/beginner-certification" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back to Programs
                </Link>
                <button
                  onClick={handleProceedToReview}
                  disabled={!student || !eligibility?.eligible}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/35 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ STEP 2: Review & Extra Fields ═══════════════ */}
          {step === 2 && student && selectedProgram && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">

              {/* Program Summary Card */}
              <div className={`rounded-2xl overflow-hidden shadow-sm`}>
                <div className={`h-1.5 bg-gradient-to-r ${CAT_CFG[selectedProgram.category]?.gradient || 'from-pink-500 to-violet-500'}`} />
                <div className="bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{CAT_CFG[selectedProgram.category]?.emoji || '⛸️'}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{CAT_CFG[selectedProgram.category]?.label}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{selectedProgram.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-pink-500" />{new Date(selectedProgram.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(selectedProgram.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-rose-400" />{selectedProgram.venue}, {selectedProgram.city}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-extrabold text-gray-900">₹{Number(selectedProgram.price).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{spotsLeft} seats left</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Details (Read-Only) */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" /> Your Details
                  </h2>
                  <button onClick={() => setStep(1)} className="text-xs text-pink-500 font-semibold flex items-center gap-1 hover:text-pink-700">
                    <RefreshCw className="w-3 h-3" /> Change UID
                  </button>
                </div>

                <div className="p-3 mb-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  Details fetched from SSFI database for UID: <strong>{student.ssfiUid}</strong>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', value: student.fullName },
                    { label: "Father's Name", value: student.fatherName },
                    { label: "Mother's Name", value: student.motherName || '—' },
                    { label: 'Gender', value: student.gender },
                    { label: 'Date of Birth', value: new Date(student.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { label: 'Blood Group', value: student.bloodGroup ? (BLOOD_GROUP_LABELS[student.bloodGroup] || student.bloodGroup) : '—' },
                    { label: 'Phone', value: student.phone, icon: <Phone className="w-3.5 h-3.5 text-green-500" /> },
                    { label: 'Email', value: student.email || '—', icon: <Mail className="w-3.5 h-3.5 text-blue-500" /> },
                    { label: 'City', value: student.city },
                    { label: 'State', value: student.state },
                    { label: 'Club', value: student.clubName || '—' },
                    { label: 'Coach', value: student.coachName || '—' },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">{f.icon}{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* Guardian (from nominee) */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-700 mb-3">Guardian / Nominee</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Name</p>
                      <p className="text-sm font-semibold text-gray-800">{student.nomineeName}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Relation</p>
                      <p className="text-sm font-semibold text-gray-800">{student.nomineeRelation}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Age</p>
                      <p className="text-sm font-semibold text-gray-800">{student.nomineeAge}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra Fields */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> Additional Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>T-Shirt Size</label>
                    <select value={extras.tshirtSize} onChange={e => setExtras(x => ({ ...x, tshirtSize: e.target.value }))} className={inputCls}>
                      <option value="">Select size</option>
                      {['S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Skating Experience (months)</label>
                    <input type="number" value={extras.skatingExperience} onChange={e => setExtras(x => ({ ...x, skatingExperience: e.target.value }))}
                      placeholder="0 = brand new" min={0} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Current Skill Level</label>
                    <select value={extras.currentSkillLevel} onChange={e => setExtras(x => ({ ...x, currentSkillLevel: e.target.value }))} className={inputCls}>
                      <option value="">Select level</option>
                      <option value="BEGINNER">Beginner (never skated)</option>
                      <option value="BASIC">Basic (can balance)</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp Number (optional)</label>
                    <input type="tel" value={extras.whatsapp} onChange={e => setExtras(x => ({ ...x, whatsapp: e.target.value }))}
                      placeholder={student.phone} maxLength={10} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/35 transition-all">
                  Proceed to Register <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ STEP 3: Declaration + Register / Success ═══════════════ */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">

              {regSuccess ? (
                /* Success State */
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-pink-500/30">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Registration Successful! 🎉</h2>
                  <p className="text-gray-500 mb-6 text-sm">Your registration has been submitted. A confirmation email has been sent to your registered email address.</p>

                  <div className="inline-block bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-200 rounded-2xl px-8 py-5 mb-6">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Registration Number</p>
                    <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-violet-600 tracking-wider">{regSuccess.regNo}</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6 max-w-md mx-auto">
                    <p className="font-semibold mb-1">📋 What's next?</p>
                    <p>Please save your registration number. Payment confirmation and further instructions will be sent to your registered email. Present this number at the venue on the event day.</p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <Link href="/beginner-certification"
                      className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all">
                      View Programs
                    </Link>
                    <Link href="/"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/35 transition-all">
                      Go to Home
                    </Link>
                  </div>
                </div>
              ) : (
                /* Declaration + Submit */
                <>
                  {/* Mini Summary */}
                  {student && selectedProgram && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Registration Summary</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{student.fullName}</p>
                          <p className="text-sm text-gray-500">{student.ssfiUid}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{selectedProgram.title}</p>
                          <p className="text-sm text-pink-600 font-semibold">₹{Number(selectedProgram.price).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Declarations */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500" /> Declaration
                    </h2>
                    <div className="space-y-3">
                      {[
                        { val: decl1, set: setDecl1, text: 'I confirm all information provided is accurate. I am the parent/guardian of the student being registered.' },
                        { val: decl2, set: setDecl2, text: 'I understand SSFI is not liable for any injuries during the program. I authorize medical treatment if needed.' },
                        { val: decl3, set: setDecl3, text: 'I agree to abide by the rules and regulations of SSFI and the certification program.' },
                      ].map((d, i) => (
                        <label key={i} className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${d.val ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                          <input type="checkbox" checked={d.val} onChange={e => d.set(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500" />
                          <span className="text-sm text-gray-600 leading-relaxed">{d.text}</span>
                        </label>
                      ))}
                      {(!decl1 || !decl2 || !decl3) && (
                        <p className="text-xs text-amber-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> All three declarations must be accepted to proceed.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email notice */}
                  {student?.email && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
                      <Mail className="w-5 h-5 flex-shrink-0" />
                      <span>A confirmation email with program details will be sent to <strong>{student.email}</strong> after registration.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !decl1 || !decl2 || !decl3}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      {submitting ? 'Submitting...' : 'Complete Registration'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default function BeginnerCertRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <BeginnerRegForm />
    </Suspense>
  );
}
