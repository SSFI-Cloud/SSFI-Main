'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Shield,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

interface State {
    id: number;
    state_name: string;
    code: string;
}

interface District {
    id: number;
    district_name: string;
    code: string;
}

export default function NewClubPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [states, setStates] = useState<State[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [selectedState, setSelectedState] = useState<number | ''>('');

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        stateId: '',
        districtId: '',
        establishedYear: new Date().getFullYear().toString(),
    });

    useEffect(() => {
        // Fetch states
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

    useEffect(() => {
        // Fetch districts when state changes
        const fetchDistricts = async () => {
            if (!selectedState) {
                setDistricts([]);
                return;
            }
            try {
                const response = await axios.get(`http://localhost:5001/api/v1/districts?stateId=${selectedState}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.data?.districts) {
                    setDistricts(response.data.data.districts);
                }
            } catch (err) {
                console.error('Failed to fetch districts', err);
            }
        };
        if (token && selectedState) fetchDistricts();
    }, [token, selectedState]);

    const handleStateChange = (stateId: string) => {
        setSelectedState(stateId ? Number(stateId) : '');
        setFormData({ ...formData, stateId, districtId: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await axios.post('http://localhost:5001/api/v1/clubs', {
                ...formData,
                stateId: Number(formData.stateId),
                districtId: Number(formData.districtId),
                establishedYear: Number(formData.establishedYear),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard/clubs');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create club');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/clubs"
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Club</h1>
                    <p className="text-gray-500">Register a new skating club</p>
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
                    Club created successfully! Redirecting...
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
                {/* Club Details */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gray-900" />
                        Club Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Club Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Speed Skating Academy"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Club Code *</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g., SSA001"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Established Year</label>
                            <input
                                type="number"
                                min="1900"
                                max={new Date().getFullYear()}
                                value={formData.establishedYear}
                                onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Details */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-900" />
                        Contact Person
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Contact Person Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                placeholder="Full name"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Phone Number *</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 9876543210"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">Email Address *</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="club@example.com"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-900" />
                        Location
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">State *</label>
                            <select
                                required
                                value={formData.stateId}
                                onChange={(e) => handleStateChange(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="">Select State</option>
                                {states.map(state => (
                                    <option key={state.id} value={state.id}>{state.state_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">District *</label>
                            <select
                                required
                                value={formData.districtId}
                                onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                                disabled={!selectedState}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                            >
                                <option value="">Select District</option>
                                {districts.map(district => (
                                    <option key={district.id} value={district.id}>{district.district_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                                placeholder="Full club address"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <Link
                        href="/dashboard/clubs"
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
                                Creating...
                            </>
                        ) : (
                            'Create Club'
                        )}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
