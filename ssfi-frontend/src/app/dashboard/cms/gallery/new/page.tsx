'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import ImageUpload from '@/components/admin/ImageUpload';

export default function CreateGalleryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', slug: '', description: '', coverImage: null as string | null,
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT', sortOrder: 0,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    set('title', value);
    set('slug', value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.slug.trim()) { toast.error('Slug is required'); return; }
    setSaving(true);
    try {
      await apiClient.post('/cms/admin/gallery/albums', {
        title: form.title,
        slug: form.slug,
        description: form.description || undefined,
        coverImage: form.coverImage || undefined,
        status: form.status,
        sortOrder: form.sortOrder,
      });
      toast.success('Album created');
      router.push('/dashboard/cms/gallery');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create album');
    } finally { setSaving(false); }
  };

  const inputClass = "w-full px-3 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500 text-sm";
  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/cms/gallery" className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Album</h2>
          <p className="text-gray-500 text-sm">Add a new photo gallery album</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className={labelClass}>Album Title *</label>
            <input value={form.title} onChange={handleTitleChange} className={inputClass} placeholder="e.g. National Championship 2026" />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Slug *</label>
            <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} placeholder="national-championship-2026" />
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
          <div className="space-y-1.5 md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              className={`${inputClass} resize-none`} placeholder="Brief description of this album..." />
          </div>
        </div>

        <ImageUpload type="news" label="Cover Image" value={form.coverImage} onChange={url => set('coverImage', url)} />

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Album
          </button>
        </div>
      </form>
    </div>
  );
}
