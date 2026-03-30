'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
    IndianRupee,
    ImagePlus,
    X
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import RaceConfigEditor, { type RaceConfig } from '@/components/events/RaceConfigEditor';

interface State {
    id: number;
    state_name: string;
    code: string;
}

const ALL_EVENT_LEVELS = [
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

export default function NewEventPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [states, setStates] = useState<State[]>([]);
    const [raceConfig, setRaceConfig] = useState<RaceConfig | null>(null);
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // Role-based event level options
    const eventLevels = useMemo(() => {
        if (user?.role === 'DISTRICT_SECRETARY') return ALL_EVENT_LEVELS.filter(l => l.value === 'DISTRICT');
        if (user?.role === 'STATE_SECRETARY') return ALL_EVENT_LEVELS.filter(l => l.value === 'STATE' || l.value === 'DISTRICT');
        if (user?.role === 'CLUB_OWNER') return ALL_EVENT_LEVELS.filter(l => l.value === 'DISTRICT');
        return ALL_EVENT_LEVELS; // GLOBAL_ADMIN sees all
    }, [user?.role]);

    const defaultLevel = eventLevels[0]?.value || 'DISTRICT';

    const isSecretary = user?.role === 'STATE_SECRETARY' || user?.role === 'DISTRICT_SECRETARY';

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'Speed Skating',
        category: 'Championship',
        level: defaultLevel,
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
        paymentMode: 'ONLINE' as 'ONLINE' | 'OFFLINE',
    });

    // Update default level when eventLevels changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, level: eventLevels[0]?.value || 'DISTRICT' }));
    }, [eventLevels]);

    useEffect(() => {
        // Fetch states (for state dropdown — only needed for admin/state roles)
        const fetchStates = async () => {
            try {
                const response = await api.get('/states', { params: { limit: 100 } });
                const statesData = (response.data as any)?.data?.states || (response.data as any)?.states;
                if (statesData) {
                    setStates(statesData);
                }
            } catch (err) {
                console.error('Failed to fetch states', err);
            }
        };
        fetchStates();
    }, []);

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Banner image must be less than 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setBannerImage(base64);
            setBannerPreview(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await api.post('/events', {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                eventLevel: formData.level,
                entryFee: Number(formData.baseFee),
                eventType: formData.category,
                disciplines: [formData.type],
                stateId: formData.stateId ? Number(formData.stateId) : null,
                eventDate: new Date(formData.eventDate).toISOString(),
                eventEndDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                registrationStartDate: formData.registrationStartDate ? new Date(formData.registrationStartDate).toISOString() : new Date(formData.eventDate).toISOString(),
                registrationEndDate: formData.registrationEndDate ? new Date(formData.registrationEndDate).toISOString() : new Date(formData.eventDate).toISOString(),
                maxParticipants: Number(formData.maxParticipants),
                venue: formData.venue,
                city: formData.city,
                paymentMode: formData.paymentMode,
                raceConfig: raceConfig,
                bannerImage: bannerImage,
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard/events');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create event');
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
                    <p className="text-gray-500">Set up a new skating competition or championship</p>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-100 border border-green-500/20 rounded-xl text-green-600 flex items-center gap-3"
                >
                    <CheckCircle className="w-5 h-5" />
                    Event created successfully! Redirecting...
                </motion.div>
            )}

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-100 border border-red-500/20 rounded-xl text-red-600 flex items-center gap-3"
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
                        <Trophy className="w-5 h-5 text-gray-900" />
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
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Event Level *</label>
                            <select
                                required
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Banner Image */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ImagePlus className="w-5 h-5 text-gray-900" />
                        Event Banner
                    </h2>
                    <div className="space-y-3">
                        {bannerPreview ? (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                <img src={bannerPreview} alt="Banner preview" className="w-full h-48 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setBannerImage(null); setBannerPreview(null); }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                                <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500 font-medium">Click to upload banner image</span>
                                <span className="text-xs text-gray-400 mt-1">JPG, PNG or WebP (max 5MB)</span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleBannerChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Dates */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-900" />
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
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Event End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Registration Opens *</label>
                            <input
                                type="date"
                                required
                                value={formData.registrationStartDate}
                                onChange={(e) => setFormData({ ...formData, registrationStartDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Registration Closes *</label>
                            <input
                                type="date"
                                required
                                value={formData.registrationEndDate}
                                onChange={(e) => setFormData({ ...formData, registrationEndDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-900" />
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
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        {/* State dropdown — only shown for admin who needs to pick; others auto-assigned by backend */}
                        {(user?.role === 'GLOBAL_ADMIN' || !user?.role) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">State</label>
                                <select
                                    value={formData.stateId}
                                    onChange={(e) => setFormData({ ...formData, stateId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <option value="">Select State</option>
                                    {states.map(state => (
                                        <option key={state.id} value={state.id}>{state.state_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fees & Limits */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-gray-900" />
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
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Max Participants</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.maxParticipants}
                                onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        {isSecretary && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 mb-2">Payment Collection Mode</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, paymentMode: 'ONLINE' })}
                                        className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                            formData.paymentMode === 'ONLINE'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <IndianRupee className="w-4 h-4" />
                                            Online (Razorpay)
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Collect payments online via payment gateway</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, paymentMode: 'OFFLINE' })}
                                        className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                            formData.paymentMode === 'OFFLINE'
                                                ? 'border-amber-500 bg-amber-50 text-amber-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            Offline (Cash)
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Collect cash payments and mark as paid manually</p>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Race Configuration */}
                <div>
                    <RaceConfigEditor value={raceConfig} onChange={setRaceConfig} />
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <Link
                        href="/dashboard/events"
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-center"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Event'
                        )}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
