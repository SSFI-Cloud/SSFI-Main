'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Image as ImageIcon, Edit, Trash2, ExternalLink, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useBanners } from '@/lib/hooks/useCMS';
import { Banner, BannerPosition, BANNER_POSITIONS, getStatusConfig, formatDate } from '@/types/cms';
import apiClient from '@/lib/api/client';

export default function BannersPage() {
  const { fetchBanners, isLoading } = useBanners();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try { const data = await fetchBanners(); setBanners(data || []); }
    catch { toast.error('Failed to load banners'); }
  };

  useEffect(() => { load(); }, []);

  const filtered = banners.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPos = positionFilter === 'all' || b.position === positionFilter;
    return matchSearch && matchPos;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/cms/admin/banners/${deleteId}`);
      toast.success('Banner deleted');
      setDeleteId(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1').replace('/api/v1', '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banners & Sliders</h2>
          <p className="text-gray-500 text-sm">Manage homepage hero slides and promotional banners</p>
        </div>
        <Link href="/dashboard/cms/banners/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Banner
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search banners..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 text-sm placeholder:text-gray-600" />
        </div>
        <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 text-sm">
          <option value="all">All Positions</option>
          {BANNER_POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(n => <div key={n} className="bg-white rounded-2xl border border-gray-200 h-64 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium mb-1">No banners found</p>
          <p className="text-gray-500 text-sm mb-5">{searchQuery ? 'Try adjusting your search.' : 'Add your first banner or hero slide.'}</p>
          {!searchQuery && <Link href="/dashboard/cms/banners/new" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"><Plus className="w-4 h-4" /> Add Banner</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(banner => {
            const status = getStatusConfig(banner.status);
            const imgSrc = banner.imageUrl?.startsWith('http') ? banner.imageUrl : `${API_BASE}${banner.imageUrl}`;
            return (
              <div key={banner.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-200 transition-colors">
                <div className="relative aspect-video bg-[#f5f6f8]">
                  {banner.imageUrl && <img src={imgSrc} alt={banner.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span></div>
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/cms/banners/${banner.id}`} className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg"><Edit className="w-3.5 h-3.5" /></Link>
                    <button onClick={() => setDeleteId(banner.id)} className="p-1.5 bg-red-500/60 hover:bg-red-500/80 text-white rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-medium text-gray-900 truncate">{banner.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{BANNER_POSITIONS.find(p => p.value === banner.position)?.label || banner.position}</span>
                    <span className="text-xs text-gray-600">Order: {banner.sortOrder}</span>
                  </div>
                  {banner.linkUrl && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 truncate">
                      <ExternalLink className="w-3 h-3 shrink-0" />{banner.linkUrl}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Banner?</h3>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
