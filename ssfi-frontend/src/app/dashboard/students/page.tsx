'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Users, Plus, Search, Edit2, Trash2, Eye, Download,
    ChevronLeft, ChevronRight, ArrowUpDown, Loader2,
    CheckCircle, Clock, User, AlertCircle, Trophy,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import StudentViewModal from '@/components/dashboard/StudentViewModal';

/* Always use the backend base URL for serving uploaded images */
const IMG_BASE = 'https://api.ssfiskate.com';
const imgUrl = (path: string) => {
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const slash = path.startsWith('/') ? '' : '/';
    return `${IMG_BASE}${slash}${path}`;
};

interface Student {
    id: number;
    ssfi_id: string;
    name: string;
    father_name: string;
    mother_name: string | null;
    mobile: string;
    email: string | null;
    dob: string;
    gender: string;
    blood_group: string | null;
    category_name: string | null;
    club_name: string;
    club_id: number;
    district_name: string;
    state_name: string;
    coach_name: string;
    school_name: string | null;
    address: string | null;
    city: string | null;
    pincode: string | null;
    nominee_name: string | null;
    nominee_relation: string | null;
    approval_status: string;
    profile_image: string | null;
    created_at: string;
}

const SKATE_CATEGORIES = [
    { value: 'SPEED_QUAD',    label: 'Speed Quad' },
    { value: 'SPEED_INLINE',  label: 'Speed Inline' },
    { value: 'RECREATIONAL',  label: 'Recreational' },
    { value: 'ARTISTIC',      label: 'Artistic' },
    { value: 'INLINE_HOCKEY', label: 'Inline Hockey' },
    { value: 'BEGINNER',      label: 'Beginner' },
];

const CATEGORY_COLORS: Record<string, string> = {
    'Speed Quad':    'bg-emerald-100 text-emerald-600',
    'Speed Inline':  'bg-green-100 text-green-600',
    'Recreational':  'bg-teal-100 text-teal-600',
    'Artistic':      'bg-teal-100 text-teal-600',
    'Inline Hockey': 'bg-emerald-100 text-emerald-600',
    'Beginner':      'bg-gray-100 text-gray-500',
};

