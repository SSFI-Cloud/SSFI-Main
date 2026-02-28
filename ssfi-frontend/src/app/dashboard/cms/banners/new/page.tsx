'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { BANNER_POSITIONS, BannerPosition } from '@/types/cms';
import ImageUpload from '@/components/admin/ImageUpload';

export default function AddBannerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', imageUrl: '' as string | null,
    linkUrl: '', linkText: '',
    position: 'HOME_HERO' as BannerPosition,
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
    sortOrder: 0,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.imageUrl) { toast.error('Background image is required'); return; }
    setSaving(true);
    try {
      await apiClient.post('/cms/admin/banners', {
        ...form,
        imageUrl: form.imageUrl,
        subtitle: form.subtitle || undefined,
        linkUrl: form.linkUrl || undefined,
        linkText: form.linkText || undefined,
      });
      toast.success('Banner added');
      router.push('/dashboard/cms/banners');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add banner');
    } finally { setSaving(false); }
  };

  const inputClass = "w-full px-3 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 text-sm";
  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/cms/banners" className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add Banner / Slide</h2>
          <p className="text-gray-500 text-sm">Create a new homepage hero slide or banner</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className={labelClass}>Headline *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} placeholder="e.g. National Championship 2026" />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Subtitle</label>
            <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} className={inputClass} placeholder="e.g. Register before March 31" />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>CTA Button Text</label>
            <input value={form.linkText} onChange={e => set('linkText', e.target.value)} className={inputClass} placeholder="e.g. Register Now" />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>CTA Link</label>
            <input value={form.linkUrl} onChange={e => set('linkUrl', e.target.value)} className={inputClass} placeholder="e.g. /auth/register" />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Position</label>
            <select value={form.position} onChange={e => set('position', e.target.value)} className={inputClass}>
              {BANNER_POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Display Order</label>
            <input type="number" min={0} value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} className={inputClass} />
          </div>
        </div>

        <ImageUpload type="hero" label="Background Image * (1920×1080)" value={form.imageUrl} onChange={url => set('imageUrl', url)} />

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Add Banner
          </button>
        </div>
      </form>
    </div>
  );
}
