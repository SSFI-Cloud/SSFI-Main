'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { MENU_LOCATIONS, MenuLocation, MenuItem } from '@/types/cms';

const emptyItem = (): MenuItem => ({ label: '', url: '', target: '_self', sortOrder: 0 });

export default function NewMenuPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', location: 'HEADER' as MenuLocation, isActive: true });
  const [items, setItems] = useState<MenuItem[]>([emptyItem()]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const updateItem = (i: number, k: keyof MenuItem, v: any) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const addItem = () => setItems(prev => [...prev, { ...emptyItem(), sortOrder: prev.length }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Menu name is required'); return; }
    const validItems = items.filter(i => i.label.trim()).map((item, idx) => ({ ...item, sortOrder: idx }));
    setSaving(true);
    try {
      await apiClient.post('/cms/admin/menus', { ...form, items: validItems });
      toast.success('Menu created');
      router.push('/dashboard/cms/menus');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to create menu'); }
    finally { setSaving(false); }
  };

  const inputClass = "w-full px-3 py-2 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500 text-sm";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/cms/menus" className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Menu</h2>
          <p className="text-gray-500 text-sm">Configure a new navigation menu</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Menu Settings</h3>
          <div className="grid sm:grid-cols-2 gap-4">
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
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-gray-200 bg-[#f5f6f8] text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="active" className="text-sm text-gray-700 select-none">Active (visible on site)</label>
          </div>
        </div>

        {/* Menu items */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Menu Items</h3>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#f5f6f8] rounded-xl border border-gray-200">
                <GripVertical className="w-4 h-4 text-gray-500 mt-2.5 shrink-0" />
                <div className="flex-1 grid sm:grid-cols-2 gap-3">
                  <input value={item.label} onChange={e => updateItem(i, 'label', e.target.value)}
                    className={inputClass} placeholder="Label (e.g. Home)" />
                  <input value={item.url || ''} onChange={e => updateItem(i, 'url', e.target.value)}
                    className={inputClass} placeholder="URL (e.g. /about)" />
                  <select value={item.target} onChange={e => updateItem(i, 'target', e.target.value)} className={inputClass}>
                    <option value="_self">Same Tab</option>
                    <option value="_blank">New Tab</option>
                  </select>
                </div>
                <button type="button" onClick={() => removeItem(i)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-center text-gray-600 text-sm py-4">No items yet. Click "Add Item" to start.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Menu
          </button>
        </div>
      </form>
    </div>
  );
}
