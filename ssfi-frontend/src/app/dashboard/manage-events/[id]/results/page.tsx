'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Trophy,
    Save,
    Share2,
    Users,
    Filter,
    AlertCircle,
    Check,
    Loader2,
    Medal
} from 'lucide-react';
import { resultService } from '@/services/result.service';
import toast from 'react-hot-toast';

export default function EventResultsPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = Number(params.id);

    // State for filters
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedSkate, setSelectedSkate] = useState('');
    const [selectedAge, setSelectedAge] = useState('');
    const [selectedGender, setSelectedGender] = useState('');
    const [selectedRace, setSelectedRace] = useState('');

    // State for participants and results
    const [participants, setParticipants] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    // results: [{ studentId: 1, position: 1, ... }]

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    // Fetch filters available for this event
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const data = await resultService.getEventRaceCategories(eventId);
                setCategories(data as any);
                setIsLoading(false);
            } catch (err) {
                console.error('Failed to load filters:', err);
                toast.error('Failed to load race categories');
                setIsLoading(false);
            }
        };
        fetchFilters();
    }, [eventId]);

    // Derived lists for dropdowns
    const uniqueSkateCategories = Array.from(new Set(categories.map(c => c.skateCategory)));
    const uniqueAgeCategories = Array.from(new Set(categories.filter(c => c.skateCategory === selectedSkate).map(c => c.ageCategory)));
    const uniqueGenders = Array.from(new Set(categories.filter(c => c.skateCategory === selectedSkate && c.ageCategory === selectedAge).map(c => c.gender)));
    const uniqueRaces = Array.from(new Set(categories.filter(c => c.skateCategory === selectedSkate && c.ageCategory === selectedAge && c.gender === selectedGender).map(c => c.raceType)));


    // Fetch participants when all filters are selected
    useEffect(() => {
        if (selectedSkate && selectedAge && selectedGender && selectedRace) {
            fetchParticipants();
        } else {
            setParticipants([]);
        }
    }, [selectedSkate, selectedAge, selectedGender, selectedRace]);

    const fetchParticipants = async () => {
        try {
            const data = await resultService.getParticipantsForRace(eventId, {
                skateCategory: selectedSkate,
                ageCategory: selectedAge,
                gender: selectedGender,
                raceType: selectedRace
            });
            setParticipants(data as any);

            // Initialize local results state from fetched data
            const initialResults = (data as unknown as any[])
                .filter((p: any) => p.result)
                .map((p: any) => ({
                    studentId: p.id,
                    position: p.result.position,
                    timing: p.result.timing
                }));
            setResults(initialResults);

        } catch (err) {
            toast.error('Failed to load participants');
        }
    };

    const handleResultChange = (studentId: number, position: number) => {
        // If selecting a position already taken by another student, clear that student's position
        let newResults = [...results];

        // Remove existing result for this student if any
        newResults = newResults.filter(r => r.studentId !== studentId);

        if (position > 0) {
            // Check if position is occupied
            const occupied = newResults.find(r => r.position === position);
            if (occupied) {
                // Remove position from the other student
                newResults = newResults.filter(r => r.studentId !== occupied.studentId);
                toast('Previous winner for this position removed', { icon: 'ℹ️' });
            }
            newResults.push({ studentId, position });
        }

        setResults(newResults);
    };

    const handleSave = async () => {
        if (!selectedRace) return;

        try {
            setIsSaving(true);
            await resultService.saveResults(eventId, {
                skateCategory: selectedSkate,
                ageCategory: selectedAge,
                gender: selectedGender,
                raceType: selectedRace,
                results
            });
            toast.success('Results saved successfully!');
            fetchParticipants(); // Refresh
        } catch (err) {
            toast.error('Failed to save results');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePublish = async () => {
        try {
            const response = await resultService.togglePublication(eventId, !isPublished);
            setIsPublished(!isPublished);
            if (!isPublished) {
                // Publishing — certificates auto-issued
                const certInfo = (response as any)?.certificates;
                if (certInfo) {
                    toast.success(
                        `Results Published! 🏅 ${certInfo.issued} certificate(s) issued automatically.`,
                        { duration: 5000 }
                    );
                } else {
                    toast.success('Results Published! Certificates issued to all participants.');
                }
            } else {
                toast.success('Results Unpublished');
            }
        } catch (err) {
            toast.error('Failed to update publication status');
        }
    };

    // Quick helper to get position info
    const getPositionName = (pos: number) => {
        switch (pos) {
            case 1: return 'Gold';
            case 2: return 'Silver';
            case 3: return 'Bronze';
            default: return '';
        }
    };




    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-amber-400" />
                            Result Management
                        </h1>
                        <p className="text-gray-500 mt-1">Enter and manage race results</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleTogglePublish}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isPublished
                            ? 'bg-green-100 text-green-400 border border-green-500/50 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Share2 className="w-4 h-4" />
                        {isPublished ? 'Published' : 'Publish All Results'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4 text-gray-500 text-sm font-medium uppercase tracking-wider">
                    <Filter className="w-4 h-4" />
                    Select Race Category
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <select
                        value={selectedSkate}
                        onChange={(e) => { setSelectedSkate(e.target.value); setSelectedAge(''); setSelectedGender(''); setSelectedRace(''); }}
                        className="form-select w-full px-4 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value="">Select Skate Type</option>
                        {uniqueSkateCategories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={selectedAge}
                        disabled={!selectedSkate}
                        onChange={(e) => { setSelectedAge(e.target.value); setSelectedGender(''); setSelectedRace(''); }}
                        className="form-select w-full px-4 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Age Category</option>
                        {uniqueAgeCategories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={selectedGender}
                        disabled={!selectedAge}
                        onChange={(e) => { setSelectedGender(e.target.value); setSelectedRace(''); }}
                        className="form-select w-full px-4 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Gender</option>
                        {uniqueGenders.map((c: any) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={selectedRace}
                        disabled={!selectedGender}
                        onChange={(e) => setSelectedRace(e.target.value)}
                        className="form-select w-full px-4 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Race</option>
                        {uniqueRaces.map((c: any) => <option key={c} value={c}>{c} meters</option>)}
                    </select>
                </div>
            </div>

            {/* Participants Table */}
            {selectedRace && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-400" />
                            Participants ({participants.length})
                        </h2>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || participants.length === 0}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/20 font-medium"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save Results'}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f5f6f8]/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Bib / ID</th>
                                    <th className="px-6 py-4">Student Name</th>
                                    <th className="px-6 py-4">Club / City</th>
                                    <th className="px-6 py-4 text-center">Result Position</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-600">
                                            No participants found for this category.
                                        </td>
                                    </tr>
                                ) : (
                                    participants.map((student) => {
                                        const currentPos = results.find(r => r.studentId === student.id)?.position || 0;

                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-sm text-gray-700">
                                                    {student.bibNumber !== 'N/A' ? (
                                                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-900 font-bold border border-gray-200">
                                                            {student.bibNumber}
                                                        </span>
                                                    ) : (
                                                        student.membershipId
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {student.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {student.club?.name || student.district?.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {[1, 2, 3].map((pos) => {
                                                            const isSelected = currentPos === pos;
                                                            let colorClass = '';
                                                            if (pos === 1) colorClass = isSelected
                                                                ? 'bg-yellow-400 text-black border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                                                                : 'border-gray-200 text-gray-600 hover:border-yellow-500/50 hover:text-yellow-400 hover:bg-yellow-100';

                                                            if (pos === 2) colorClass = isSelected
                                                                ? 'bg-slate-300 text-gray-900 border-slate-400 shadow-[0_0_15px_rgba(203,213,225,0.3)]'
                                                                : 'border-gray-200 text-gray-600 hover:border-slate-400/50 hover:text-gray-700 hover:bg-slate-400/10';

                                                            if (pos === 3) colorClass = isSelected
                                                                ? 'bg-amber-600 text-white border-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.3)]'
                                                                : 'border-gray-200 text-gray-600 hover:border-amber-600/50 hover:text-amber-600 hover:bg-amber-600/10';

                                                            return (
                                                                <button
                                                                    key={pos}
                                                                    onClick={() => handleResultChange(student.id, isSelected ? 0 : pos)}
                                                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${colorClass} ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                                                                    title={getPositionName(pos)}
                                                                >
                                                                    <Medal className="w-5 h-5" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!selectedRace && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                    <Filter className="w-16 h-16 mb-4 text-gray-700" />
                    <p className="text-lg">Please select all filters to load participants</p>
                </div>
            )}
        </div>
    );
}
