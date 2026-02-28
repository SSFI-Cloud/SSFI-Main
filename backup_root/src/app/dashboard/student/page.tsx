"use client";

import { useEffect, useState } from "react";

interface StudentStats {
    fullName: string;
    memberId: string;
    totalEvents: number;
    skaterDetails: any;
}

export default function StudentDashboard() {
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/dashboard/student/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Welcome, {stats?.fullName || "Student"}!</h1>

            {/* ID Card Preview (Simplified) */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl shadow-lg p-6 mb-8 max-w-md">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-blue-200 text-xs uppercase tracking-wider mb-1">Membership ID</p>
                        <p className="text-2xl font-mono font-bold">{stats?.memberId || "PENDING"}</p>
                    </div>
                    {stats?.skaterDetails?.profile_photo && (
                        <img src={stats.skaterDetails.profile_photo} alt="Profile" className="w-16 h-16 rounded-full border-2 border-white" />
                    )}
                </div>
                <div className="mt-6">
                    <p className="font-semibold text-lg">{stats?.fullName}</p>
                    <p className="text-blue-200 text-sm">Skater</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                    <p className="text-gray-500 text-sm font-medium uppercase">My Events</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.totalEvents || 0}</p>
                    <button className="text-blue-600 text-sm mt-2 hover:underline">View History →</button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <p className="text-gray-500 text-sm font-medium uppercase">Membership Status</p>
                    <p className="text-xl font-bold text-green-600 mt-1">Active</p>
                    <p className="text-xs text-gray-400 mt-1">Valid until Dec 31, 2026</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                        Register for Event
                    </button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
                        Download ID Card
                    </button>
                </div>
            </div>
        </div>
    );
}
