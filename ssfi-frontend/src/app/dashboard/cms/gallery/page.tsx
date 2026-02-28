'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Image as ImageIcon, Edit, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useGalleryAlbums } from '@/lib/hooks/useCMS';
import { GalleryAlbum, getStatusConfig } from '@/types/cms';
import apiClient from '@/lib/api/client';

export default function GalleryPage() {
  const { fetchAlbums, isLoading } = useGalleryAlbums();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const result = await fetchAlbums();
      setAlbums(Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : []);
    } catch { toast.error('Failed to load albums'); }
  };

  useEffect(() => { load(); }, []);

  const filtered = albums.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/cms/admin/gallery/albums/${deleteId}`);
      toast.success('Album deleted');
      setDeleteId(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Media Gallery</h2>
          <p className="text-gray-500 text-sm">Organise photos and videos into albums</p>
        </div>
        <Link href="/dashboard/cms/gallery/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Create Album
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Search albums..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 text-sm placeholder:text-gray-600" />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">{[1,2,3].map(n => <div key={n} className="bg-white rounded-2xl border border-gray-200 h-56 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium mb-1">No albums found</p>
          <p className="text-gray-500 text-sm mb-5">Create an album to start uploading photos.</p>
          {!searchQuery && <Link href="/dashboard/cms/gallery/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"><Plus className="w-4 h-4" /> Create Album</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(album => {
            const status = getStatusConfig(album.status);
            const cover = album.coverImage?.startsWith('http') ? album.coverImage : album.coverImage ? `${API_BASE}${album.coverImage}` : null;
            return (
              <div key={album.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-200 transition-colors">
                <div className="relative aspect-[4/3] bg-[#f5f6f8]">
                  {cover
                    ? <img src={cover} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div className="w-full h-full flex items-center justify-center"><FolderOpen className="w-10 h-10 text-gray-500" /></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span></div>
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/cms/gallery/${album.id}`} className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg "><Edit className="w-3.5 h-3.5" /></Link>
                    <button onClick={() => setDeleteId(album.id)} className="p-1.5 bg-red-500/60 hover:bg-red-500/80 text-white rounded-lg "><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="font-semibold text-gray-900 truncate">{album.title}</p>
                    <div className="flex items-center gap-2 text-gray-500 text-xs mt-0.5">
                      <ImageIcon className="w-3 h-3" />{album._count?.items || 0} items
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60  px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Album?</h3>
            <p className="text-gray-500 text-sm mb-6">All photos in this album will also be deleted. This cannot be undone.</p>
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
