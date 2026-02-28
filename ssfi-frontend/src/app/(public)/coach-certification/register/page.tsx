'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Award, GraduationCap, User, Phone, Mail, MapPin,
  Calendar, Upload, FileText, CheckCircle2, Loader2, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

interface Program {
  id: number; level: number; title: string; price: string; city: string; state: string;
  startDate: string; endDate: string; lastDateToApply: string; totalSeats: number; filledSeats: number;
}

function CoachCertRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('programId');

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    programId: preselectedId || '',
    fullName: '', fatherName: '', gender: '', dateOfBirth: '',
    phone: '', email: '',
    address: '', city: '', district: '', state: '', pincode: '',
    bloodGroup: '', skatingExperience: '', tshirtSize: '',
    aadhaarNumber: '',
    declaration1: false, declaration2: false, declaration3: false,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [aadhaarCard, setAadhaarCard] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/coach-cert/programs/active').then(res => {
      setPrograms(res.data?.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.programId) e.programId = 'Select a program';
    if (!form.fullName || form.fullName.length < 2) e.fullName = 'Full name required';
    if (!form.fatherName || form.fatherName.length < 2) e.fatherName = "Father's name required";
    if (!form.gender) e.gender = 'Select gender';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth required';
    if (!form.phone || !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Valid 10-digit phone required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.address || form.address.length < 5) e.address = 'Address required';
    if (!form.city) e.city = 'City required';
    if (!form.district) e.district = 'District required';
    if (!form.state) e.state = 'State required';
    if (!form.pincode || !/^\d{6}$/.test(form.pincode)) e.pincode = 'Valid 6-digit pincode required';
    if (!form.aadhaarNumber || !/^\d{12}$/.test(form.aadhaarNumber)) e.aadhaarNumber = 'Valid 12-digit Aadhaar required';
    if (!form.declaration1) e.declaration1 = 'Required';
    if (!form.declaration2) e.declaration2 = 'Required';
    if (!form.declaration3) e.declaration3 = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the errors'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'programId' || k === 'skatingExperience') {
          formData.append(k, String(Number(v)));
        } else if (typeof v === 'boolean') {
          formData.append(k, String(v));
        } else {
          formData.append(k, String(v));
        }
      });
      if (photo) formData.append('photo', photo);
      if (aadhaarCard) formData.append('aadhaarCard', aadhaarCard);

      const res = await api.post('/coach-cert/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Registration successful! Reg No: ' + (res.data?.data?.registrationNumber || ''));
      router.push('/coach-certification');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const selectedProgram = programs.find(p => p.id === Number(form.programId));
  const inputCls = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 shadow-sm";
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";
  const errCls = "text-red-500 text-xs mt-1";

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-gray-300 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-4">
            <GraduationCap className="w-4 h-4" /> Registration Form
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Coach Certification Registration</h1>
          <p className="text-white/50">Fill in all required fields to register for a certification program</p>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 -mt-6 pb-16">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Program Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-emerald-500" /> Select Program</h2>
            <select value={form.programId} onChange={e => set('programId', e.target.value)} className={inputCls}>
              <option value="">-- Choose a program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>
                  Level {p.level}: {p.title} — {p.city} (&#8377;{Number(p.price).toLocaleString()})
                </option>
              ))}
            </select>
            {errors.programId && <p className={errCls}>{errors.programId}</p>}
            {selectedProgram && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
                <strong>{selectedProgram.title}</strong> — {new Date(selectedProgram.startDate).toLocaleDateString('en-IN')} to {new Date(selectedProgram.endDate).toLocaleDateString('en-IN')} | Fee: &#8377;{Number(selectedProgram.price).toLocaleString()} | {Math.max(0, selectedProgram.totalSeats - selectedProgram.filledSeats)} seats left
              </div>
            )}
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /> Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} className={inputCls} placeholder="As per Aadhaar" />
                {errors.fullName && <p className={errCls}>{errors.fullName}</p>}
              </div>
              <div>
                <label className={labelCls}>Father&apos;s Name *</label>
                <input type="text" value={form.fatherName} onChange={e => set('fatherName', e.target.value)} className={inputCls} />
                {errors.fatherName && <p className={errCls}>{errors.fatherName}</p>}
              </div>
              <div>
                <label className={labelCls}>Gender *</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.gender && <p className={errCls}>{errors.gender}</p>}
              </div>
              <div>
                <label className={labelCls}>Date of Birth *</label>
                <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className={inputCls} />
                {errors.dateOfBirth && <p className={errCls}>{errors.dateOfBirth}</p>}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-green-500" /> Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Phone *</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="10-digit mobile" maxLength={10} />
                {errors.phone && <p className={errCls}>{errors.phone}</p>}
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
                {errors.email && <p className={errCls}>{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-rose-500" /> Address</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Address *</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} rows={2} />
                {errors.address && <p className={errCls}>{errors.address}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City *</label>
                  <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} />
                  {errors.city && <p className={errCls}>{errors.city}</p>}
                </div>
                <div>
                  <label className={labelCls}>District *</label>
                  <input type="text" value={form.district} onChange={e => set('district', e.target.value)} className={inputCls} />
                  {errors.district && <p className={errCls}>{errors.district}</p>}
                </div>
                <div>
                  <label className={labelCls}>State *</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className={errCls}>{errors.state}</p>}
                </div>
                <div>
                  <label className={labelCls}>Pincode *</label>
                  <input type="text" value={form.pincode} onChange={e => set('pincode', e.target.value)} className={inputCls} maxLength={6} />
                  {errors.pincode && <p className={errCls}>{errors.pincode}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Skating & Additional */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-violet-500" /> Skating &amp; Additional</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Blood Group</label>
                <select value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Skating Experience (years)</label>
                <input type="number" value={form.skatingExperience} onChange={e => set('skatingExperience', e.target.value)} className={inputCls} min={0} />
              </div>
              <div>
                <label className={labelCls}>T-Shirt Size</label>
                <select value={form.tshirtSize} onChange={e => set('tshirtSize', e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {['S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" /> Documents</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Aadhaar Number *</label>
                <input type="text" value={form.aadhaarNumber} onChange={e => set('aadhaarNumber', e.target.value)} className={inputCls} placeholder="12-digit Aadhaar number" maxLength={12} />
                {errors.aadhaarNumber && <p className={errCls}>{errors.aadhaarNumber}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Photo (JPG/PNG, max 2MB)</label>
                  <input type="file" accept=".jpg,.jpeg,.png" onChange={e => setPhoto(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                </div>
                <div>
                  <label className={labelCls}>Aadhaar Card (JPG/PNG/PDF, max 5MB)</label>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setAadhaarCard(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                </div>
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-teal-500" /> Declaration</h2>
            <div className="space-y-3">
              {[
                { key: 'declaration1', text: 'I confirm that all information provided above is true and accurate to the best of my knowledge.' },
                { key: 'declaration2', text: 'I understand that providing false information may result in cancellation of my registration and certification.' },
                { key: 'declaration3', text: 'I agree to abide by the rules and regulations of SSFI and the certification program.' },
              ].map(d => (
                <label key={d.key} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={(form as any)[d.key]} onChange={e => set(d.key, e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-600">{d.text}</span>
                </label>
              ))}
              {(errors.declaration1 || errors.declaration2 || errors.declaration3) && (
                <p className={errCls}>All declarations must be accepted</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link href="/coach-certification" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Programs
            </Link>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Submit Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CoachCertRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <CoachCertRegisterForm />
    </Suspense>
  );
}
