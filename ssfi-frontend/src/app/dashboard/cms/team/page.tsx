'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Home, ToggleLeft, ToggleRight, GripVertical, Loader2, X, Save, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import ImageUpload from '@/components/admin/ImageUpload';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio?: string;
  photo?: string;
  email?: string;
  linkedinUrl?: string;
  displayOrder: number;
  showOnHome: boolean;
  isActive: boolean;
}

const emptyForm = (): Partial<TeamMember> => ({
  name: '', role: '', bio: '', photo: null as any,
  email: '', linkedinUrl: '', displayOrder: 0,
  showOnHome: false, isActive: true,
});

export default function TeamManagerPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/team-members');
      setMembers(res.data.data || []);
    } catch { toast.error('Failed to load team members'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (m: TeamMember) => { setEditing(m); setForm({ ...m }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.role?.trim()) {
      toast.error('Name and role are required'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/team-members/${editing.id}`, form);
        toast.success('Member updated');
      } else {
        await apiClient.post('/team-members', form);
        toast.success('Member added');
      }
      closeForm();
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/team-members/${id}`);
      toast.success('Member deleted');
      setDeleteId(null);
      load();
    } catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (m: TeamMember) => {
    try {
      await apiClient.put(`/team-members/${m.id}`, { isActive: !m.isActive });
      load();
    } catch { toast.error('Update failed'); }
  };

  const toggleHome = async (m: TeamMember) => {
    try {
      await apiClient.put(`/team-members/${m.id}`, { showOnHome: !m.showOnHome });
      load();
    } catch { toast.error('Update failed'); }
  };

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="text-gray-500 text-sm mt-1">Manage federation officials shown on the website</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500">No team members yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {members.map((m) => (
            <div key={m.id} className={`flex items-center gap-4 p-4 bg-white border rounded-xl transition-colors ${m.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <GripVertical className="w-4 h-4 text-gray-500 shrink-0 cursor-grab" />

              {/* Photo */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                {m.photo ? (
                  <img src={m.photo.startsWith('http') ? m.photo : `${API_BASE}${m.photo}`} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                    {m.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  {m.showOnHome && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                      <Home className="w-3 h-3" /> Homepage
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{m.role}</p>
              </div>

              {/* Order */}
              <span className="text-xs text-gray-600 w-8 text-center">#{m.displayOrder}</span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button onClick={() => toggleHome(m)} title={m.showOnHome ? 'Remove from homepage' : 'Show on homepage'}
                  className={`p-2 rounded-lg transition-colors ${m.showOnHome ? 'text-green-600 hover:bg-green-100' : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'}`}>
                  <Home className="w-4 h-4" />
                </button>
                <button onClick={() => toggleActive(m)} title={m.isActive ? 'Deactivate' : 'Activate'}
                  className={`p-2 rounded-lg transition-colors ${m.isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'}`}>
                  {m.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(m)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(m.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4">
          <div className="w-full max-w-2xl bg-[#f5f6f8] rounded-2xl border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{editing ? 'Edit Member' : 'Add Team Member'}</h3>
              <button onClick={closeForm} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Name *</label>
                  <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Rajesh Kumar" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Role / Title *</label>
                  <input value={form.role || ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. President" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                    placeholder="member@ssfiskate.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">LinkedIn URL</label>
                  <input value={form.linkedinUrl || ''} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                    placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Display Order</label>
                  <input type="number" min={0} value={form.displayOrder ?? 0} onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-3 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={!!form.showOnHome} onChange={e => setForm(f => ({ ...f, showOnHome: e.target.checked }))} className="w-4 h-4 accent-green-500" />
                    <span className="text-sm text-gray-700">Show on Homepage</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={!!form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
                    <span className="text-sm text-gray-700">Active (visible on website)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea rows={3} value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Short bio or description..." />
              </div>

              <ImageUpload
                type="team"
                label="Photo"
                value={form.photo}
                onChange={url => setForm(f => ({ ...f, photo: url || undefined }))}
                hint="480 × 600 portrait — face stays in frame"
              />
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={closeForm} className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Member?</h3>
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
