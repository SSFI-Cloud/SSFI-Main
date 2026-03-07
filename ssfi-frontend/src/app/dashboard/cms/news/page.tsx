'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Calendar, Edit, Trash2, Eye, Link as LinkIcon, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useNews } from '@/lib/hooks/useCMS';
import { NewsArticle, NewsQueryParams, getStatusConfig, formatDate } from '@/types/cms';
import apiClient from '@/lib/api/client';

export default function NewsPage() {
  const [params, setParams] = useState<NewsQueryParams>({ page: 1, limit: 10, sortOrder: 'desc', sortBy: 'publishedAt' });
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== params.search) {
        setParams(prev => ({ ...prev, search: searchQuery || undefined, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, params.search]);

  const { fetchNews, data, isLoading } = useNews();
  useEffect(() => { fetchNews(params); }, [params]);

  const articles = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/cms/admin/news/${deleteId}`);
      toast.success('Article deleted');
      setDeleteId(null);
      fetchNews(params);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">News & Updates</h2>
          <p className="text-gray-500 text-sm">Manage news articles, announcements, and press releases</p>
        </div>
        <Link href="/dashboard/cms/news/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Create Article
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search articles..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 text-sm placeholder:text-gray-600" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map(n => <div key={n} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-900 font-medium mb-1">No articles found</p>
            <p className="text-gray-500 text-sm mb-5">Create your first news article to get started.</p>
            {!searchQuery && (
              <Link href="/dashboard/cms/news/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm">
                <Plus className="w-4 h-4" /> Create Article
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-500">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Article</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articles.map((article: NewsArticle) => {
                  const status = getStatusConfig(article.status || 'DRAFT');
                  return (
                    <tr key={article.id} className="hover:bg-gray-100/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 mt-0.5 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-xs">{article.title}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                              <LinkIcon className="w-3 h-3" />/news/{article.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{article.category || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {article.publishedAt ? formatDate(article.publishedAt) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/news/${article.slug}`} target="_blank"
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Preview">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/dashboard/cms/news/${article.id}`}
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => setDeleteId(String(article.id))}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setParams(prev => ({ ...prev, page: p }))}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === params.page ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60  px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Article?</h3>
            <p className="text-gray-500 text-sm mb-6">This permanently deletes the article and cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-colors">Cancel</button>
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
