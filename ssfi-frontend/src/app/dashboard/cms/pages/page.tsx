'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Edit, Trash2, Eye, Link as LinkIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { usePages } from '@/lib/hooks/useCMS';
import { Page, getStatusConfig, PAGE_TEMPLATES, formatDate } from '@/types/cms';
import apiClient from '@/lib/api/client';

export default function PagesPage() {
  const { fetchPages, isLoading } = usePages();
  const [pages, setPages] = useState<Page[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const result = await fetchPages();
      setPages(Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : []);
    } catch { toast.error('Failed to load pages'); }
  };

  useEffect(() => { load(); }, []);

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/cms/admin/pages/${deleteId}`);
      toast.success('Page deleted');
      setDeleteId(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Static Pages</h2>
          <p className="text-gray-500 text-sm">Manage static content like About Us, Privacy Policy, etc.</p>
        </div>
        <Link href="/dashboard/cms/pages/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Create Page
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Search pages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 text-sm placeholder:text-gray-600" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(n => <div key={n} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-900 font-medium mb-1">No pages found</p>
            <p className="text-gray-500 text-sm mb-5">Create your first static page.</p>
            {!searchQuery && <Link href="/dashboard/cms/pages/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"><Plus className="w-4 h-4" /> Create Page</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-gray-200 bg-gray-500">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((page) => {
                  const status = getStatusConfig(page.status);
                  const template = PAGE_TEMPLATES.find(t => t.value === page.template)?.label || page.template;
                  return (
                    <tr key={page.id} className="hover:bg-gray-100/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-100 text-purple-600 shrink-0 mt-0.5"><FileText className="w-4 h-4" /></div>
                          <div>
                            <p className="font-medium text-gray-900">{page.title}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5"><LinkIcon className="w-3 h-3" />/{page.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{template}</td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(page.updatedAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/page/${page.slug}`} target="_blank" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><Eye className="w-4 h-4" /></Link>
                          <Link href={`/dashboard/cms/pages/${page.id}`} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><Edit className="w-4 h-4" /></Link>
                          <button onClick={() => setDeleteId(page.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60  px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Page?</h3>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
