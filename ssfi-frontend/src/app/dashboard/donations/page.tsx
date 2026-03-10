'use client';

import { useState, useEffect } from 'react';
import { Heart, Search, IndianRupee, Users, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';

interface Donation {
  id: number;
  donorName: string;
  donorEmail: string;
  donorPhone: string | null;
  amount: number;
  currency: string;
  message: string | null;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  payment?: {
    razorpayPaymentId: string | null;
    razorpayOrderId: string | null;
    status: string;
  };
}

interface DonationStats {
  totalRaised: number;
  completedCount: number;
  totalCount: number;
  avgDonation: number;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
};

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDonations = async (p = 1, q = '') => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (q) params.set('search', q);
      const res = await apiClient.get(`/donations/admin/donations?${params}`);
      const data = res.data?.data;
      setDonations(data?.donations || []);
      setTotalPages(data?.meta?.totalPages || 1);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/donations/admin/donations/stats');
      setStats(res.data?.data || null);
    } catch {
      // Stats are non-critical
    }
  };

  useEffect(() => {
    fetchDonations(page, search);
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDonations(1, search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchDonations(newPage, search);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Donations</h2>
        <p className="text-gray-500 text-sm">Track and manage all donations received</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><IndianRupee className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-gray-500">Total Raised</p>
                <p className="text-xl font-bold text-gray-900">₹{stats.totalRaised.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600"><Heart className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-xl font-bold text-gray-900">{stats.completedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Users className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-gray-500">Total Donations</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><TrendingUp className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-gray-500">Average Donation</p>
                <p className="text-xl font-bold text-gray-900">₹{Math.round(stats.avgDonation).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by donor name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 text-sm placeholder:text-gray-600"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-900 font-medium mb-1">No donations yet</p>
            <p className="text-gray-500 text-sm">Donations from the website will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Donor</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{d.isAnonymous ? 'Anonymous' : d.donorName}</p>
                        <p className="text-xs text-gray-500">{d.donorEmail}</p>
                        {d.message && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{d.message}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₹{Number(d.amount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-700'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(d.createdAt)}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">{d.payment?.razorpayPaymentId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
