'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Trophy,
    Calendar,
    MapPin,
    Loader2,
    CheckCircle,
    AlertCircle,
    Building2,
    Flag,
    Globe,
    IndianRupee
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

interface State {
    id: number;
    state_name: string;
    code: string;
}

const eventLevels = [
    { value: 'DISTRICT', label: 'District Level', icon: Building2 },
    { value: 'STATE', label: 'State Level', icon: Flag },
    { value: 'NATIONAL', label: 'National Meet', icon: Globe },
];

const eventTypes = [
    'Speed Skating',
    'Figure Skating',
    'Inline Hockey',
    'Artistic Skating',
    'Recreational',
];

const eventCategories = [
    'Championship',
    'Tournament',
    'Competition',
    'Festival',
    'Training Camp',
];

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [states, setStates] = useState<State[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'Speed Skating',
        category: 'Championship',
        level: 'DISTRICT',
        stateId: '',
        eventDate: '',
        endDate: '',
        registrationStartDate: '',
        registrationEndDate: '',
        venue: '',
        city: '',
        description: '',
        baseFee: 500,
        maxParticipants: 100,
    });

    // Fetch states
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/v1/states', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.data?.states) {
                    setStates(response.data.data.states);
                }
            } catch (err) {
                console.error('Failed to fetch states', err);
            }
        };
        if (token) fetchStates();
    }, [token]);

    // Fetch existing event data
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setIsFetching(true);
                const response = await axios.get(`http://localhost:5001/api/v1/events/${eventId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const event = response.data.data;

                // Format dates for input fields (YYYY-MM-DD)
                const formatDate = (dateStr: string) => {
                    if (!dateStr) return '';
                    return new Date(dateStr).toISOString().split('T')[0];
                };

                setFormData({
                    name: event.name || '',
                    code: event.code || '',
                    type: event.type || 'Speed Skating',
                    category: event.category || 'Championship',
                    level: event.eventLevel || event.level || 'DISTRICT',
                    stateId: event.stateId ? String(event.stateId) : '',
                    eventDate: formatDate(event.eventDate),
                    endDate: formatDate(event.eventEndDate || event.endDate),
                    registrationStartDate: formatDate(event.registrationStartDate),
                    registrationEndDate: formatDate(event.registrationEndDate),
                    venue: event.venue || '',
                    city: event.city || '',
                    description: event.description || '',
                    baseFee: event.entryFee || event.baseFee || 500,
                    maxParticipants: event.maxParticipants || 100,
                });
            } catch (err: any) {
                console.error('Failed to fetch event', err);
                setError(err.response?.data?.message || 'Failed to load event data');
            } finally {
                setIsFetching(false);
            }
        };
        if (token && eventId) fetchEvent();
    }, [token, eventId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await axios.put(`http://localhost:5001/api/v1/events/${eventId}`, {
                name: formData.name,
                code: formData.code,
                type: formData.type,
                category: formData.category,
                eventLevel: formData.level,
                stateId: formData.stateId ? Number(formData.stateId) : null,
                eventDate: new Date(formData.eventDate).toISOString(),
                eventEndDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                registrationStartDate: formData.registrationStartDate ? new Date(formData.registrationStartDate).toISOString() : null,
                registrationEndDate: formData.registrationEndDate ? new Date(formData.registrationEndDate).toISOString() : null,
                venue: formData.venue,
                city: formData.city,
                description: formData.description,
                entryFee: Number(formData.baseFee),
                maxParticipants: Number(formData.maxParticipants),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard/events');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update event');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/events"
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
                    <p className="text-gray-500">Update event details and settings</p>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-100 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-3"
                >
                    <CheckCircle className="w-5 h-5" />
                    Event updated successfully! Redirecting...
                </motion.div>
            )}

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-100 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3"
                >
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </motion.div>
            )}

            {/* Form */}
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6"
            >
                {/* Basic Information */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-blue-400" />
                        Event Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">Event Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., 15th State Speed Skating Championship 2024"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Event Code *</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g., SSC2024"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Event Level *</label>
                            <select
                                required
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                {eventLevels.map(level => (
                                    <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Event Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                {eventTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                {eventCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                placeholder="Event description and details"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-400" />
                        Event Dates
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Event Start Date *</label>
                            <input
                                type="date"
                                required
                                value={formData.eventDate}
                                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Event End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Registration Opens</label>
                            <input
                                type="date"
                                value={formData.registrationStartDate}
                                onChange={(e) => setFormData({ ...formData, registrationStartDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Registration Closes</label>
                            <input
                                type="date"
                                value={formData.registrationEndDate}
                                onChange={(e) => setFormData({ ...formData, registrationEndDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-purple-400" />
                        Venue Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">Venue Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.venue}
                                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                placeholder="e.g., Jawaharlal Nehru Stadium"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">City *</label>
                            <input
                                type="text"
                                required
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder="e.g., Chennai"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">State</label>
                            <select
                                value={formData.stateId}
                                onChange={(e) => setFormData({ ...formData, stateId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="">Select State</option>
                                {states.map(state => (
                                    <option key={state.id} value={state.id}>{state.state_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Fees & Limits */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-amber-400" />
                        Fees & Limits
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Base Registration Fee (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.baseFee}
                                onChange={(e) => setFormData({ ...formData, baseFee: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Max Participants</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.maxParticipants}
                                onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <Link
                        href="/dashboard/events"
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-center"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
