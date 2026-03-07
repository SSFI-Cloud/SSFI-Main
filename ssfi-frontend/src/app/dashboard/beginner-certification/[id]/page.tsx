'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Medal, ArrowLeft, Users, Calendar, MapPin, IndianRupee, CheckCircle2,
  Star, Search, Loader2, Edit2, X, FileSpreadsheet, Award,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

interface Registration {
  id: number; registrationNumber: string; fullName: string; fatherName: string;
  gender: string; dateOfBirth: string; age: number | null; phone: string; email: string;
  state: string; district: string; city: string; guardianName: string;
  guardianRelation: string; guardianPhone: string;
  paymentStatus: string; amount: string; status: string;
  isCompleted: boolean; grade: string | null; rating: string | null;
  remarks: string | null; certificateNumber: string | null; createdAt: string;
}

interface Program {
  id: number; category: string; title: string; startDate: string; endDate: string;
  lastDateToApply: string; venue: string; city: string; state: string;
  price: string; totalSeats: number; filledSeats: number; status: string; ageGroup: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: 'bg-emerald-100 text-emerald-700', PAYMENT_PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700', ATTENDED: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-teal-100 text-teal-700', FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};
const PAY_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700', PAID: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700', REFUNDED: 'bg-gray-100 text-gray-600',
};
const GRADE_COLORS: Record<string, string> = {
  GOLD: 'text-amber-700', SILVER: 'text-gray-500', BRONZE: 'text-orange-700', PARTICIPATION: 'text-sky-700',
};

