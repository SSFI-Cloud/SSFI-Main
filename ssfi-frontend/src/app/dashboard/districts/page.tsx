'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Building2,
    Plus,
    Search,
    // Filter, // Unused
    Edit2,
    Trash2,
    Eye,
    Download,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    MapPin,
    Users,
    Loader2,
    Shield,
    AlertCircle,
    X,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/lib/hooks/useAuth';
import DistrictViewModal from '@/components/dashboard/DistrictViewModal';

// Types
interface District {
    id: number;
    district_name: string;
    code: string;
    state_id: number;
    state_name: string;
    state_code: string;
    secretaryName: string;
    secretaryPhone: string;
    secretaryRegisteredAt: string | null;
    clubsCount: number;
    skatersCount: number;
    eventsCount: number;
    created_at: string;
}

interface ApiResponse {
    status: string;
    data: {
        districts: District[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        stats?: {
            totalDistricts: number;
            totalClubs: number;
            totalSkaters: number;
            totalEvents: number;
        };
    };
}

// States loaded dynamically from API
interface StateOption { id: number; state_name: string; code: string; }

export default function DistrictsPage() {
    const { user, token } = useAuth();
    const [districts, setDistricts] = useState<District[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stateFilter, setStateFilter] = useState<number | 'all'>('all');
    const [sortField, setSortField] = useState<keyof District>('district_name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({
        totalDistricts: 0,
        totalClubs: 0,
        totalSkaters: 0,
        totalEvents: 0
    });

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
    const [selectedDistricts, setSelectedDistricts] = useState<number[]>([]);
    const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);

    // View modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingDistrict, setViewingDistrict] = useState<any>(null);
    const [viewLoading, setViewLoading] = useState(false);

    const handleViewDistrict = async (districtId: number) => {
        setShowViewModal(true);
        setViewingDistrict(null);
        setViewLoading(true);
        try {
            const response = await axios.get(`http://localhost:5001/api/v1/districts/${districtId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setViewingDistrict(response.data?.data?.district ?? null);
        } catch (err) {
            console.error('Failed to load district profile:', err);
            setViewingDistrict(null);
        } finally {
            setViewLoading(false);
        }
    };

    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setViewingDistrict(null);
    };

    // Fetch states for filter dropdown
    useEffect(() => {
        if (!token) return;
        axios.get('http://localhost:5001/api/v1/states', {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 100, sortField: 'name', sortOrder: 'asc' }
        }).then(res => {
            const data = res.data?.data?.states || res.data?.data || [];
            setStateOptions(data.map((s: any) => ({
                id: s.id,
                state_name: s.state_name || s.name,
                code: s.code || s.state_code
            })));
        }).catch(() => {});
    }, [token]);

    const fetchDistricts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // In a real app, query params would be constructed here
            const params: any = {
                page: currentPage,
                limit: itemsPerPage,
                sortField,
                sortOrder,
                // No registeredOnly filter — show all districts
            };
            if (searchQuery) params.search = searchQuery;
            if (stateFilter !== 'all') params.stateId = stateFilter;

            const response = await axios.get<ApiResponse>('http://localhost:5001/api/v1/districts', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            if (response.data.status === 'success') {
                const { districts: data, meta, stats: backendStats } = response.data.data;
                setDistricts(data);
                setTotalPages(meta.totalPages);

                if (backendStats) {
                    setStats(backendStats);
                } else {
                    const currentStats = {
                        totalDistricts: meta.total,
                        totalClubs: data.reduce((acc, d) => acc + d.clubsCount, 0),
                        totalSkaters: data.reduce((acc, d) => acc + d.skatersCount, 0),
                        totalEvents: data.reduce((acc, d) => acc + d.eventsCount, 0),
                    };
                    setStats(currentStats);
                }
            }
        } catch (err: any) {
            console.error('Error fetching districts:', err);
            setError(err.response?.data?.message || 'Failed to fetch districts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            console.log('DistrictsPage: useEffect triggered', { token: !!token, searchQuery, stateFilter, currentPage });
            if (token) {
                fetchDistricts();
            } else {
                console.log('DistrictsPage: No token, skipping fetch');
                setIsLoading(false); // Stop loading if no token (though ideally redirect)
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [token, currentPage, searchQuery, stateFilter, sortField, sortOrder]);


    const handleSort = (field: keyof District) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const toggleSelectAll = () => {
        if (selectedDistricts.length === districts.length) {
            setSelectedDistricts([]);
        } else {
            setSelectedDistricts(districts.map(d => d.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedDistricts(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure?')) return;
        // API call to delete
    };

    // Re-calculate local totals for display if needed, but we used api stats
    const totalClubs = districts.reduce((acc, d) => acc + d.clubsCount, 0); // View only
    const totalSkaters = districts.reduce((acc, d) => acc + d.skatersCount, 0);
    const totalEvents = districts.reduce((acc, d) => acc + d.eventsCount, 0);


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registered Districts</h1>
                    <p className="text-gray-500 mt-1">Manage active districts with secretaries</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add District
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Stats Cards - Showing metadata totals if possible, else current view sums */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalDistricts}</p>
                            <p className="text-sm text-gray-500">Total Registered</p>
                        </div>
                    </div>
                </motion.div>

                {/* Placeholder stats for now as backend aggregate is not strictly available on listing API without extra queries */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalClubs}+</p>
                            <p className="text-sm text-gray-500">Active Clubs</p>
                        </div>
                    </div>
                </motion.div>
                {/* ... other stats ... */}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by district or secretary..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                <select
                    value={stateFilter === 'all' ? 'all' : stateFilter}
                    onChange={(e) => { setStateFilter(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    <option value="all">All States</option>
                    {stateOptions.map(state => (
                        <option key={state.id} value={state.id}>{state.state_name}</option>
                    ))}
                </select>
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
                                        checked={selectedDistricts.length === districts.length && districts.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-blue-500 focus:ring-blue-500/50"
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                                    onClick={() => handleSort('district_name')}
                                >
                                    <div className="flex items-center gap-2">
                                        District Name
                                        <ArrowUpDown className="w-4 h-4" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                                    onClick={() => handleSort('state_name')}
                                >
                                    <div className="flex items-center gap-2">
                                        State
                                        <ArrowUpDown className="w-4 h-4" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                                    onClick={() => handleSort('secretaryName')}
                                >
                                    <div className="flex items-center gap-2">
                                        Secretary
                                        <ArrowUpDown className="w-4 h-4" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                    Registered On
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
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : districts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                                        No registered districts found
                                    </td>
                                </tr>
                            ) : (
                                districts.map((district, index) => (
                                    <motion.tr
                                        key={district.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-b border-gray-200/30 hover:bg-gray-50/60"
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedDistricts.includes(district.id)}
                                                onChange={() => toggleSelect(district.id)}
                                                className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-blue-500 focus:ring-blue-500/50"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                                                    <Building2 className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">{district.district_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                                                    {district.state_code}
                                                </span>
                                                <span className="text-gray-500">{district.state_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-900 font-medium">{district.secretaryName}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-500 text-sm">{district.secretaryPhone}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-500 text-sm">
                                                {district.secretaryRegisteredAt ? new Date(district.secretaryRegisteredAt).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-gray-700">{district.clubsCount}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-gray-700">{district.skatersCount}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDistrict(district.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingDistrict(district)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(district.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Simplified for now, backend pagination available */}
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

            {/* View District Modal */}
            {showViewModal && (
                <DistrictViewModal
                    district={viewingDistrict}
                    isLoading={viewLoading}
                    onClose={handleCloseViewModal}
                />
            )}

            {/* Add/Edit District Modal */}
            {(showAddModal || editingDistrict) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl max-w-lg w-full border border-gray-200"
                    >
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingDistrict ? 'Edit District' : 'Add New District'}
                            </h2>
                            <button
                                onClick={() => { setShowAddModal(false); setEditingDistrict(null); }}
                                className="text-gray-500 hover:text-gray-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data = {
                                    name: formData.get('name'),
                                    code: formData.get('code'),
                                    stateId: formData.get('stateId'),
                                };
                                try {
                                    if (editingDistrict) {
                                        await axios.put(`http://localhost:5001/api/v1/districts/${editingDistrict.id}`, data, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                    } else {
                                        await axios.post('http://localhost:5001/api/v1/districts', data, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                    }
                                    setShowAddModal(false);
                                    setEditingDistrict(null);
                                    fetchDistricts();
                                } catch (err: any) {
                                    alert(err.response?.data?.message || 'Operation failed');
                                }
                            }}
                            className="p-6 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">District Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    defaultValue={editingDistrict?.district_name || ''}
                                    placeholder="e.g., Chennai"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">District Code</label>
                                <input
                                    type="text"
                                    name="code"
                                    required
                                    defaultValue={editingDistrict?.code || ''}
                                    placeholder="e.g., CHN"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">State</label>
                                <select
                                    name="stateId"
                                    required
                                    defaultValue={editingDistrict?.state_id || ''}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="">Select State</option>
                                    {stateOptions.map(state => (
                                        <option key={state.id} value={state.id}>{state.state_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setEditingDistrict(null); }}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                                >
                                    {editingDistrict ? 'Save Changes' : 'Add District'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}