'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    MapPin,
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Download,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Building2,
    Users,
    Loader2,
    AlertCircle,
    Globe,
    X
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import StateViewModal from '@/components/dashboard/StateViewModal';

// Types
interface State {
    id: number;
    state_name: string;
    code: string;
    logo?: string;
    website?: string;
    presidentName?: string;
    presidentPhoto?: string;
    districtsCount: number;
    clubsCount: number;
    skatersCount: number;
    eventsCount: number;
    created_at: string;
    secretaryName?: string;
    registrationDate?: string;
}

interface ApiResponse {
    status: string;
    data: {
        states: State[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export default function StatesPage() {
    const { user, token } = useAuth();
    const [states, setStates] = useState<State[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<keyof State>('state_name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({
        totalStates: 0,
        totalDistricts: 0,
        totalClubs: 0,
        totalSkaters: 0
    });

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingState, setEditingState] = useState<State | null>(null);
    const [selectedStates, setSelectedStates] = useState<number[]>([]);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);

    const [registeredOnly, setRegisteredOnly] = useState(true);

    // View modal state
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingState, setViewingState] = useState<any>(null);
    const [viewLoading, setViewLoading] = useState(false);

    const handleViewState = async (stateId: number) => {
        // Open modal with loading spinner first, data arrives after
        setShowViewModal(true);
        setViewingState(null);
        setViewLoading(true);
        try {
            const response = await api.get(`/states/${stateId}`);
            setViewingState(response.data?.data?.state ?? null);
        } catch (err) {
            console.error('Failed to load state profile:', err);
            setViewingState(null);
        } finally {
            setViewLoading(false);
        }
    };

    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setViewingState(null);
    };

    const fetchStates = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: any = {
                page: currentPage,
                limit: itemsPerPage,
                sortField,
                sortOrder,
                registeredOnly
            };
            if (searchQuery) params.search = searchQuery;

            const response = await api.get<ApiResponse>('/states', { params });

            if (response.data && response.data.data) {
                const { states: data, meta } = response.data.data;
                setStates(data);
                setTotalPages(meta.totalPages);

                const currentStats = {
                    totalStates: meta.total,
                    totalDistricts: data.reduce((acc: number, d: any) => acc + d.districtsCount, 0),
                    totalClubs: data.reduce((acc: number, d: any) => acc + d.clubsCount, 0),
                    totalSkaters: data.reduce((acc: number, d: any) => acc + d.skatersCount, 0),
                };
                setStats(currentStats);
            }
        } catch (err: any) {
            console.error('Error fetching states:', err);
            setError(err.response?.data?.message || 'Failed to fetch states');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (token) {
                fetchStates();
            } else {
                setIsLoading(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [token, currentPage, searchQuery, sortField, sortOrder, registeredOnly]);


    const handleSort = (field: keyof State) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const toggleSelectAll = () => {
        if (selectedStates.length === states.length) {
            setSelectedStates([]);
        } else {
            setSelectedStates(states.map(s => s.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedStates(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this state? This will remove all associated districts, clubs, secretaries, and their data.')) return;
        try {
            await api.delete(`/states/${id}`);
            fetchStates();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to delete state');
        }
    };

    const handleExport = () => {
        const rows = selectedStates.length > 0 ? states.filter(s => selectedStates.includes(s.id)) : states;
        if (rows.length === 0) return;
        const headers = ['State Name','Code','Secretary','Districts','Clubs','Skaters','Registration Date','Created At'];
        const csvRows = [headers.join(',')];
        for (const s of rows) {
            csvRows.push([
                s.state_name, s.code, s.secretaryName || '', String(s.districtsCount),
                String(s.clubsCount), String(s.skatersCount),
                s.registrationDate ? new Date(s.registrationDate).toLocaleDateString() : '',
                s.created_at
            ].map(v => `"${v}"`).join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `states_${new Date().toISOString().slice(0,10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">States Management</h1>
                    <p className="text-gray-500 mt-1">Manage states and their associations</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExport} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export{selectedStates.length > 0 ? ` (${selectedStates.length})` : ''}
                    </button>
                    <Link
                        href="/dashboard/states/new"
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add State
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalStates}</p>
                            <p className="text-sm text-gray-500">Total States</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalDistricts}</p>
                            <p className="text-sm text-gray-500">Total Districts</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalClubs}</p>
                            <p className="text-sm text-gray-500">Total Clubs</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search states..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="registeredOnly"
                        checked={registeredOnly}
                        onChange={(e) => setRegisteredOnly(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-200 bg-gray-100 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <label htmlFor="registeredOnly" className="text-gray-700 cursor-pointer select-none">Show Registered Only</label>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedStates.length === states.length && states.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-emerald-500 focus:ring-emerald-500/50"
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                                    onClick={() => handleSort('state_name')}
                                >
                                    <div className="flex items-center gap-2">
                                        State Name
                                        <ArrowUpDown className="w-4 h-4" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                                    onClick={() => handleSort('code')}
                                >
                                    <div className="flex items-center gap-2">
                                        Code
                                        <ArrowUpDown className="w-4 h-4" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                    Secretary Name
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                    Reg. Date
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                                    onClick={() => handleSort('districtsCount')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Districts
                                        <ArrowUpDown className="w-4 h-4" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                                    onClick={() => handleSort('clubsCount')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Clubs
                                        <ArrowUpDown className="w-4 h-4" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                                    onClick={() => handleSort('skatersCount')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Skaters
                                        <ArrowUpDown className="w-4 h-4" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : states.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                                        No states found
                                    </td>
                                </tr>
                            ) : (
                                states.map((state: any, index) => (
                                    <motion.tr
                                        key={state.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-b border-gray-200/30 hover:bg-gray-50/60"
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedStates.includes(state.id)}
                                                onChange={() => toggleSelect(state.id)}
                                                className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-emerald-500 focus:ring-emerald-500/50"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                    <Globe className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">{state.state_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                                                {state.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-700 text-sm">
                                                {state.secretaryName !== 'N/A' ? state.secretaryName : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-700 text-sm">
                                                {state.registrationDate ? new Date(state.registrationDate).toLocaleDateString() : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-gray-700">{state.districtsCount}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-gray-700">{state.clubsCount}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-gray-700">{state.skatersCount}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewState(state.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingState(state)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {user?.role === 'GLOBAL_ADMIN' && (
                                                <button
                                                    onClick={() => handleDelete(state.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View State Modal */}
            {showViewModal && (
                <StateViewModal
                    state={viewingState}
                    isLoading={viewLoading}
                    onClose={handleCloseViewModal}
                />
            )}

            {/* Add/Edit State Modal */}
            {(showAddModal || editingState) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 max-h-[90vh] flex flex-col"
                    >
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingState ? 'Edit State' : 'Add New State'}
                            </h2>
                            <button
                                onClick={() => { setShowAddModal(false); setEditingState(null); }}
                                className="text-gray-500 hover:text-gray-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data: any = {
                                    name: formData.get('name'),
                                    code: formData.get('code'),
                                    website: formData.get('website'),
                                    logo: formData.get('logo') || undefined,
                                    presidentName: formData.get('presidentName') || undefined,
                                    presidentPhoto: formData.get('presidentPhoto') || undefined,
                                };
                                if (!editingState) {
                                    data.secretaryName = formData.get('secretaryName');
                                    data.secretaryEmail = formData.get('secretaryEmail');
                                    data.secretaryPhone = formData.get('secretaryPhone');
                                    data.secretaryGender = formData.get('secretaryGender');
                                    data.secretaryAadhaar = formData.get('secretaryAadhaar');
                                    data.secretaryAddress = formData.get('secretaryAddress');
                                    data.secretaryCity = formData.get('secretaryCity');
                                    data.secretaryPincode = formData.get('secretaryPincode');
                                }
                                try {
                                    if (editingState) {
                                        await api.put(`/states/${editingState.id}`, data);
                                    } else {
                                        await api.post('/states', data);
                                    }
                                    setShowAddModal(false);
                                    setEditingState(null);
                                    fetchStates();
                                } catch (err: any) {
                                    alert(err.response?.data?.message || 'Operation failed');
                                }
                            }}
                            className="p-6 space-y-4 overflow-y-auto flex-1"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">State Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    defaultValue={editingState?.state_name || ''}
                                    placeholder="e.g., Tamil Nadu"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">State Code</label>
                                <input
                                    type="text"
                                    name="code"
                                    required
                                    defaultValue={editingState?.code || ''}
                                    placeholder="e.g., TN"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Website (Optional)</label>
                                <input
                                    type="url"
                                    name="website"
                                    defaultValue={editingState?.website || ''}
                                    placeholder="https://example.com"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Logo URL (Optional)</label>
                                <input
                                    type="url"
                                    name="logo"
                                    defaultValue={editingState?.logo || ''}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">President Details</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">President Name</label>
                                    <input
                                        type="text"
                                        name="presidentName"
                                        defaultValue={editingState?.presidentName || ''}
                                        placeholder="Enter president name"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">President Photo URL</label>
                                    <input
                                        type="url"
                                        name="presidentPhoto"
                                        defaultValue={editingState?.presidentPhoto || ''}
                                        placeholder="https://example.com/photo.jpg"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                            </div>

                            {!editingState && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900">State Secretary Details</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-2">Secretary Name*</label>
                                            <input
                                                type="text"
                                                name="secretaryName"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-2">Gender*</label>
                                            <select
                                                name="secretaryGender"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            >
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-2">Email*</label>
                                            <input
                                                type="email"
                                                name="secretaryEmail"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-2">Phone*</label>
                                            <input
                                                type="tel"
                                                name="secretaryPhone"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Aadhaar Number*</label>
                                        <input
                                            type="text"
                                            name="secretaryAadhaar"
                                            required
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Address*</label>
                                        <textarea
                                            name="secretaryAddress"
                                            required
                                            rows={2}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-2">City*</label>
                                            <input
                                                type="text"
                                                name="secretaryCity"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-2">Pincode*</label>
                                            <input
                                                type="text"
                                                name="secretaryPincode"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setEditingState(null); }}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
                                >
                                    {editingState ? 'Save Changes' : 'Add State'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}