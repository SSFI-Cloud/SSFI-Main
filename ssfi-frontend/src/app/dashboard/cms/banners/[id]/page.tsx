'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { BANNER_POSITIONS, BannerPosition } from '@/types/cms';
import ImageUpload from '@/components/admin/ImageUpload';

export default function EditBannerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', imageUrl: null as string | null,
    linkUrl: '', linkText: '', position: 'HOME_HERO' as BannerPosition,
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT', sortOrder: 0,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/cms/admin/banners/${id}`);
        const b = res.data.data;
        if (!b) throw new Error('Not found');
        setForm({ title: b.title || '', subtitle: b.subtitle || '', imageUrl: b.imageUrl || null, linkUrl: b.linkUrl || '', linkText: b.linkText || '', position: b.position || 'HOME_HERO', status: b.status || 'PUBLISHED', sortOrder: b.sortOrder || 0 });
      } catch { toast.error('Failed to load banner'); router.push('/dashboard/cms/banners'); }
      finally { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.imageUrl) { toast.error('Image is required'); return; }
    setSaving(true);
    try {
      await apiClient.put(`/cms/admin/banners/${id}`, { ...form, subtitle: form.subtitle || undefined, linkUrl: form.linkUrl || undefined, linkText: form.linkText || undefined });
      toast.success('Banner saved');
      router.push('/dashboard/cms/banners');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/cms/admin/banners/${id}`);
      toast.success('Banner deleted');
      router.push('/dashboard/cms/banners');
    } catch { toast.error('Delete failed'); setDeleting(false); }
  };

  const inputClass = "w-full px-3 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 text-sm";
  const labelClass = "text-sm font-medium text-gray-700";

  if (loading) return <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cms/banners" className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Banner</h2>
            <p className="text-gray-500 text-sm truncate max-w-sm">{form.title}</p>
          </div>
        </div>
        <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-100 border border-red-500/30 rounded-lg transition-colors text-sm">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-1.5"><label className={labelClass}>Headline *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} /></div>
          <div className="space-y-1.5"><label className={labelClass}>Subtitle</label>
            <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} className={inputClass} /></div>
          <div className="space-y-1.5"><label className={labelClass}>CTA Button Text</label>
            <input value={form.linkText} onChange={e => set('linkText', e.target.value)} className={inputClass} placeholder="e.g. Register Now" /></div>
          <div className="space-y-1.5"><label className={labelClass}>CTA Link</label>
            <input value={form.linkUrl} onChange={e => set('linkUrl', e.target.value)} className={inputClass} placeholder="/auth/register" /></div>
          <div className="space-y-1.5"><label className={labelClass}>Position</label>
            <select value={form.position} onChange={e => set('position', e.target.value)} className={inputClass}>
              {BANNER_POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select></div>
          <div className="space-y-1.5"><label className={labelClass}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
              <option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option>
            </select></div>
          <div className="space-y-1.5"><label className={labelClass}>Display Order</label>
            <input type="number" min={0} value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} className={inputClass} /></div>
        </div>
        <ImageUpload type="hero" label="Background Image *" value={form.imageUrl} onChange={url => set('imageUrl', url)} />
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
        </div>
      </form>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Banner?</h3>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-xl">Cancel</button>
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
