'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import ImageUpload from '@/components/admin/ImageUpload';
import { GalleryItem } from '@/types/cms';

export default function EditGalleryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingItem, setUploadingItem] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', coverImage: null as string | null, status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT', sortOrder: 0 });
  const [items, setItems] = useState<GalleryItem[]>([]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1').replace('/api/v1', '');

  const load = async () => {
    try {
      const res = await apiClient.get(`/cms/admin/gallery/albums/${id}`);
      const album = res.data.data;
      if (!album) throw new Error('Not found');
      setForm({ title: album.title || '', slug: album.slug || '', description: album.description || '', coverImage: album.coverImage || null, status: album.status || 'PUBLISHED', sortOrder: album.sortOrder || 0 });
      setItems(album.items || []);
    } catch { toast.error('Failed to load album'); router.push('/dashboard/cms/gallery'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) { toast.error('Title and slug are required'); return; }
    setSaving(true);
    try {
      await apiClient.put(`/cms/admin/gallery/albums/${id}`, form);
      toast.success('Album saved');
      router.push('/dashboard/cms/gallery');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleAddPhoto = async (file: File) => {
    setUploadingItem(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await apiClient.post('/upload/image?type=news', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = uploadRes.data.data.url;
      await apiClient.post('/cms/admin/gallery/items', { albumId: id, url, type: 'IMAGE', sortOrder: items.length });
      toast.success('Photo added');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setUploadingItem(false); }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await apiClient.delete(`/cms/admin/gallery/items/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Photo removed');
    } catch { toast.error('Remove failed'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/cms/admin/gallery/albums/${id}`);
      toast.success('Album deleted');
      router.push('/dashboard/cms/gallery');
    } catch { toast.error('Delete failed'); setDeleting(false); }
  };

  const inputClass = "w-full px-3 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500 text-sm";

  if (loading) return <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cms/gallery" className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div><h2 className="text-2xl font-bold text-gray-900">Edit Album</h2>
            <p className="text-gray-500 text-sm">{form.title}</p></div>
        </div>
        <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-100 border border-red-500/30 rounded-lg transition-colors text-sm">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Slug *</label>
                <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                  <option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option>
                </select></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Sort Order</label>
                <input type="number" min={0} value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} className={inputClass} /></div>
              <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium text-gray-700">Description</label>
                <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} className={`${inputClass} resize-none`} /></div>
            </div>
          </div>

          {/* Photo management */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Photos ({items.length})</h3>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingItem}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50">
                {uploadingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Photo
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAddPhoto(f); e.target.value = ''; }} />
            {items.length === 0 ? (
              <div onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-slate-500 transition-colors">
                <ImageIcon className="w-8 h-8 text-gray-600" />
                <p className="text-sm text-gray-500">Click to add photos</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {items.map(item => {
                  const src = item.url?.startsWith('http') ? item.url : `${API_BASE}${item.url}`;
                  return (
                    <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-[#f5f6f8] border border-gray-200">
                      <img src={src} alt={'Gallery image'} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleDeleteItem(item.id)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-slate-500 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Cover Image</h3>
            <ImageUpload type="news" value={form.coverImage} onChange={url => set('coverImage', url)} />
          </div>
        </div>
      </form>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Album?</h3>
            <p className="text-gray-500 text-sm mb-6">All photos will also be deleted. This cannot be undone.</p>
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
