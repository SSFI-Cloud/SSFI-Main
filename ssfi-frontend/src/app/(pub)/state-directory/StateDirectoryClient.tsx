'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  MapPin, Users, Award, Building2, Loader2,
  ChevronDown, User, Search,
} from 'lucide-react';
import { api } from '@/lib/api/client';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1').replace('/api/v1', '');

interface StateOption {
  id: number;
  name: string;
  code: string;
}

interface StateDirectoryData {
  state: {
    id: number;
    name: string;
    code: string;
    logo: string | null;
    presidentName: string | null;
    presidentPhoto: string | null;
    secretaryName: string | null;
    secretaryPhoto: string | null;
    associationName: string | null;
    totalDistricts: number;
    totalClubs: number;
    totalStudents: number;
  };
  districts: {
    id: number;
    name: string;
    code: string;
    secretaryName: string | null;
    secretaryPhoto: string | null;
    clubsCount: number;
    studentsCount: number;
  }[];
}

function getImgSrc(img?: string | null): string | null {
  if (!img) return null;
  return img.startsWith('http') ? img : `${API_BASE}${img}`;
}

// ── Avatar component (circular photo with fallback) ──
function Avatar({ src, name, size = 'lg' }: { src?: string | null; name?: string | null; size?: 'sm' | 'lg' }) {
  const imgSrc = getImgSrc(src);
  const dim = size === 'lg' ? 'w-24 h-24' : 'w-12 h-12';
  const iconSize = size === 'lg' ? 'w-10 h-10' : 'w-5 h-5';

  if (imgSrc) {
    return (
      <div className={`${dim} rounded-full overflow-hidden ring-2 ring-white shadow-md bg-gray-100 relative flex-shrink-0`}>
        <Image
          src={imgSrc}
          alt={name || 'Photo'}
          fill
          className="object-cover"
          sizes={size === 'lg' ? '96px' : '48px'}
        />
      </div>
    );
  }

  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center ring-2 ring-white shadow-md flex-shrink-0`}>
      <User className={`${iconSize} text-emerald-500`} />
    </div>
  );
}

export default function StateDirectoryClient() {
  const [states, setStates] = useState<StateOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [data, setData] = useState<StateDirectoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(true);

  // Fetch states list on mount
  useEffect(() => {
    const loadStates = async () => {
      try {
        const res = await api.get('/locations/states');
        const list = res.data?.data || res.data || [];
        setStates(Array.isArray(list) ? list : []);
      } catch {
        // Silently fail — dropdown will be empty
      } finally {
        setStatesLoading(false);
      }
    };
    loadStates();
  }, []);

  // Fetch state directory on selection
  useEffect(() => {
    if (!selectedId) {
      setData(null);
      return;
    }

    const loadDirectory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/state-directory/${selectedId}`);
        setData(res.data?.data || null);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadDirectory();
  }, [selectedId]);

  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0f1d35] to-[#162d50] pt-32 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-5" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-5 border border-emerald-500/30">
              Organization
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              State Directory
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">
              Explore the organizational hierarchy of SSFI state associations across India.
            </p>

            {/* State Dropdown */}
            <div className="max-w-sm mx-auto relative">
              <div className="relative">
                <select
                  value={selectedId ?? ''}
                  onChange={(e) => setSelectedId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  disabled={statesLoading}
                  className="w-full appearance-none bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl px-5 py-3.5 pr-12 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50 cursor-pointer"
                >
                  <option value="" className="text-gray-900">
                    {statesLoading ? 'Loading states...' : 'Select a State'}
                  </option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id} className="text-gray-900">
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          </div>
        )}

        {/* No selection prompt */}
        {!selectedId && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-600">Select a state to view its directory</h2>
            <p className="text-gray-400 mt-2">Choose from the dropdown above to see the organizational structure.</p>
          </motion.div>
        )}

        {/* State Directory Data */}
        {data && !loading && (
          <motion.div
            key={data.state.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* State Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* State Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 md:px-8">
                <div className="flex items-center gap-4">
                  {data.state.logo ? (
                    <div className="w-14 h-14 rounded-full bg-white p-1.5 flex-shrink-0">
                      <Image
                        src={getImgSrc(data.state.logo) || ''}
                        alt={data.state.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg font-bold">{data.state.code}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">{data.state.name}</h2>
                    {data.state.associationName && (
                      <p className="text-emerald-300 text-sm font-medium">{data.state.associationName}</p>
                    )}
                    <p className="text-white/70 text-sm font-medium">{data.state.code}</p>
                  </div>
                </div>
              </div>

              {/* President & Secretary */}
              <div className="px-6 py-8 md:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                  {/* President */}
                  <div className="flex flex-col items-center text-center">
                    <Avatar src={data.state.presidentPhoto} name={data.state.presidentName} size="lg" />
                    <span className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-600">President</span>
                    <span className="mt-1 text-lg font-semibold text-gray-900">
                      {data.state.presidentName || 'Not Assigned'}
                    </span>
                  </div>

                  {/* Secretary */}
                  <div className="flex flex-col items-center text-center">
                    <Avatar src={data.state.secretaryPhoto} name={data.state.secretaryName} size="lg" />
                    <span className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-600">Secretary</span>
                    <span className="mt-1 text-lg font-semibold text-gray-900">
                      {data.state.secretaryName || 'Not Assigned'}
                    </span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <StatBadge icon={<MapPin className="w-4 h-4" />} value={data.state.totalDistricts} label="Districts" />
                  <StatBadge icon={<Award className="w-4 h-4" />} value={data.state.totalClubs} label="Clubs" />
                  <StatBadge icon={<Users className="w-4 h-4" />} value={data.state.totalStudents} label="Skaters" />
                </div>
              </div>
            </div>

            {/* Districts Section */}
            {data.districts.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    Districts
                  </h3>
                  <span className="text-sm text-gray-400">{data.districts.length} Districts</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.districts.map((district, idx) => (
                    <motion.div
                      key={district.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 hover:shadow-md transition-all duration-300"
                    >
                      {/* District Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar src={district.secretaryPhoto} name={district.secretaryName} size="sm" />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{district.name}</h4>
                          <p className="text-xs text-gray-400">{district.code}</p>
                        </div>
                      </div>

                      {/* Secretary Name */}
                      <div className="mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Secretary</span>
                        <p className="text-sm font-medium text-gray-700 mt-0.5">
                          {district.secretaryName || 'Not Assigned'}
                        </p>
                      </div>

                      {/* Counts */}
                      <div className="flex items-center gap-4 pt-3 border-t border-gray-50 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-500" />
                          {district.clubsCount} Clubs
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-500" />
                          {district.studentsCount} Skaters
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* No Districts */}
            {data.districts.length === 0 && (
              <div className="mt-10 text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700">No Districts Found</h3>
                <p className="text-gray-400 text-sm mt-1">No affiliated districts listed for {data.state.name} yet.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Stat Badge ──
function StatBadge({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
        {icon}
        <span className="text-lg font-bold text-gray-900">{value.toLocaleString()}</span>
      </div>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  );
}
