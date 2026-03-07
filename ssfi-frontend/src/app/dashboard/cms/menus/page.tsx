'use client';

import { useState, useEffect } from 'react';
import { Plus, Menu as MenuIcon, Layout, Link as LinkIcon, Edit, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useMenus } from '@/lib/hooks/useCMS';
import { Menu, MenuLocation, MENU_LOCATIONS } from '@/types/cms';
import apiClient from '@/lib/api/client';

export default function MenusPage() {
  const { fetchMenus, isLoading } = useMenus();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try { const data = await fetchMenus(); setMenus(data || []); }
    catch { toast.error('Failed to load menus'); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/cms/admin/menus/${deleteId}`);
      toast.success('Menu deleted');
      setDeleteId(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Navigation Menus</h2>
          <p className="text-gray-500 text-sm">Manage header, footer, and sidebar navigation</p>
        </div>
        <Link href="/dashboard/cms/menus/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Create Menu
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2].map(n => <div key={n} className="h-40 bg-white rounded-2xl border border-gray-200 animate-pulse" />)}</div>
      ) : menus.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <MenuIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium mb-1">No menus configured</p>
          <p className="text-gray-500 text-sm mb-5">Set up your website navigation menus.</p>
          <Link href="/dashboard/cms/menus/new" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"><Plus className="w-4 h-4" /> Create Menu</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map(menu => (
            <div key={menu.id} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><Layout className="w-5 h-5" /></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/dashboard/cms/menus/${menu.id}`} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><Edit className="w-4 h-4" /></Link>
                  <button onClick={() => setDeleteId(menu.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{menu.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{MENU_LOCATIONS.find(l => l.value === menu.location)?.label || menu.location}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <LinkIcon className="w-4 h-4" />{menu.items?.length || 0} items
                </div>
                {menu.isActive
                  ? <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" />Active</span>
                  : <span className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" />Inactive</span>
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Menu?</h3>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-colors">Cancel</button>
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
