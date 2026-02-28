"use client";

import { useEffect, useState } from "react";

interface Skater {
    id: number;
    name: string;
    membershipId: string;
    gender: string;
    dob: string;
}

interface ClubStats {
    clubName: string;
    skatersCount: number;
    skaters: Skater[];
}

export default function ClubAdminDashboard() {
    const [data, setData] = useState<ClubStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/dashboard/club/stats");
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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">{data?.clubName} Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <p className="text-gray-500 text-sm font-medium uppercase">Registered Skaters</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{data?.skatersCount || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <p className="text-gray-500 text-sm font-medium uppercase">Pending Approvals</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
                </div>
            </div>

            {/* Skaters Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">My Skaters</h2>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm">
                        + Add New Skater
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase">
                            <tr>
                                <th className="px-6 py-3">Membership ID</th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Gender</th>
                                <th className="px-6 py-3">DOB</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data?.skaters.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No skaters registered yet</td></tr>
                            ) : (
                                data?.skaters.map(skater => (
                                    <tr key={skater.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-xs">{skater.membershipId}</td>
                                        <td className="px-6 py-4 font-medium">{skater.name}</td>
                                        <td className="px-6 py-4">{skater.gender}</td>
                                        <td className="px-6 py-4">{new Date(skater.dob).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <button className="text-blue-600 hover:underline mr-4">Edit</button>
                                            <button className="text-green-600 hover:underline">Register Event</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