export default function StudentsPage() {
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ totalStudents: 0, verifiedStudents: 0, pendingStudents: 0, maleStudents: 0, femaleStudents: 0 });

    // Selection
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // View modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

    const itemsPerPage = 10;

    const fetchStudents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: any = { page: currentPage, limit: itemsPerPage, sortField, sortOrder };
            if (searchQuery) params.search = searchQuery;
            if (categoryFilter !== 'all') params.skateCategory = categoryFilter;
            if (verificationFilter === 'verified') params.status = 'APPROVED';
            if (verificationFilter === 'pending') params.status = 'PENDING';

            const response = await api.get('/students', { params });

            const resData = (response.data as any)?.data ?? response.data;
            if (resData) {
                const { students: data, meta, stats: backendStats } = resData;
                setStudents(data);
                setTotalPages(meta.totalPages);
                if (backendStats) {
                    setStats({
                        totalStudents: backendStats.total,
                        verifiedStudents: backendStats.verified,
                        pendingStudents: backendStats.pending,
                        maleStudents: backendStats.male,
                        femaleStudents: backendStats.female,
                    });
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch students');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [currentPage, searchQuery, categoryFilter, verificationFilter, sortField, sortOrder]);

    const calculateAge = (dob: string) => {
        if (!dob) return '—';
        const birth = new Date(dob);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        if (now.getMonth() - birth.getMonth() < 0 || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
        return age;
    };

    const handleSort = (field: string) => {
        if (sortField === field) setSortOrder(s => s === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortOrder('asc'); }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === students.length) setSelectedIds([]);
        else setSelectedIds(students.map(s => s.id));
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleExport = () => {
        const rows = selectedIds.length > 0
            ? students.filter(s => selectedIds.includes(s.id))
            : students;
        if (rows.length === 0) return;
        const headers = ['SSFI ID','Name','Father Name','Mobile','Email','DOB','Gender','Blood Group','Category','Club','District','State','Coach','School','Address','City','Pincode','Status','Created At'];
        const csvRows = [headers.join(',')];
        for (const s of rows) {
            csvRows.push([
                s.ssfi_id, s.name, s.father_name, s.mobile, s.email || '', s.dob, s.gender,
                s.blood_group || '', s.category_name || '', s.club_name, s.district_name, s.state_name,
                s.coach_name, s.school_name || '', (s.address || '').replace(/,/g, ' '), s.city || '',
                s.pincode || '', s.approval_status, s.created_at
            ].map(v => `"${v}"`).join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `students_${new Date().toISOString().slice(0,10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
                    <p className="text-gray-500 mt-1">Manage all registered skaters</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExport} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
                    </button>
                    {user?.role === 'GLOBAL_ADMIN' && (
                        <Link href="/dashboard/students/new" className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Student
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total',    value: stats.totalStudents,    Icon: Users,       color: 'text-emerald-600',   bg: 'bg-emerald-100' },
                    { label: 'Verified', value: stats.verifiedStudents, Icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-100' },
                    { label: 'Pending',  value: stats.pendingStudents,  Icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-100' },
                    { label: 'Male',     value: stats.maleStudents,     Icon: User,        color: 'text-cyan-600',   bg: 'bg-cyan-100' },
                    { label: 'Female',   value: stats.femaleStudents,   Icon: Trophy,      color: 'text-teal-600',   bg: 'bg-teal-100' },
                ].map(({ label, value, Icon, color, bg }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900">{value}</p>
                                <p className="text-xs text-gray-500">{label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input type="text" value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Search by name, UID, or mobile..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <option value="all">All Categories</option>
                    {SKATE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
                                <th className="px-4 py-3 text-left w-10">
                                    <input type="checkbox" checked={selectedIds.length === students.length && students.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-emerald-500" />
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900" onClick={() => handleSort('uid')}>
                                    <div className="flex items-center gap-2">UID <ArrowUpDown className="w-4 h-4" /></div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">Student <ArrowUpDown className="w-4 h-4" /></div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Category</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Club</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Age</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Status</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center">
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                                </td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No students found</td></tr>
                            ) : students.map((student, index) => (
                                <motion.tr key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="border-b border-gray-200/30 hover:bg-gray-50/60">
                                    <td className="px-4 py-3">
                                        <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelect(student.id)} className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-emerald-500" />
                                    </td>
                                    {/* UID column */}
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-emerald-600">{student.ssfi_id || '—'}</span>
                                    </td>
                                    {/* Student name + photo */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {/* Rounded profile thumbnail with shadow & dark overlay */}
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-md ring-2 ring-white">
                                                {student.profile_image ? (
                                                    <>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={imgUrl(student.profile_image)}
                                                            alt={student.name}
                                                            className="object-cover w-full h-full"
                                                            loading="lazy"
                                                        />
                                                        {/* Subtle dark gradient overlay for professional look */}
                                                        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-black/5 via-transparent to-black/25 pointer-events-none" />
                                                    </>
                                                ) : (
                                                    <span className={`flex items-center justify-center w-full h-full ${student.gender === 'FEMALE' ? 'bg-teal-100' : 'bg-cyan-100'}`}>
                                                        <User className={`w-5 h-5 ${student.gender === 'FEMALE' ? 'text-teal-600' : 'text-cyan-600'}`} />
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{student.name}</p>
                                                <p className="text-xs text-gray-500">{student.gender}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Category */}
                                    <td className="px-4 py-3">
                                        {student.category_name ? (
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${CATEGORY_COLORS[student.category_name] || 'bg-gray-100 text-gray-500'}`}>
                                                {student.category_name}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">—</span>
                                        )}
                                    </td>
                                    {/* Club */}
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-900">{student.club_name}</p>
                                        <p className="text-xs text-gray-500">{student.district_name}</p>
                                    </td>
                                    {/* Age */}
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-gray-900 font-medium">{calculateAge(student.dob)}</span>
                                    </td>
                                    {/* Status */}
                                    <td className="px-4 py-3 text-center">
                                        {student.approval_status === 'APPROVED' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                                                <CheckCircle className="w-3 h-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-600 text-xs font-medium rounded-full">
                                                <Clock className="w-3 h-3" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => { setViewingStudent(student); setShowViewModal(true); }}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors" title="View">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <Link href={`/dashboard/students/${student.id}/edit`}
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

            {/* Student View Modal — passes data directly from table row (no extra API call needed) */}
            {showViewModal && (
                <StudentViewModal
                    student={viewingStudent}
                    isLoading={false}
                    onClose={() => { setShowViewModal(false); setViewingStudent(null); }}
                />
            )}
        </div>
    );
}
