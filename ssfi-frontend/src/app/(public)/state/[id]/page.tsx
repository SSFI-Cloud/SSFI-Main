'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { portalService, State, District } from '@/services/portal.service';
import { motion } from 'framer-motion';
import { MapPin, Users, Calendar, Award, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function StatePortalPage() {
    const params = useParams();
    const [state, setState] = useState<State | null>(null);
    const [districts, setDistricts] = useState<District[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (params?.id) {
                    // Fetch state details
                    const stateData = await portalService.getStateById(params.id as string);
                    setState(stateData);

                    // Fetch districts for this state
                    const districtsResponse = await portalService.getAllDistricts({
                        stateId: Number(params.id),
                        limit: 100
                    });
                    setDistricts(districtsResponse.data.districts || []);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load state details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params?.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !state) {
        return (
            <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-2xl font-bold text-slate-800">State Not Found</h1>
                <p className="text-slate-600 mt-2">{error || 'The requested state portal does not exist.'}</p>
                <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">Return Home</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Section */}
            <section className="relative bg-slate-900 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row items-center gap-8"
                    >
                        {state.logo ? (
                            <img src={state.logo} alt={state.state_name} className="w-32 h-32 object-contain bg-white rounded-full p-2" />
                        ) : (
                            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-4xl font-bold">
                                {state.code}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm font-medium border border-blue-500/30">
                                    State Portal
                                </span>
                                <span className="text-slate-400 font-mono">{state.code}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{state.state_name}</h1>
                            {state.website && (
                                <a
                                    href={state.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors"
                                >
                                    <ExternalLink size={16} />
                                    Visit Official Website
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard icon={<MapPin />} label="Districts" value={state.districtsCount || 0} />
                    <StatCard icon={<Award />} label="Clubs" value={state.clubsCount || 0} />
                    <StatCard icon={<Users />} label="Registered Skaters" value={state.skatersCount || 0} />
                    <StatCard icon={<Calendar />} label="Events Hosted" value={state.eventsCount || 0} />
                </div>
            </section>

            {/* Affiliated Districts */}
            <section className="container mx-auto px-4 py-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Affiliated Districts</h2>
                    <div className="text-sm text-slate-500">{districts.length} Districts Found</div>
                </div>

                {districts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {districts.map((district) => (
                            <Link
                                key={district.id}
                                href={`/district/${district.id}`}
                                className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 hover:border-blue-100"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                            {district.district_name}
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">Code: {district.code}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-50">
                                    <span className="flex items-center gap-1"><Award size={14} /> {district.clubsCount || 0} Clubs</span>
                                    <span className="flex items-center gap-1"><Users size={14} /> {district.skatersCount || 0} Skaters</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No Districts Found</h3>
                        <p className="text-slate-500">There are no affiliated districts listed for {state.state_name} yet.</p>
                    </div>
                )}
            </section>
        </main>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                {icon}
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
                <div className="text-sm text-slate-500">{label}</div>
            </div>
        </div>
    );
}
