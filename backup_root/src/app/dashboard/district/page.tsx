"use client";

import { useEffect, useState } from "react";

interface Club {
    id: number;
    name: string;
    status: string;
    skatersCount: number;
    contactPerson: string;
}

interface Skater {
    id: number;
    name: string;
    clubName: string;
    membershipId: string;
    gender: string;
}

interface DistrictStats {
    districtName: string;
    counts: {
        clubs: number;
        skaters: number;
        events: number;
    };
    clubs: Club[];
    recentSkaters: Skater[];
}

export default function DistrictAdminDashboard() {
    const [data, setData] = useState<DistrictStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/dashboard/district/stats");
                if (res.ok) {
                    const jsonData = await res.json();
                    setData(jsonData);
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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">District Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <p className="text-gray-500 text-sm font-medium uppercase">Clubs</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{data?.counts.clubs || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <p className="text-gray-500 text-sm font-medium uppercase">Skaters</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{data?.counts.skaters || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                    <p className="text-gray-500 text-sm font-medium uppercase">Events</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{data?.counts.events || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Clubs Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Affiliated Clubs</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Club Name</th>
                                    <th className="px-6 py-3">Skaters</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data?.clubs.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No clubs found</td></tr>
                                ) : (
                                    data?.clubs.map(club => (
                                        <tr key={club.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">
                                                <div>{club.name}</div>
                                                <div className="text-xs text-gray-500">{club.contactPerson}</div>
                                            </td>
                                            <td className="px-6 py-4">{club.skatersCount}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${club.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {club.status || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Skaters Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Recently Added Skaters</h2>
                        <button className="text-blue-600 hover:underline text-sm truncate">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Club</th>
                                    <th className="px-6 py-3">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data?.recentSkaters.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No skaters found</td></tr>
                                ) : (
                                    data?.recentSkaters.map(skater => (
                                        <tr key={skater.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{skater.name}</td>
                                            <td className="px-6 py-4">{skater.clubName}</td>
                                            <td className="px-6 py-4 font-mono text-xs">{skater.membershipId}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mt-8">
                <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                        Verify New Clubs
                    </button>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
                        View Skaters List
                    </button>
                </div>
            </div>
        </div>
    );
}
