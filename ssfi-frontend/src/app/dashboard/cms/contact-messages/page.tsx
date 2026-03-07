'use client';

import { useState, useEffect } from 'react';
import { Mail, MailOpen, Trash2, Loader2, X, Phone, User, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterUnread, setFilterUnread] = useState(false);

  const load = async (p = 1, unread = filterUnread) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/contact/messages', {
        params: { page: p, limit: 20, unread: unread || undefined }
      });
      const d = res.data.data;
      setMessages(d.messages || []);
      setTotalPages(d.totalPages || 1);
      setUnreadCount(d.unreadCount || 0);
      setPage(p);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.isRead) {
      try {
        await apiClient.patch(`/contact/messages/${msg.id}/read`);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch { /* silent */ }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/contact/messages/${id}`);
      toast.success('Message deleted');
      setDeleteId(null);
      if (selected?.id === id) setSelected(null);
      load(page);
    } catch { toast.error('Delete failed'); }
  };

  const toggleFilter = () => {
    const next = !filterUnread;
    setFilterUnread(next);
    load(1, next);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Contact Inbox
            {unreadCount > 0 && (
              <span className="text-sm font-semibold px-2 py-0.5 bg-red-500 text-white rounded-full">{unreadCount}</span>
            )}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Messages submitted via the website contact form</p>
        </div>
        <button onClick={toggleFilter}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${filterUnread ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-200'}`}>
          <Mail className="w-4 h-4" />
          {filterUnread ? 'Showing Unread' : 'All Messages'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500">{filterUnread ? 'No unread messages' : 'No messages yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {messages.map((msg, i) => (
            <div key={msg.id}
              onClick={() => openMessage(msg)}
              className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${!msg.isRead ? 'bg-blue-950/20' : ''}`}>
              <div className={`mt-1 p-2 rounded-lg shrink-0 ${msg.isRead ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
                {msg.isRead ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-medium truncate ${msg.isRead ? 'text-gray-700' : 'text-white'}`}>{msg.name}</p>
                  <span className="text-xs text-gray-600 shrink-0">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{msg.email}</p>
                <p className={`text-sm truncate mt-0.5 ${msg.isRead ? 'text-gray-600' : 'text-gray-700'}`}>
                  {msg.subject ? <><span className="font-medium">{msg.subject}:</span> </> : ''}{msg.message}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteId(msg.id); }}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4">
          <div className="w-full max-w-2xl bg-[#f5f6f8] rounded-2xl border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{selected.subject || 'Message'}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setDeleteId(selected.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelected(null)}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Sender info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl">
                  <User className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Name</p>
                    <p className="text-sm font-medium text-gray-900">{selected.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl">
                  <Mail className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <a href={`mailto:${selected.email}`} className="text-sm font-medium text-emerald-600 hover:underline">{selected.email}</a>
                  </div>
                </div>
                {selected.phone && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl">
                    <Phone className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{selected.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl">
                  <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Received</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(selected.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Message body */}
              <div className="bg-white rounded-2xl p-4 border-l-4 border-emerald-500">
                <p className="text-sm text-gray-500 mb-2 font-medium">Message</p>
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              {/* Reply button */}
              <div className="flex justify-end">
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || 'Your inquiry')}`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium">
                  <Mail className="w-4 h-4" /> Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#f5f6f8] rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Message?</h3>
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
