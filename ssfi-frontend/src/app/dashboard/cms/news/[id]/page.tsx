'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import ImageUpload from '@/components/admin/ImageUpload';

const CATEGORIES = ['Announcement', 'Championship', 'Training', 'Selection', 'Achievements', 'Events', 'General'];

export default function EditNewsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '',
    category: '', featuredImage: null as string | null, isPublished: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/cms/admin/news/${id}`);
        const a = res.data.data;
        setForm({
          title: a.title || '',
          slug: a.slug || '',
          excerpt: a.excerpt || '',
          content: a.content || '',
          category: a.category || '',
          featuredImage: a.featuredImage || null,
          isPublished: a.status === 'PUBLISHED',
        });
      } catch {
        toast.error('Failed to load article');
        router.push('/dashboard/cms/news');
      } finally { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    else if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Lowercase letters, numbers and hyphens only';
    if (!form.content.trim()) errs.content = 'Content is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await apiClient.put(`/cms/admin/news/${id}`, {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || undefined,
        content: form.content,
        category: form.category || undefined,
        featuredImage: form.featuredImage || undefined,
        status: form.isPublished ? 'PUBLISHED' : 'DRAFT',
      });
      toast.success('Article updated');
      router.push('/dashboard/cms/news');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/cms/admin/news/${id}`);
      toast.success('Article deleted');
      router.push('/dashboard/cms/news');
    } catch { toast.error('Delete failed'); setDeleting(false); }
  };

  const inputClass = "w-full px-3 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500 text-sm placeholder:text-gray-600";
  const labelClass = "text-sm font-medium text-gray-700";

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cms/news"
            className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Article</h2>
            <p className="text-gray-500 text-sm truncate max-w-sm">{form.title}</p>
          </div>
        </div>
        <button onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-100 border border-red-500/30 rounded-lg transition-colors text-sm">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} />
              {errors.title && <p className="text-red-700 text-xs">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Slug *</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">/news/</span>
                <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} />
              </div>
              {errors.slug && <p className="text-red-700 text-xs">{errors.slug}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Excerpt</label>
              <textarea rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                className={`${inputClass} resize-none`} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Content *</label>
              <textarea rows={16} value={form.content} onChange={e => set('content', e.target.value)}
                className={`${inputClass} resize-y font-mono`} />
              {errors.content && <p className="text-red-700 text-xs">{errors.content}</p>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Publish</h3>
            <button type="button" onClick={() => set('isPublished', !form.isPublished)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-colors ${form.isPublished ? 'border-green-500/50 bg-green-100 text-green-700' : 'border-gray-200 bg-[#f5f6f8] text-gray-500'}`}>
              {form.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm font-medium">{form.isPublished ? 'Published' : 'Draft'}</span>
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Category</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => set('category', form.category === cat ? '' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.category === cat ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Cover Image</h3>
            <ImageUpload type="news" value={form.featuredImage} onChange={url => set('featuredImage', url)} />
          </div>
        </div>
      </form>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Article?</h3>
            <p className="text-gray-500 text-sm mb-6">This permanently deletes <strong className="text-gray-900">"{form.title}"</strong> and cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
