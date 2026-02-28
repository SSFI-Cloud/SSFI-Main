'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Loader2, X, Save,
  Flag, Trophy, MapPin, Calendar, Globe,
  Star, Rocket, GraduationCap, Flame, Award,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';

// Must match backend VALID_MILESTONE_ICONS
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flag, Trophy, MapPin, Calendar, Globe,
  Star, Rocket, GraduationCap, Flame, Award,
};

interface Milestone {
  id: number;
  year: string;
  title: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

const emptyForm = (): Partial<Milestone> => ({
  year: '', title: '', description: '', icon: 'Trophy',
  displayOrder: 0, isActive: true,
});

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/milestones');
      setMilestones(res.data.data || []);
    } catch { toast.error('Failed to load milestones'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (m: Milestone) => { setEditing(m); setForm({ ...m }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.year?.trim() || !form.title?.trim() || !form.description?.trim()) {
      toast.error('Year, title and description are required'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/milestones/${editing.id}`, form);
        toast.success('Milestone updated');
      } else {
        await apiClient.post('/milestones', form);
        toast.success('Milestone added');
      }
      closeForm(); load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/milestones/${id}`);
      toast.success('Milestone deleted');
      setDeleteId(null); load();
    } catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (m: Milestone) => {
    try {
      await apiClient.put(`/milestones/${m.id}`, { isActive: !m.isActive });
      load();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Milestones</h2>
          <p className="text-gray-500 text-sm mt-1">Timeline shown on the About page</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Milestone
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500">No milestones yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {milestones.map((m) => {
            const IconComp = ICONS[m.icon] || Trophy;
            return (
              <div key={m.id}
                className={`flex items-center gap-4 p-4 bg-white border rounded-xl transition-colors ${m.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <IconComp className="w-5 h-5 text-gray-900" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{m.year}</span>
                    <p className="font-semibold text-gray-900 truncate">{m.title}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{m.description}</p>
                </div>
                {/* Order */}
                <span className="text-xs text-gray-600 w-8 text-center">#{m.displayOrder}</span>
                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(m)}
                    className={`p-2 rounded-lg transition-colors ${m.isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'}`}>
                    {m.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(m)}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(m.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4">
          <div className="w-full max-w-lg bg-[#f5f6f8] rounded-2xl border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{editing ? 'Edit Milestone' : 'Add Milestone'}</h3>
              <button onClick={closeForm} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Year Label *</label>
                  <input value={form.year || ''} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 2001, 2024–25" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Display Order</label>
                  <input type="number" min={0} value={form.displayOrder ?? 0}
                    onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Title *</label>
                <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Federation Founded" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Description *</label>
                <textarea rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Brief description of this milestone..." />
              </div>

              {/* Icon picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(ICONS).map(([key, IconComp]) => (
                    <button key={key} type="button"
                      onClick={() => setForm(f => ({ ...f, icon: key }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${form.icon === key ? 'border-blue-500 bg-blue-100 text-blue-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-200'}`}>
                      <IconComp className="w-5 h-5" />
                      <span className="text-xs leading-tight text-center">{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={!!form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-blue-500" />
                <span className="text-sm text-gray-700">Active (visible on website)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={closeForm} className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? 'Save Changes' : 'Add Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Milestone?</h3>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
