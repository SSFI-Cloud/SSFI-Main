'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Medal, Plus, Search, Edit2, Trash2, Eye, Loader2, Users, Calendar,
  MapPin, IndianRupee
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { api } from '@/lib/api/client';

interface Program {
  id: number;
  category: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  lastDateToApply: string;
  venue: string;
  city: string;
  state: string;
  price: string;
  totalSeats: number;
  filledSeats: number;
  ageGroup: string | null;
  status: string;
  isActive: boolean;
  _count?: { registrations: number };
}

const STATUS_CFG: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600' },
  PUBLISHED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  REGISTRATION_OPEN: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  REGISTRATION_CLOSED: { bg: 'bg-amber-100', text: 'text-amber-700' },
  ONGOING: { bg: 'bg-purple-100', text: 'text-purple-700' },
  COMPLETED: { bg: 'bg-teal-100', text: 'text-teal-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
};

const CAT_CFG: Record<string, { label: string; gradient: string; border: string }> = {
  SPEED_SKATING: { label: 'Speed Skating', gradient: 'from-sky-500 to-cyan-500', border: 'border-sky-200' },
  ARTISTIC: { label: 'Artistic Skating', gradient: 'from-pink-500 to-rose-500', border: 'border-pink-200' },
  INLINE_HOCKEY: { label: 'Inline Hockey', gradient: 'from-amber-500 to-orange-500', border: 'border-amber-200' },
  GENERAL: { label: 'General', gradient: 'from-violet-500 to-purple-500', border: 'border-violet-200' },
};

export default function BeginnerCertificationPage() {
  const { token } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchPrograms(); }, [filterCategory, filterStatus]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const params: any = { page: '1', limit: '50' };
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/beginner-cert/programs', { params });
      setPrograms(res.data?.data?.programs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Cancel this program? It will be deactivated.')) return;
    try { await api.delete('/beginner-cert/programs/' + id); fetchPrograms(); }
    catch (e) { console.error(e); }
  };

  const filtered = programs.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
              <Medal className="w-6 h-6 text-white" />
            </div>
            Beginner Certification
          </h1>
          <p className="text-gray-600 mt-1">Schedule &amp; manage beginner certification programs</p>
        </div>
        <Link href="/dashboard/beginner-certification/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
          <Plus className="w-4 h-4" /> Schedule Program
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input type="text" placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="">All Categories</option>
          <option value="SPEED_SKATING">Speed Skating</option>
          <option value="ARTISTIC">Artistic</option>
          <option value="INLINE_HOCKEY">Inline Hockey</option>
          <option value="GENERAL">General</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="REGISTRATION_OPEN">Reg Open</option>
          <option value="REGISTRATION_CLOSED">Reg Closed</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gray-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Medal className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-600">No programs found</p>
          <Link href="/dashboard/beginner-certification/create" className="text-emerald-600 text-sm mt-2 inline-block hover:underline">
            Schedule your first program &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p, i) => {
            const cat = CAT_CFG[p.category] || CAT_CFG.GENERAL;
            const st = STATUS_CFG[p.status] || STATUS_CFG.DRAFT;
            const seatsPercent = p.totalSeats > 0 ? (p.filledSeats / p.totalSeats) * 100 : 0;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border ${cat.border} bg-white overflow-hidden hover:shadow-md transition-all`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${cat.gradient} text-white mb-2`}>
                        {cat.label}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                      {p.ageGroup && <p className="text-gray-600 text-xs mt-0.5">Age Group: {p.ageGroup}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>{p.status.replace(/_/g, ' ')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-500"><Calendar className="w-3.5 h-3.5" />{new Date(p.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div className="flex items-center gap-2 text-gray-500"><MapPin className="w-3.5 h-3.5" />{p.city}, {p.state}</div>
                    <div className="flex items-center gap-2 text-gray-500"><IndianRupee className="w-3.5 h-3.5" />&#8377;{Number(p.price).toLocaleString()}</div>
                    <div className="flex items-center gap-2 text-gray-500"><Users className="w-3.5 h-3.5" />{p.filledSeats}/{p.totalSeats} seats</div>
                  </div>

                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div className={`h-full rounded-full bg-gradient-to-r ${cat.gradient}`} style={{ width: `${Math.min(seatsPercent, 100)}%` }} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={'/dashboard/beginner-certification/' + p.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 text-sm border border-gray-100 transition-all">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                    <Link href={'/dashboard/beginner-certification/create?edit=' + p.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 text-sm border border-gray-100 transition-all">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button onClick={() => handleDelete(p.id)}
                      className="px-3 py-2 rounded-lg bg-red-100 hover:bg-red-100 text-red-600 text-sm transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
