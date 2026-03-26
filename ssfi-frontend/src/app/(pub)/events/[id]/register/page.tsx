'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Trophy, Loader2, CheckCircle2,
  AlertCircle, Search, ShieldCheck, Fingerprint, ChevronRight,
  RefreshCw, MapPin, Zap, Mail, Clock, Users, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentData {
  id: number;
  uid: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  age: number;
  ageCategory: string;
  email: string | null;
  phone: string | null;
  club?: { id: number; name: string };
  district?: { id: number; name: string };
  state?: { id: number; name: string };
}

interface EventFee {
  entryFee: number;
  lateFee: number;
  isLateFee: boolean;
  totalFee: number;
  paymentMode?: string;
}

interface RaceOption {
  id: string;
  name: string;
}

interface RaceRules {
  min: number;
  max: number;
  description: string;
  mandatory: string[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const SKATE_CATEGORIES = [
  { value: 'BEGINNER',     label: 'Beginner',    emoji: '🌱', desc: 'Just starting out' },
  { value: 'RECREATIONAL', label: 'Recreational', emoji: '⛸️', desc: 'Casual skater' },
  { value: 'QUAD',         label: 'Quad',         emoji: '🎡', desc: 'Quad inline skates' },
  { value: 'PRO_INLINE',   label: 'Pro Inline',   emoji: '⚡', desc: 'Advanced inline' },
];

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ['Verify UID', 'Category', 'Select Races', 'Confirm'];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done   = idx < step;
        const active = idx === step;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${done
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : active
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-500/20'
                  : 'bg-gray-100 text-gray-400'}`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : idx}
              </div>
              <span className={`text-xs mt-1.5 font-medium hidden sm:block whitespace-nowrap transition-colors
                ${active ? 'text-emerald-600' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 md:w-20 h-0.5 mx-1 mb-4 transition-all duration-500
                ${done ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EventRegistrationPage() {
  const params   = useParams();
  const router   = useRouter();
  const eventId  = Number(params.id);

  const [step, setStep]               = useState(1);
  const [eventLoading, setEventLoading] = useState(true);
  const [event, setEvent]             = useState<any>(null);

  // Step 1 — UID lookup
  const [uid, setUid]                 = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [eventFee, setEventFee]       = useState<EventFee | null>(null);

  // Step 2 — Category
  const [eventCategories, setEventCategories] = useState<Array<{ name: string; label: string }>>([]);
  const [category, setCategory]       = useState('');

  // Step 3 — Races
  const [racesLoading, setRacesLoading] = useState(false);
  const [availableRaces, setAvailableRaces] = useState<RaceOption[]>([]);
  const [raceRules, setRaceRules]     = useState<RaceRules | null>(null);
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);

  // Step 4 — Confirm
  const [suitSize, setSuitSize]       = useState('M');
  const [submitting, setSubmitting]   = useState(false);
  const [regSuccess, setRegSuccess]   = useState<{ confirmationNumber: string; totalFee: number } | null>(null);

  // ── Load event header + categories ──
  useEffect(() => {
    api.get(`/events/${eventId}`)
      .then(res => setEvent(res.data?.data || res.data))
      .catch(() => {})
      .finally(() => setEventLoading(false));

    // Fetch event-specific categories
    api.get(`/event-registration/event-categories/${eventId}`)
      .then(res => {
        const cats = res.data?.data || [];
        setEventCategories(cats);
        if (cats.length > 0 && !category) setCategory(cats[0].name);
      })
      .catch(() => {
        // Fallback to defaults
        setEventCategories(SKATE_CATEGORIES.map(c => ({ name: c.value, label: c.label })));
        if (!category) setCategory('BEGINNER');
      });
  }, [eventId]);

  // ── Step 1: lookup ──
  const handleLookup = async () => {
    if (!uid.trim()) { toast.error('Please enter your SSFI UID'); return; }
    setLookupLoading(true);
    setLookupError('');
    setStudentData(null);
    setEventFee(null);
    try {
      const res = await api.post('/event-registration/lookup', { uid: uid.trim(), eventId });
      const d   = res.data?.data;
      setStudentData(d.student);
      setEventFee(d.event);
      toast.success('Student verified!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'No student found with this UID';
      setLookupError(msg);
      toast.error(msg);
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Step 2→3: fetch races ──
  const handleFetchRaces = async () => {
    if (!studentData) return;
    setRacesLoading(true);
    try {
      const res  = await api.get(`/event-registration/races?category=${category}&ageGroup=${studentData.ageCategory || 'OPEN'}&eventId=${eventId}`);
      const d    = res.data?.data;
      const races: RaceOption[] = (d.availableRaces || []).map((r: string) => ({
        id: r,
        name: r.replace(/_/g, ' ').replace(/\bRACE\b/gi, '').trim(),
      }));
      setAvailableRaces(races);
      setRaceRules({ min: d.minRaces, max: d.maxRaces, description: d.description, mandatory: d.mandatoryRaces || [] });
      setSelectedRaces(d.mandatoryRaces || []);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      toast.error('Failed to load races. Please try again.');
    } finally {
      setRacesLoading(false);
    }
  };

  const toggleRace = (raceId: string) => {
    if (raceRules?.mandatory.includes(raceId)) { toast.error('This race is mandatory'); return; }
    setSelectedRaces(prev => {
      if (prev.includes(raceId)) return prev.filter(r => r !== raceId);
      if (raceRules && prev.length >= raceRules.max) { toast.error(`Maximum ${raceRules.max} races allowed`); return prev; }
      return [...prev, raceId];
    });
  };

  // ── Step 4: submit ──
  const handleSubmit = async () => {
    if (!studentData || !eventFee) return;
    if (raceRules && selectedRaces.length < raceRules.min) {
      toast.error(`Please select at least ${raceRules.min} race(s)`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/event-registration/register', {
        studentUid: studentData.uid,
        studentId:  studentData.id,
        eventId,
        category,
        skateCategory: category,
        selectedRaces,
        suitSize,
      });
      const reg = res.data?.data;
      setRegSuccess({ confirmationNumber: reg.confirmationNumber, totalFee: reg.totalFee });
      toast.success('Registration successful!');
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Shared styles ──
  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 shadow-sm transition-colors";
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";
  const btnPrimary = "inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const btnSecondary = "inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors";

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50] py-14 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
        <div className="relative max-w-3xl mx-auto px-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Event
          </button>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-4">
            <Sparkles className="w-4 h-4" /> Event Registration
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight">
            {eventLoading ? (
              <span className="inline-block w-64 h-8 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              event?.name || 'Event Registration'
            )}
          </h1>
          {event && (
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />{event.venue}, {event.city}
                </span>
              )}
              {event.entryFee > 0 && (
                <span className="font-bold text-emerald-300">₹{Number(event.entryFee).toLocaleString('en-IN')}</span>
              )}
            </div>
          )}
          <p className="text-white/40 text-sm mt-3">For registered SSFI students only. Enter your UID to proceed.</p>
        </div>
        <div className="h-px w-full mt-14" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />
      </section>

      {/* ── Form body ────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {step < 5 && <StepIndicator step={step} />}

        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════
              STEP 1 — UID Lookup
          ══════════════════════════════════════════════════════ */}
          {step === 1 && (
            <motion.div key="s1"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-emerald-500" /> Enter Your SSFI UID
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Your details and event eligibility will be verified automatically.
                </p>

                {/* UID input row */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={uid}
                    onChange={e => { setUid(e.target.value); setLookupError(''); setStudentData(null); }}
                    onKeyDown={e => e.key === 'Enter' && handleLookup()}
                    placeholder="e.g. SSFI/BS/TN/25/S0001"
                    className={`flex-1 px-4 py-3 bg-gray-50 border ${lookupError ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-emerald-400'} rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm font-mono transition-colors`}
                  />
                  <button
                    onClick={handleLookup}
                    disabled={lookupLoading || !uid.trim()}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {lookupLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Search className="w-4 h-4" />}
                    Verify
                  </button>
                </div>

                {/* Error */}
                {lookupError && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {lookupError}
                  </motion.div>
                )}

                {/* Student card */}
                {studentData && eventFee && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-xl border border-green-200 overflow-hidden">

                    {/* Green verified header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500">
                      <ShieldCheck className="w-5 h-5 text-white" />
                      <div>
                        <p className="text-white font-bold text-sm">Student Verified ✓</p>
                        <p className="text-white/70 text-xs font-mono">{studentData.uid}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-white/60 text-xs">Age Category</p>
                        <p className="text-white font-bold text-sm">{studentData.ageCategory}</p>
                      </div>
                    </div>

                    {/* Student details grid */}
                    <div className="bg-green-50 p-4 grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Full Name',  value: studentData.fullName },
                        { label: 'Age',        value: `${studentData.age} years` },
                        { label: 'Club',       value: studentData.club?.name || '—' },
                        { label: 'District',   value: studentData.district?.name || '—' },
                        { label: 'State',      value: studentData.state?.name || '—' },
                        { label: 'Gender',     value: studentData.gender },
                      ].map((f, i) => (
                        <div key={i}>
                          <p className="text-gray-400 text-xs mb-0.5">{f.label}</p>
                          <p className="font-semibold text-gray-900">{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Fee bar */}
                    <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="text-emerald-700 font-medium">
                          {eventFee.isLateFee ? '⚠️ Late fee applies' : '✅ Regular registration fee'}
                        </p>
                        {eventFee.isLateFee && (
                          <p className="text-emerald-500 text-xs">Includes late fee of ₹{eventFee.lateFee.toLocaleString('en-IN')}</p>
                        )}
                      </div>
                      <p className="text-emerald-800 font-extrabold text-lg">₹{eventFee.totalFee.toLocaleString('en-IN')}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Nav */}
              <div className="flex items-center justify-between pt-1">
                <Link href={`/events/${eventId}`} className={btnSecondary}>
                  <ArrowLeft className="w-4 h-4" /> Back to Event
                </Link>
                <button
                  onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={!studentData}
                  className={btnPrimary}
                >
                  Select Category <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 2 — Select Skating Category
          ══════════════════════════════════════════════════════ */}
          {step === 2 && studentData && (
            <motion.div key="s2"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-teal-500" /> Select Skating Category
                  </h2>
                  <button onClick={() => setStep(1)}
                    className="text-xs text-emerald-500 font-semibold flex items-center gap-1 hover:text-emerald-700 transition-colors">
                    <RefreshCw className="w-3 h-3" /> Change UID
                  </button>
                </div>

                {/* Mini student pill */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100 mb-5">
                  <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{studentData.fullName}</p>
                    <p className="text-xs text-gray-500 font-mono">{studentData.uid}
                      <span className="ml-2 not-italic font-sans">• Age: <strong>{studentData.ageCategory}</strong></span>
                    </p>
                  </div>
                </div>

                {/* Category grid */}
                <div className="grid grid-cols-2 gap-3">
                  {(eventCategories.length > 0 ? eventCategories : SKATE_CATEGORIES.map(c => ({ name: c.value, label: c.label }))).map(cat => {
                    const active = category === cat.name;
                    const defaultCat = SKATE_CATEGORIES.find(c => c.value === cat.name);
                    return (
                      <button key={cat.name} onClick={() => setCategory(cat.name)}
                        className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                          ${active
                            ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}>
                        <span className="text-2xl">{defaultCat?.emoji || '🏅'}</span>
                        <div className="min-w-0">
                          <p className={`font-bold text-sm ${active ? 'text-emerald-700' : 'text-gray-800'}`}>{cat.label}</p>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0 absolute top-3 right-3" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nav */}
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={btnSecondary}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleFetchRaces} disabled={racesLoading} className={btnPrimary}>
                  {racesLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading Races…</>
                    : <>View Races <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 3 — Select Races
          ══════════════════════════════════════════════════════ */}
          {step === 3 && studentData && (
            <motion.div key="s3"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" /> Select Races
                </h2>
                {raceRules && (
                  <p className="text-sm text-gray-500 mb-5">
                    {raceRules.description} &mdash;
                    <span className="font-medium text-gray-700"> Select {raceRules.min}–{raceRules.max} race{raceRules.max !== 1 ? 's' : ''}</span>
                  </p>
                )}

                {availableRaces.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No races available for this category and age group.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {availableRaces.map(race => {
                      const isMandatory = raceRules?.mandatory.includes(race.id);
                      const isSelected  = selectedRaces.includes(race.id);
                      return (
                        <label key={race.id}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                            ${isSelected
                              ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'}
                            ${isMandatory ? 'cursor-default' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRace(race.id)}
                            disabled={isMandatory}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500/20 flex-shrink-0"
                          />
                          <span className={`text-sm font-medium flex-1 ${isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>
                            {race.name}
                          </span>
                          {isMandatory && (
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-100 px-2.5 py-1 rounded-full">
                              Mandatory
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Selection counter */}
                <div className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2
                  ${selectedRaces.length >= (raceRules?.min || 1)
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                    : 'bg-teal-50 border border-teal-100 text-teal-700'}`}>
                  {selectedRaces.length >= (raceRules?.min || 1)
                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>
                    <strong>{selectedRaces.length}</strong> race{selectedRaces.length !== 1 ? 's' : ''} selected
                    {raceRules && ` (min ${raceRules.min}, max ${raceRules.max})`}
                  </span>
                </div>
              </div>

              {/* Nav */}
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={btnSecondary}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={selectedRaces.length < (raceRules?.min || 1)}
                  className={btnPrimary}
                >
                  Review & Confirm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 4 — Confirm & Submit
          ══════════════════════════════════════════════════════ */}
          {step === 4 && studentData && eventFee && (
            <motion.div key="s4"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">

              {/* Summary card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" /> Registration Summary
                </h2>

                <div className="divide-y divide-gray-100">
                  {[
                    { label: 'Student',        value: studentData.fullName },
                    { label: 'SSFI UID',        value: studentData.uid, mono: true },
                    { label: 'Event',           value: event?.name || `Event #${eventId}` },
                    { label: 'Age Category',    value: studentData.ageCategory },
                    { label: 'Club',            value: studentData.club?.name || '—' },
                    { label: 'Skate Category',  value: SKATE_CATEGORIES.find(c => c.value === category)?.label || category },
                    { label: 'Selected Races',  value: selectedRaces.map(r => r.replace(/_/g, ' ')).join(', ') || '—' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between py-3 text-sm gap-4">
                      <span className="text-gray-400 flex-shrink-0">{row.label}</span>
                      <span className={`font-semibold text-gray-800 text-right ${row.mono ? 'font-mono text-xs' : ''}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Suit size */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <label className={labelCls}>Suit Size</label>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                      <button key={s} onClick={() => setSuitSize(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all
                          ${suitSize === s
                            ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total fee */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Entry Fee</p>
                    {eventFee.isLateFee && (
                      <p className="text-xs text-emerald-500 mt-0.5">
                        Includes late fee of ₹{eventFee.lateFee.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900">
                    ₹{eventFee.totalFee.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Email notice */}
              {studentData.email && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  A confirmation email will be sent to <strong className="ml-1">{studentData.email}</strong>
                </div>
              )}

              {/* Nav */}
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={btnSecondary}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
                    : <><Zap className="w-4 h-4" /> Register Now</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 5 — Success
          ══════════════════════════════════════════════════════ */}
          {step === 5 && regSuccess && (
            <motion.div key="s5"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6">

              {/* Animated check */}
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Registration Successful! 🎉</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                {eventFee?.paymentMode === 'OFFLINE'
                  ? 'Your registration is confirmed. Please pay the entry fee to the event organizer.'
                  : 'Your spot is reserved. Complete payment to fully confirm your registration.'}
              </p>

              {/* Confirmation number */}
              <div className="inline-block bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl px-8 py-5 mb-5">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Confirmation Number</p>
                <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 tracking-wider font-mono">
                  {regSuccess.confirmationNumber}
                </p>
                <p className="text-sm text-gray-500 mt-1.5">
                  Entry Fee: <strong>₹{regSuccess.totalFee.toLocaleString('en-IN')}</strong>
                </p>
              </div>

              {/* Email sent notice */}
              {studentData?.email && (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 mb-5">
                  <Mail className="w-4 h-4" />
                  Confirmation sent to <strong className="ml-1">{studentData.email}</strong>
                </div>
              )}

              {/* Next steps box */}
              {eventFee?.paymentMode === 'OFFLINE' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6 max-w-md mx-auto text-left">
                  <p className="font-semibold mb-1">💵 Offline Payment</p>
                  <p>Please pay <strong>₹{regSuccess.totalFee.toLocaleString('en-IN')}</strong> in cash to the event organizer. Save your confirmation number — you will need to present it at the venue on event day.</p>
                </div>
              ) : (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-700 mb-6 max-w-md mx-auto text-left">
                  <p className="font-semibold mb-1">📋 Next Steps</p>
                  <p>Complete payment to secure your spot. Save your confirmation number — you will need to present it at the venue on event day.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {eventFee?.paymentMode !== 'OFFLINE' && (
                  <button
                    onClick={() => router.push(
                      `/payment?registrationId=${encodeURIComponent(regSuccess.confirmationNumber)}&amount=${regSuccess.totalFee}&eventId=${eventId}&eventName=${encodeURIComponent(event?.name || '')}`
                    )}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all">
                    <Zap className="w-4 h-4" /> Complete Payment
                  </button>
                )}
                <Link href="/events"
                  className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all">
                  View Events
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
