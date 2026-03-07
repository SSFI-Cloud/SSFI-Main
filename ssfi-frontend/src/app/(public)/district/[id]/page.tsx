'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { portalService, District } from '@/services/portal.service';
import { motion } from 'framer-motion';
import { MapPin, Users, Calendar, Award, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function DistrictPortalPage() {
    const params = useParams();
    const [district, setDistrict] = useState<District | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (params?.id) {
                    const data = await portalService.getDistrictById(params.id as string);
                    setDistrict(data);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load district details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params?.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (error || !district) {
        return (
            <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-2xl font-bold text-slate-800">District Not Found</h1>
                <p className="text-slate-600 mt-2">{error || 'The requested district portal does not exist.'}</p>
                <Link href="/" className="mt-4 inline-block text-emerald-600 hover:underline">Return Home</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Section */}
            <section className="relative bg-slate-900 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-teal-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10" />

                <div className="container mx-auto px-4 relative z-10">
                    <Link
                        href={`/state/${district.state_id}`}
                        className="inline-flex items-center text-emerald-300 hover:text-white mb-6 transition-colors"
                    >
                        <ChevronLeft size={16} className="mr-1" />
                        Back to {district.state_name}
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/30">
                                District Portal
                            </span>
                            <span className="text-slate-400 font-mono">{district.code}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">{district.district_name}</h1>
                        <p className="text-xl text-emerald-100/80">Affiliated to {district.state_name}</p>
                    </motion.div>
                </div>
            </section>

            {/* Content Grid */}
            <section className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stats Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 md:col-span-1">
                        <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-2">Overview</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                        <Award size={20} />
                                    </div>
                                    <span>Affiliated Clubs</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900">{district.clubsCount || 0}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                        <Users size={20} />
                                    </div>
                                    <span>Active Skaters</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900">{district.skatersCount || 0}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                        <Calendar size={20} />
                                    </div>
                                    <span>Events Hosted</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900">{district.eventsCount || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center py-20">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Clubs & Events</h3>
                            <p className="text-slate-500 mb-6">View upcoming events and affiliated clubs for {district.district_name}.</p>
                            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                Browse Clubs
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
