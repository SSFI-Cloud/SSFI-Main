'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Shield, Plus, Search, Edit2, Trash2, Eye, Download,
    ChevronLeft, ChevronRight, ArrowUpDown, MapPin, Users,
    Loader2, CheckCircle, Clock, Phone, AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import ClubViewModal from '@/components/dashboard/ClubViewModal';

interface Club {
    id: number;
    membership_id: string;
    club_name: string;
    contact_person: string;
    mobile_number: string;
    email_address: string;
    district_name: string;
    state_name: string;
    state_code: string;
    established_year: string;
    skatersCount: number;
    verified: number;
    status: string;
    created_at: string;
}

interface StateOption { id: number; state_name: string; code: string; }

export default function ClubsPage() {
    const { token, user } = useAuth();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stateFilter, setStateFilter] = useState<number | 'all'>('all');
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
    const [sortField, setSortField] = useState<keyof Club>('club_name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ totalClubs: 0, verifiedClubs: 0, pendingClubs: 0, totalSkaters: 0 });

    // View modal state
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingClub, setViewingClub] = useState<any | null>(null);
    const [viewLoading, setViewLoading] = useState(false);

    const itemsPerPage = 10;

    const fetchClubs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: any = { page: currentPage, limit: itemsPerPage, sortField, sortOrder };
            if (searchQuery) params.search = searchQuery;
            if (stateFilter !== 'all') params.stateId = stateFilter;
            if (verificationFilter === 'verified') params.status = 'APPROVED';
            if (verificationFilter === 'pending') params.status = 'PENDING';

            const response = await api.get('/clubs', { params });

            if (response.data.status === 'success') {
                const { clubs: data, meta, stats: backendStats } = response.data.data;
                setClubs(data);
                setTotalPages(meta.totalPages);
                if (backendStats) {
                    setStats({
                        totalClubs: backendStats.total,
                        verifiedClubs: backendStats.verified,
                        pendingClubs: backendStats.pending,
                        totalSkaters: backendStats.totalSkaters,
                    });
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch clubs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewClub = async (clubId: number) => {
        setShowViewModal(true);
        setViewingClub(null);
        setViewLoading(true);
        try {
            const res = await api.get(`/clubs/${clubId}`);
            setViewingClub(res.data?.data?.club || null);
        } catch {
            setViewingClub(null);
        } finally {
            setViewLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        api.get('/states', {
            params: { limit: 100, sortField: 'name', sortOrder: 'asc' }
        }).then((res: any) => {
            const data = res.data?.data?.states || [];
            setStateOptions(data.map((s: any) => ({ id: s.id, state_name: s.state_name || s.name, code: s.code })));
        }).catch(() => {});
    }, [token]);

    useEffect(() => {
        if (token) fetchClubs();
    }, [token, currentPage, searchQuery, stateFilter, verificationFilter, sortField, sortOrder]);

    const handleSort = (field: keyof Club) => {
        if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortOrder('asc'); }
    };

    const getVerificationBadge = (verified: number) =>
        verified === 1 ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                <CheckCircle className="w-3 h-3" /> Verified
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-600 text-xs font-medium rounded-full">
                <Clock className="w-3 h-3" /> Pending
            </span>
        );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clubs Management</h1>
                    <p className="text-gray-500 mt-1">Manage all affiliated skating clubs</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    {user?.role === 'GLOBAL_ADMIN' && (
                        <Link href="/dashboard/clubs/new" className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Club
                        </Link>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Clubs',    value: stats.totalClubs,    Icon: Shield,       color: 'text-emerald-600',   bg: 'bg-emerald-100' },
                    { label: 'Verified',       value: stats.verifiedClubs, Icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-100' },
                    { label: 'Pending',        value: stats.pendingClubs,  Icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-100' },
                    { label: 'Total Skaters',  value: stats.totalSkaters,  Icon: Users,        color: 'text-teal-600', bg: 'bg-teal-100' },
                ].map(({ label, value, Icon, color, bg }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{value}</p>
                                <p className="text-sm text-gray-500">{label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Search clubs by name, ID, or contact..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <select value={stateFilter === 'all' ? 'all' : stateFilter}
                    onChange={e => { setStateFilter(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <option value="all">All States</option>
                    {stateOptions.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
                </select>
                <select value={verificationFilter} onChange={e => setVerificationFilter(e.target.value as any)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-left">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-emerald-500" />
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900" onClick={() => handleSort('membership_id')}>
                                    <div className="flex items-center gap-2">Club ID <ArrowUpDown className="w-4 h-4" /></div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900" onClick={() => handleSort('club_name')}>
                                    <div className="flex items-center gap-2">Club Details <ArrowUpDown className="w-4 h-4" /></div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Skaters</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Status</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center">
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                                </td></tr>
                            ) : clubs.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No clubs found</td></tr>
                            ) : clubs.map((club, index) => (
                                <motion.tr key={club.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="border-b border-gray-200/30 hover:bg-gray-50/60">
                                    <td className="px-4 py-3">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-emerald-500" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-sm text-emerald-600">{club.membership_id}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                                                <Shield className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{club.club_name}</p>
                                                <p className="text-sm text-gray-500">Est. {club.established_year}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-900">{club.contact_person}</p>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                            <Phone className="w-3 h-3" /> {club.mobile_number}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-600" />
                                            <div>
                                                <p className="text-sm text-gray-900">{club.district_name}</p>
                                                <p className="text-xs text-gray-500">{club.state_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-teal-100 text-teal-600 text-sm font-medium rounded-lg">
                                            {club.skatersCount}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">{getVerificationBadge(club.verified)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleViewClub(club.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <Link href={`/dashboard/clubs/${club.id}/edit`}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-50">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-50">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {showViewModal && (
                <ClubViewModal
                    club={viewingClub}
                    isLoading={viewLoading}
                    onClose={() => { setShowViewModal(false); setViewingClub(null); }}
                />
            )}
        </div>
    );
}