export default function ProgramDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [program, setProgram] = useState<Program | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [completeModal, setCompleteModal] = useState<Registration | null>(null);
  const [grade, setGrade] = useState('PARTICIPATION');
  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchProgram = useCallback(async () => {
    try { const res = await api.get('/beginner-cert/programs/' + id); setProgram(res.data?.data); }
    catch { toast.error('Failed to load program'); }
    finally { setLoading(false); }
  }, [id]);

  const fetchRegistrations = useCallback(async (page = 1) => {
    try {
      setRegLoading(true);
      const params: any = { page: String(page), limit: '50' };
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const res = await api.get('/beginner-cert/programs/' + id + '/registrations', { params });
      setRegistrations(res.data?.data?.registrations || []);
      setMeta(res.data?.data?.meta || { total: 0, page: 1, totalPages: 1 });
    } catch { console.error('Failed to fetch registrations'); }
    finally { setRegLoading(false); }
  }, [id, filterStatus, search]);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);
  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const handleExport = async () => {
    try {
      const res = await api.get('/beginner-cert/programs/' + id + '/registrations/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data as any]));
      const a = document.createElement('a'); a.href = url;
      a.download = 'beginner-cert-registrations-' + id + '.xlsx'; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch { toast.error('Export failed'); }
  };

  const handleMarkComplete = async () => {
    if (!completeModal) return;
    setSaving(true);
    try {
      await api.put('/beginner-cert/registrations/' + completeModal.id + '/mark-complete', {
        grade, rating: rating || undefined, remarks: remarks || undefined,
      });
      toast.success('Marked as completed');
      setCompleteModal(null); setRating(0); setRemarks(''); setGrade('PARTICIPATION');
      fetchRegistrations(); fetchProgram();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (regId: number, status: string) => {
    try { await api.put('/beginner-cert/registrations/' + regId + '/status', { status }); toast.success('Status updated'); fetchRegistrations(); }
    catch { toast.error('Failed to update status'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gray-600 animate-spin" /></div>;
  if (!program) return <div className="text-center py-20 text-gray-600">Program not found</div>;

  const stats = {
    total: meta.total,
    confirmed: registrations.filter(r => ['CONFIRMED', 'ATTENDED', 'COMPLETED'].includes(r.status)).length,
    completed: registrations.filter(r => r.isCompleted).length,
    paid: registrations.filter(r => r.paymentStatus === 'PAID').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/beginner-certification" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{program.title}</h1>
          <p className="text-gray-600 text-sm mt-0.5">{program.category.replace(/_/g, ' ')} &bull; {program.venue}, {program.city}{program.ageGroup ? ` &bull; Ages ${program.ageGroup}` : ''}</p>
        </div>
        <Link href={'/dashboard/beginner-certification/create?edit=' + program.id}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 text-sm transition-all">
          <Edit2 className="w-4 h-4" /> Edit
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Registered', value: stats.total, icon: Users, color: 'text-emerald-700' },
          { label: 'Paid', value: stats.paid, icon: IndianRupee, color: 'text-emerald-700' },
          { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: 'text-teal-700' },
          { label: 'Completed', value: stats.completed, icon: Award, color: 'text-amber-700' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Registrations */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 flex-1">Registrations</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm w-52 focus:outline-none" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none ">
              <option value="">All Status</option>
              <option value="REGISTERED">Registered</option><option value="CONFIRMED">Confirmed</option>
              <option value="ATTENDED">Attended</option><option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm transition-all">
              <FileSpreadsheet className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {regLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gray-600 animate-spin" /></div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No registrations found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-gray-600 font-medium">#</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">Reg No</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">Age</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">Guardian</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">Phone</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">State</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">Payment</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">Grade</th>
                  <th className="px-4 py-3 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.registrationNumber}</td>
                    <td className="px-4 py-3 text-gray-900">{r.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{r.age || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.guardianName}<br /><span className="text-gray-600">{r.guardianPhone}</span></td>
                    <td className="px-4 py-3 text-gray-500">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-500">{r.state}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${PAY_COLORS[r.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>{r.paymentStatus}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                    <td className="px-4 py-3">
                      {r.isCompleted && r.grade ? (
                        <span className={`text-xs font-bold ${GRADE_COLORS[r.grade] || 'text-gray-600'}`}>{r.grade}</span>
                      ) : <span className="text-gray-500">&mdash;</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!r.isCompleted && (
                          <>
                            <button onClick={() => { setCompleteModal(r); setRating(0); setRemarks(''); setGrade('PARTICIPATION'); }}
                              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-all" title="Mark Complete">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <select value={r.status} onChange={e => handleStatusChange(r.id, e.target.value)}
                              className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-900 text-xs focus:outline-none ">
                              <option value="REGISTERED">Registered</option><option value="CONFIRMED">Confirmed</option>
                              <option value="ATTENDED">Attended</option><option value="CANCELLED">Cancelled</option>
                            </select>
                          </>
                        )}
                        {r.isCompleted && <span className="text-xs text-teal-400">&#10003; Certified</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
            {Array.from({ length: meta.totalPages }, (_, i) => (
              <button key={i} onClick={() => fetchRegistrations(i + 1)}
                className={`px-3 py-1 rounded-lg text-sm ${meta.page === i + 1 ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mark Complete Modal */}
      <AnimatePresence>
        {completeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-[#0f1729] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Mark as Completed</h3>
                <button onClick={() => setCompleteModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-500">Student: <span className="text-gray-900 font-medium">{completeModal.fullName}</span></p>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Grade *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['GOLD', 'SILVER', 'BRONZE', 'PARTICIPATION'].map(g => (
                    <button key={g} type="button" onClick={() => setGrade(g)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${grade === g ? 'bg-emerald-600 text-white border border-emerald-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      {g === 'GOLD' ? '🥇' : g === 'SILVER' ? '🥈' : g === 'BRONZE' ? '🥉' : '📜'} {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Rating (1-5 stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setRating(n)}
                      className={`p-2 rounded-lg transition-all ${rating >= n ? 'text-amber-500 bg-amber-100' : 'text-gray-500 bg-white hover:bg-gray-50'}`}>
                      <Star className={`w-5 h-5 ${rating >= n ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Remarks</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none" placeholder="Any remarks..." />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setCompleteModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm">Cancel</button>
                <button onClick={handleMarkComplete} disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Complete &amp; Certify
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
