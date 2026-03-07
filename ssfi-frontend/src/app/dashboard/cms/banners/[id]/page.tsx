'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', imageUrl: null as string | null,
    linkUrl: '', linkText: '', position: 'HOME_HERO' as BannerPosition,
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT', sortOrder: 0,
  });
  const [meta, setMeta] = useState({
    badge: '', highlight: '', description: '',
    secondaryCtaText: '', secondaryCtaLink: '', ghostWord: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setM = (k: string, v: string) => setMeta(m => ({ ...m, [k]: v }));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/cms/admin/banners/${id}`);
        const b = res.data.data;
        if (!b) throw new Error('Not found');
        setForm({
          title: b.title || '', subtitle: b.subtitle || '', imageUrl: b.imageUrl || null,
          linkUrl: b.linkUrl || '', linkText: b.linkText || '',
          position: b.position || 'HOME_HERO', status: b.status || 'PUBLISHED', sortOrder: b.sortOrder || 0,
        });
        if (b.metadata) {
          const m = b.metadata;
          setMeta({
            badge: m.badge || '', highlight: m.highlight || '', description: m.description || '',
            secondaryCtaText: m.secondaryCtaText || '', secondaryCtaLink: m.secondaryCtaLink || '', ghostWord: m.ghostWord || '',
          });
          // Auto-expand if any metadata is present
          if (m.badge || m.highlight || m.description || m.secondaryCtaText || m.secondaryCtaLink || m.ghostWord) {
            setShowAdvanced(true);
          }
        }
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
      const metadata: Record<string, string> = {};
      if (meta.badge.trim()) metadata.badge = meta.badge.trim();
      if (meta.highlight.trim()) metadata.highlight = meta.highlight.trim();
      if (meta.description.trim()) metadata.description = meta.description.trim();
      if (meta.secondaryCtaText.trim()) metadata.secondaryCtaText = meta.secondaryCtaText.trim();
      if (meta.secondaryCtaLink.trim()) metadata.secondaryCtaLink = meta.secondaryCtaLink.trim();
      if (meta.ghostWord.trim()) metadata.ghostWord = meta.ghostWord.trim();

      await apiClient.put(`/cms/admin/banners/${id}`, {
        ...form,
        subtitle: form.subtitle || undefined,
        linkUrl: form.linkUrl || undefined,
        linkText: form.linkText || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
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

  const inputClass = "w-full px-3 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500 text-sm";
  const labelClass = "text-sm font-medium text-gray-700";

  if (loading) return <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

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
        {/* Core fields */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-1.5"><label className={labelClass}>Headline *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} />
            <p className="text-xs text-gray-400">Main title line (displayed in bold)</p>
          </div>
          <div className="space-y-1.5"><label className={labelClass}>Subtitle</label>
            <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} className={inputClass} />
            <p className="text-xs text-gray-400">Used as tag badge if no badge is set below</p>
          </div>
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

        {/* Advanced / Hero Slide Fields */}
        <div className="border-t border-gray-100 pt-4">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Hero Slide Settings (Optional)
          </button>

          {showAdvanced && (
            <div className="grid md:grid-cols-2 gap-5 mt-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Tag Badge Text</label>
                <input value={meta.badge} onChange={e => setM('badge', e.target.value)} className={inputClass} placeholder="e.g. Just Concluded · Championship 2026" />
                <p className="text-xs text-gray-400">Orange badge with pulsing dot at top of slide</p>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Accent Line (Orange)</label>
                <input value={meta.highlight} onChange={e => setM('highlight', e.target.value)} className={inputClass} placeholder="e.g. Championship" />
                <p className="text-xs text-gray-400">Second line of title in orange color</p>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className={labelClass}>Description</label>
                <textarea value={meta.description} onChange={e => setM('description', e.target.value)} rows={2} className={inputClass} placeholder="Short description text below the title..." />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Secondary Button Text</label>
                <input value={meta.secondaryCtaText} onChange={e => setM('secondaryCtaText', e.target.value)} className={inputClass} placeholder="e.g. See Events" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Secondary Button Link</label>
                <input value={meta.secondaryCtaLink} onChange={e => setM('secondaryCtaLink', e.target.value)} className={inputClass} placeholder="e.g. /events" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Ghost Word</label>
                <input value={meta.ghostWord} onChange={e => setM('ghostWord', e.target.value)} className={inputClass} placeholder="e.g. GLORY" maxLength={12} />
                <p className="text-xs text-gray-400">Large faded watermark text behind the slide</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium">
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
