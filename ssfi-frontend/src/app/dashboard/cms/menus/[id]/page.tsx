'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2, Plus, X, GripVertical, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { MENU_LOCATIONS, MenuLocation, MenuItem } from '@/types/cms';

export default function EditMenuPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', location: 'HEADER' as MenuLocation, isActive: true });
  const [items, setItems] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState({ label: '', url: '', target: '_self' as '_self' | '_blank' });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/cms/admin/menus/${id}`);
        const menu = res.data.data;
        if (!menu) throw new Error('Not found');
        setForm({ name: menu.name || '', location: menu.location || 'HEADER', isActive: menu.isActive ?? true });
        setItems(menu.items || []);
      } catch { toast.error('Failed to load menu'); router.push('/dashboard/cms/menus'); }
      finally { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Menu name is required'); return; }
    setSaving(true);
    try {
      await apiClient.put(`/cms/admin/menus/${id}`, { ...form, items });
      toast.success('Menu saved');
      router.push('/dashboard/cms/menus');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const addItem = () => {
    if (!newItem.label.trim() || !newItem.url.trim()) { toast.error('Label and URL required'); return; }
    setItems(prev => [...prev, { ...newItem, sortOrder: prev.length }]);
    setNewItem({ label: '', url: '', target: '_self' });
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/cms/admin/menus/${id}`);
      toast.success('Menu deleted');
      router.push('/dashboard/cms/menus');
    } catch { toast.error('Delete failed'); setDeleting(false); }
  };

  const inputClass = "w-full px-3 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500 text-sm";

  if (loading) return <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cms/menus" className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div><h2 className="text-2xl font-bold text-gray-900">Edit Menu</h2>
            <p className="text-gray-500 text-sm">{form.name}</p></div>
        </div>
        <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-100 border border-red-500/30 rounded-lg transition-colors text-sm">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Menu Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className={inputClass} placeholder="e.g. Main Navigation" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <select value={form.location} onChange={e => set('location', e.target.value)} className={inputClass}>
                {MENU_LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div onClick={() => set('isActive', !form.isActive)}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-700">{form.isActive ? 'Active' : 'Inactive'}</span>
          </label>
        </div>

        {/* Menu items */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Menu Items ({items.length})</h3>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[#f5f6f8] rounded-xl border border-gray-200">
                  <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{item.url}</span>
                      {item.target === '_blank' && <span className="ml-1 text-emerald-400">(new tab)</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-100 rounded-lg transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new item */}
          <div className="p-4 bg-[#f5f6f8]/60 rounded-xl border border-dashed border-gray-200 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Item</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={newItem.label} onChange={e => setNewItem(n => ({ ...n, label: e.target.value }))}
                className={inputClass} placeholder="Label (e.g. About Us)" />
              <input value={newItem.url} onChange={e => setNewItem(n => ({ ...n, url: e.target.value }))}
                className={inputClass} placeholder="URL (e.g. /about)" />
              <select value={newItem.target} onChange={e => setNewItem(n => ({ ...n, target: e.target.value as '_self' | '_blank' }))}
                className={inputClass}>
                <option value="_self">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
              <button type="button" onClick={addItem}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Menu
          </button>
        </div>
      </form>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Menu?</h3>
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
