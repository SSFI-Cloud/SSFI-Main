'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    Search,
    ArrowLeft,
    Loader2,
    Clock,
    User,
    Plus,
    X,
    Check,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { portalService } from '@/services/portal.service';
import { useAuth } from '@/lib/hooks/useAuth';

interface Registration {
    id: number;
    confirmationNumber: string;
    student: {
        id: number;
        name: string;
        membershipId: string;
        district?: { name: string };
        state?: { name: string };
    };
    club?: { name: string };
    payment?: {
        status: string;
        amount: number;
        razorpayPaymentId: string;
    };
    status: string;
    paymentStatus: string;
    skateCategory: string;
    ageCategory: string;
    selectedRaces: string[] | string;
    totalFee: number;
    createdAt: string;
}

function AdminRegistrationsContent() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const { token } = useAuth(); // Get auth token

    const [loading, setLoading] = useState(true);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [search, setSearch] = useState('');
    const [exporting, setExporting] = useState(false);

    // Manual Registration State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [manualUid, setManualUid] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [foundStudent, setFoundStudent] = useState<any>(null);
    const [manualEventDetails, setManualEventDetails] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [availableRaces, setAvailableRaces] = useState<string[]>([]);
    const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
    const [suitSize, setSuitSize] = useState('');
    const [manualRemarks, setManualRemarks] = useState('');
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);

    useEffect(() => {
        if (token) {
            fetchRegistrations();
        }
    }, [eventId, token]);

    const fetchRegistrations = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await portalService.getEventRegistrations(eventId, {}, token);
            if (response.status === 'success') {
                setRegistrations(response.data.registrations);
            } else {
                toast.error('Failed to load registrations');
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!token) return;
        try {
            setExporting(true);
            const blob = await portalService.exportRegistrations(eventId, token);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `registrations-event-${eventId}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Export started!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    // Manual Registration Handlers
    const handleLookupStudent = async () => {
        if (!manualUid) return toast.error('Please enter Membership ID or UID');
        try {
            setIsLookingUp(true);
            const result = await portalService.lookupStudent(manualUid, eventId);
            if (result.status === 'success') {
                setFoundStudent(result.data.student);
                setManualEventDetails(result.data.event);
                setFoundStudent((prev: any) => ({ ...prev, ageCategory: result.data.eligibility.ageCategory }));
                toast.success('Student found!');
                // Reset selection
                setSelectedCategory('');
                setAvailableRaces([]);
                setSelectedRaces([]);
            }
        } catch (error: any) {
            toast.error(error.message || 'Student not found');
            setFoundStudent(null);
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleCategoryChange = async (category: string) => {
        setSelectedCategory(category);
        setSelectedRaces([]);

        if (category && foundStudent?.ageCategory) {
            try {
                const res = await portalService.getAvailableRaces(category, foundStudent.ageCategory);
                if (res.status === 'success') {
                    setAvailableRaces(res.data.availableRaces);
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load races');
            }
        }
    };

    const toggleRace = (race: string) => {
        if (selectedRaces.includes(race)) {
            setSelectedRaces(prev => prev.filter(r => r !== race));
        } else {
            if (selectedRaces.length >= 3) return toast.error('Max 3 races allowed'); // Basic rule
            setSelectedRaces(prev => [...prev, race]);
        }
    };

    const submitManualRegistration = async () => {
        if (!foundStudent) return toast.error('Please search for a student');
        if (!selectedCategory) return toast.error('Please select a skate category');
        if (!suitSize) return toast.error('Please select a suit size');
        if (selectedRaces.length === 0) return toast.error('Please select at least one race');

        if (!token) return;

        try {
            setIsSubmittingManual(true);
            const payload = {
                eventId: Number(eventId),
                studentId: foundStudent.id,
                studentUid: manualUid,
                skateCategory: selectedCategory,
                selectedRaces,
                suitSize: suitSize, // Fixed: Added suitSize
                remarks: manualRemarks,
                bypassPayment: true // Required by backend validator
            };

            await portalService.manualRegister(payload, token);
            toast.success('Student registered successfully!');
            setIsModalOpen(false);
            setFoundStudent(null);
            setManualUid('');
            setSuitSize('');
            setManualRemarks('');
            fetchRegistrations(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || 'Registration failed');
        } finally {
            setIsSubmittingManual(false);
        }
    };

    // Helper to safely get race at index
    const getRaceAtIndex = (races: string[] | string, index: number) => {
        const raceList = Array.isArray(races) ? races : (races ? races.split(', ') : []);
        return raceList[index] || '-';
    };


    const StatusBadge = ({ status, type }: { status: string, type: 'registration' | 'payment' }) => {
        const colors: any = {
            'CONFIRMED': 'bg-green-100 text-green-400 border-green-500/20',
            'PAID': 'bg-green-100 text-green-400 border-green-500/20',
            'PENDING': 'bg-yellow-100 text-yellow-400 border-yellow-500/20',
            'FAILED': 'bg-red-100 text-red-400 border-red-500/20',
            'CANCELLED': 'bg-red-100 text-red-400 border-red-500/20',
            'COMPLETED': 'bg-emerald-100 text-emerald-400 border-emerald-500/20', // For manual payment
        };

        let colorClass = 'bg-slate-500/10 text-gray-500 border-slate-500/20';
        if (colors[status]) colorClass = colors[status];

        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass} uppercase tracking-wider`}>
                {status}
            </span>
        );
    };

    const filteredRegistrations = registrations.filter(reg =>
        reg.student.name.toLowerCase().includes(search.toLowerCase()) ||
        reg.confirmationNumber.toLowerCase().includes(search.toLowerCase()) ||
        (reg.club?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <Link
                        href={`/dashboard/events`}
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2 transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Events
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Event Registrations</h1>
                    <p className="text-gray-500 text-sm">Manage and view all participants</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Student
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors border border-gray-200"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export Excel
                    </button>
                    <button
                        onClick={fetchRegistrations}
                        className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                        <Clock className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#f5f6f8] border border-gray-200 rounded-xl p-4 mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or club..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-gray-800 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#f5f6f8] border border-gray-200 rounded-xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : filteredRegistrations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                        <User className="w-12 h-12 mb-2 opacity-20" />
                        <p>No registrations found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="p-4 font-medium">Student</th>
                                    <th className="p-4 font-medium">Club</th>
                                    <th className="p-4 font-medium">District / State</th>
                                    <th className="p-4 font-medium">Category</th>
                                    <th className="p-4 font-medium">Race 1</th>
                                    <th className="p-4 font-medium">Race 2</th>
                                    <th className="p-4 font-medium">Race 3</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Payment</th>
                                    <th className="p-4 font-medium text-right">Fee</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredRegistrations.map((reg) => (
                                    <motion.tr
                                        key={reg.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{reg.student.name}</div>
                                            <div className="text-xs text-gray-600 font-mono mt-0.5">
                                                {reg.student.membershipId || reg.confirmationNumber}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700">{reg.club?.name || 'Independent'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700">{reg.student.district?.name}</div>
                                            <div className="text-xs text-gray-600 mt-0.5">{reg.student.state?.name}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700">{reg.skateCategory}</div>
                                            <div className="text-xs text-gray-600 mt-0.5">{reg.ageCategory}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700 truncate max-w-[120px]" title={getRaceAtIndex(reg.selectedRaces, 0)}>
                                                {getRaceAtIndex(reg.selectedRaces, 0)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700 truncate max-w-[120px]" title={getRaceAtIndex(reg.selectedRaces, 1)}>
                                                {getRaceAtIndex(reg.selectedRaces, 1)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700 truncate max-w-[120px]" title={getRaceAtIndex(reg.selectedRaces, 2)}>
                                                {getRaceAtIndex(reg.selectedRaces, 2)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={reg.status} type="registration" />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={reg.paymentStatus} type="payment" />
                                                {reg.payment?.razorpayPaymentId && (
                                                    <span className="text-xs text-gray-600 font-mono" title={reg.payment.razorpayPaymentId}>
                                                        {reg.payment.razorpayPaymentId.slice(-6)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-medium text-gray-700">
                                            ₹{reg.totalFee}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="text-right text-xs text-gray-600 mt-4">
                Showing {filteredRegistrations.length} registrations
            </div>

            {/* Manual Registration Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-[#f5f6f8] border border-gray-200 rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Manual Registration</h2>
                                <button onClick={() => setIsModalOpen(false)}>
                                    <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6">
                                {/* Step 1: Lookup */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Student Membership ID / UID</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={manualUid}
                                            onChange={(e) => setManualUid(e.target.value)}
                                            placeholder="e.g., STU-123"
                                            className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                        <button
                                            onClick={handleLookupStudent}
                                            disabled={isLookingUp || !manualUid}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                                        </button>
                                    </div>
                                </div>

                                {foundStudent && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                        {/* Student Info */}
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm space-y-1">
                                            <p><span className="text-gray-500">Name:</span> <span className="text-gray-900 font-medium">{foundStudent.fullName}</span></p>
                                            <p><span className="text-gray-500">Club:</span> <span className="text-gray-900">{foundStudent.club?.name || 'Independent'}</span></p>
                                            <p><span className="text-gray-500">DOB:</span> <span className="text-gray-900">{new Date(foundStudent.dateOfBirth).toLocaleDateString()}</span> ({foundStudent.ageCategory})</p>
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-500">Skate Category</label>
                                            <select
                                                value={selectedCategory}
                                                onChange={(e) => handleCategoryChange(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none"
                                            >
                                                <option value="">Select Category</option>
                                                <option value="BEGINNER">Beginner</option>
                                                <option value="RECREATIONAL">Recreational</option>
                                                <option value="QUAD">Tenacity (Quads)</option>
                                                <option value="PRO_INLINE">Inline (Professional)</option>
                                            </select>
                                        </div>

                                        {/* Suit Size - ADDED */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-500">Suit Size <span className="text-red-500">*</span></label>
                                            <select
                                                value={suitSize}
                                                onChange={(e) => setSuitSize(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none"
                                            >
                                                <option value="">Select Size</option>
                                                <option value="XS">XS</option>
                                                <option value="S">S</option>
                                                <option value="M">M</option>
                                                <option value="L">L</option>
                                                <option value="XL">XL</option>
                                                <option value="XXL">XXL</option>
                                                <option value="XXXL">XXXL</option>
                                                <option value="KIDS_4">Kids 4</option>
                                                <option value="KIDS_6">Kids 6</option>
                                                <option value="KIDS_8">Kids 8</option>
                                                <option value="KIDS_10">Kids 10</option>
                                                <option value="KIDS_12">Kids 12</option>
                                            </select>
                                        </div>

                                        {/* Races */}
                                        {availableRaces.length > 0 && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-500">Select Races (Max 3) <span className="text-red-500">*</span></label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {availableRaces.map(race => (
                                                        <button
                                                            key={race}
                                                            onClick={() => toggleRace(race)}
                                                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border ${selectedRaces.includes(race)
                                                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-700'
                                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-200'
                                                                }`}
                                                        >
                                                            {race}
                                                            {selectedRaces.includes(race) && <Check className="w-3 h-3" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Optional Remarks */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-500">Remarks (Optional)</label>
                                            <input
                                                type="text"
                                                value={manualRemarks}
                                                onChange={(e) => setManualRemarks(e.target.value)}
                                                placeholder="Admin notes..."
                                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-[#f5f6f8]/50">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitManualRegistration}
                                    disabled={isSubmittingManual}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                                >
                                    {isSubmittingManual && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Register (Waive Fee)
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AdminRegistrationsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-600" /></div>}>
            <AdminRegistrationsContent />
        </Suspense>
    );
}
