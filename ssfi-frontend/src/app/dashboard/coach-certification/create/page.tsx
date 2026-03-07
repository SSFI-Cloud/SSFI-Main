'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Award, ArrowLeft, Save, Loader2, Calendar, MapPin, IndianRupee, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

const STATUSES = ['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

interface FormData {
  level: number; title: string; description: string;
  startDate: string; endDate: string; lastDateToApply: string;
  venue: string; venueAddress: string; city: string; state: string;
  price: number; includesText: string; totalSeats: number;
  eligibilityCriteria: string; minAge: number | ''; minExperience: number | '';
  prerequisiteLevel: number | ''; status: string;
  organizedBy: string; approvedBy: string;
}

const initial: FormData = {
  level: 1, title: '', description: '', startDate: '', endDate: '', lastDateToApply: '',
  venue: '', venueAddress: '', city: '', state: '', price: 4000, includesText: '',
  totalSeats: 50, eligibilityCriteria: '', minAge: '', minExperience: '',
  prerequisiteLevel: '', status: 'DRAFT', organizedBy: '', approvedBy: 'Speed Skating Federation of India',
};

export default function CreateProgramPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { token } = useAuth();
  const [form, setForm] = useState<FormData>(initial);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoadingEdit(true);
      api.get('/coach-cert/programs/' + editId).then(res => {
        const p = res.data?.data;
        if (p) {
          setForm({
            level: p.level, title: p.title, description: p.description || '',
            startDate: p.startDate?.slice(0, 10) || '', endDate: p.endDate?.slice(0, 10) || '',
            lastDateToApply: p.lastDateToApply?.slice(0, 10) || '',
            venue: p.venue, venueAddress: p.venueAddress || '', city: p.city, state: p.state,
            price: Number(p.price), includesText: p.includesText || '', totalSeats: p.totalSeats,
            eligibilityCriteria: p.eligibilityCriteria || '', minAge: p.minAge || '',
            minExperience: p.minExperience || '', prerequisiteLevel: p.prerequisiteLevel || '',
            status: p.status, organizedBy: p.organizedBy || '', approvedBy: p.approvedBy || '',
          });
        }
      }).catch(console.error).finally(() => setLoadingEdit(false));
    }
  }, [editId]);

  const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate || !form.venue || !form.city || !form.state) {
      toast.error('Please fill all required fields'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        totalSeats: Number(form.totalSeats),
        minAge: form.minAge ? Number(form.minAge) : undefined,
        minExperience: form.minExperience ? Number(form.minExperience) : undefined,
        prerequisiteLevel: form.prerequisiteLevel ? Number(form.prerequisiteLevel) : null,
      };
      if (editId) {
        await api.put('/coach-cert/programs/' + editId, payload);
        toast.success('Program updated');
      } else {
        await api.post('/coach-cert/programs', payload);
        toast.success('Program created');
      }
      router.push('/dashboard/coach-certification');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loadingEdit) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gray-600 animate-spin" /></div>;

  const inputCls = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50";
  const labelCls = "block text-sm font-medium text-gray-500 mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/coach-certification" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit' : 'Schedule'} Certification Program</h1>
          <p className="text-gray-600 text-sm mt-0.5">Fill in the details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Level & Title */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Award className="w-4 h-4 text-emerald-600" /> Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Level *</label>
              <select value={form.level} onChange={e => set('level', Number(e.target.value))} className={inputCls}>
                <option value={1}>Level 1 — Certified Coach</option>
                <option value={2}>Level 2 — Advanced Coach</option>
                <option value={3}>Level 3 — Master Coach</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Title *</label>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Level 1 Coach Certification — Batch 3" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={inputCls} placeholder="Program description..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Organized By</label>
              <input type="text" value={form.organizedBy} onChange={e => set('organizedBy', e.target.value)} className={inputCls} placeholder="e.g. Tamil Nadu Speed Skating Association" />
            </div>
            <div>
              <label className={labelCls}>Approved By</label>
              <input type="text" value={form.approvedBy} onChange={e => set('approvedBy', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-600" /> Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelCls}>Start Date *</label><input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>End Date *</label><input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Last Date to Apply *</label><input type="date" value={form.lastDateToApply} onChange={e => set('lastDateToApply', e.target.value)} className={inputCls} /></div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-600" /> Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Venue *</label><input type="text" value={form.venue} onChange={e => set('venue', e.target.value)} className={inputCls} placeholder="e.g. YMCA, Yeflagiri" /></div>
            <div><label className={labelCls}>Venue Address</label><input type="text" value={form.venueAddress} onChange={e => set('venueAddress', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>City *</label><input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>State *</label><input type="text" value={form.state} onChange={e => set('state', e.target.value)} className={inputCls} /></div>
          </div>
        </div>

        {/* Pricing & Seats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-yellow-600" /> Pricing &amp; Capacity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelCls}>Price (&#8377;) *</label><input type="number" value={form.price} onChange={e => set('price', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Total Seats *</label><input type="number" value={form.totalSeats} onChange={e => set('totalSeats', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Includes</label><input type="text" value={form.includesText} onChange={e => set('includesText', e.target.value)} className={inputCls} placeholder="e.g. 2 days stay, food, camp fees" /></div>
          </div>
        </div>

        {/* Eligibility */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-orange-600" /> Eligibility</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelCls}>Min Age</label><input type="number" value={form.minAge} onChange={e => set('minAge', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Min Experience (yrs)</label><input type="number" value={form.minExperience} onChange={e => set('minExperience', e.target.value)} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Prerequisite Level</label>
              <select value={form.prerequisiteLevel} onChange={e => set('prerequisiteLevel', e.target.value)} className={inputCls}>
                <option value="">None</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Eligibility Criteria (detailed)</label>
            <textarea value={form.eligibilityCriteria} onChange={e => set('eligibilityCriteria', e.target.value)} rows={4} className={inputCls} placeholder="Detailed eligibility requirements..." />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/coach-certification" className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-white text-sm transition-all">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editId ? 'Update Program' : 'Create Program'}
          </button>
        </div>
      </form>
    </div>
  );
}
