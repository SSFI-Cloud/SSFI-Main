'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import ImageUpload from '@/components/admin/ImageUpload';

const CATEGORIES = ['Announcement', 'Championship', 'Training', 'Selection', 'Achievements', 'Events', 'General'];

export default function CreateNewsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    featuredImage: null as string | null,
    isPublished: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    set('title', value);
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    set('slug', slug);
  };

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
      await apiClient.post('/cms/admin/news', {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || undefined,
        content: form.content,
        category: form.category || undefined,
        featuredImage: form.featuredImage || undefined,
        status: form.isPublished ? 'PUBLISHED' : 'DRAFT',
      });
      toast.success('Article published successfully');
      router.push('/dashboard/cms/news');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create article');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 text-sm placeholder:text-gray-600";
  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/cms/news"
          className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New Article</h2>
          <p className="text-gray-500 text-sm">Create a news article or announcement</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — left 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Title *</label>
              <input value={form.title} onChange={handleTitleChange} className={inputClass} placeholder="e.g. National Championship Results Announced" />
              {errors.title && <p className="text-red-600 text-xs">{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Slug (URL) *</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">/news/</span>
                <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} placeholder="national-championship-results" />
              </div>
              {errors.slug && <p className="text-red-600 text-xs">{errors.slug}</p>}
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Excerpt <span className="text-gray-600 font-normal">(shown in listings)</span></label>
              <textarea rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                className={`${inputClass} resize-none`} placeholder="Brief summary of the article..." />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Content *</label>
              <textarea rows={16} value={form.content} onChange={e => set('content', e.target.value)}
                className={`${inputClass} resize-y font-mono text-sm`} placeholder="Full article content..." />
              {errors.content && <p className="text-red-600 text-xs">{errors.content}</p>}
            </div>
          </div>
        </div>

        {/* Sidebar — right 1/3 */}
        <div className="space-y-5">
          {/* Publish card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Publish</h3>
            <button type="button" onClick={() => set('isPublished', !form.isPublished)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-colors ${form.isPublished ? 'border-green-500/50 bg-green-100 text-green-600' : 'border-gray-200 bg-[#f5f6f8] text-gray-500'}`}>
              {form.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm font-medium">{form.isPublished ? 'Published' : 'Draft'}</span>
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {form.isPublished ? 'Publish Article' : 'Save Draft'}
            </button>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Category</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => set('category', form.category === cat ? '' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cover image */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Cover Image</h3>
            <ImageUpload type="news" value={form.featuredImage} onChange={url => set('featuredImage', url)} />
          </div>
        </div>
      </form>
    </div>
  );
}
