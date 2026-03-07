'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Users, MapPin, Calendar,
    ArrowUpRight, ArrowDownRight, Download, Filter,
    Activity, IndianRupee, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

// ─── Mini chart components ────────────────────────────────────────────────────

const BarChart = ({ data, color = 'bg-emerald-500' }: { data: number[]; color?: string }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end justify-between h-32 gap-1 pt-4">
            {data.map((value, i) => (
                <div key={i} className="flex flex-col items-center w-full">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(value / max) * 100}%` }}
                        className={`w-full rounded-t-sm ${color} opacity-80 hover:opacity-100 transition-opacity min-h-[4px]`}
                    />
                </div>
            ))}
        </div>
    );
};

const LineChart = ({ data, color = '#10b981' }: { data: number[]; color?: string }) => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - ((val - min) / range) * 100}`).join(' ');
    return (
        <div className="h-32 w-full pt-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
                <motion.path initial={{ opacity: 0 }} animate={{ opacity: 0.15 }}
                    d={`M0,100 L${points.split(' ').join(' L')} L100,100 Z`} fill={color} />
            </svg>
        </div>
    );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
    overview: {
        totalStudents: number;
        totalClubs: number;
        totalEvents: number;
        totalRevenue: number;
        registrationsGrowth: number;
        revenueGrowth: number;
        pendingApprovals: { total: number };
    };
    trends: {
        monthlyRegistrations: number[];
        monthlyRevenue: number[];
    };
    analytics: {
        topItems: { name: string; students: number; clubs: number }[];
        tableLabel: string;
        tableSubLabel: string;
    };
    roleLabels: {
        title: string;
        subtitle: string;
        tableLabel: string;
        tableSubLabel: string;
        col1: string;
    };
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const [data, setData]       = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/reports/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data as unknown as BlobPart]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `SSFI-Reports-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch {
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/reports/stats');
            setData((res.data as any).data ?? res.data);
        } catch (err: any) {
            const msg = err.response?.data?.message ?? 'Failed to load report data';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const fmt = (n: number) =>
        n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` :
        n >= 1000   ? `₹${(n / 1000).toFixed(1)}K`   :
        `₹${n}`;

    const GrowthBadge = ({ pct }: { pct: number }) =>
        pct >= 0
            ? <span className="flex items-center gap-1 text-sm text-green-600"><ArrowUpRight className="w-4 h-4" />+{pct}%<span className="text-gray-600 ml-1">vs last month</span></span>
            : <span className="flex items-center gap-1 text-sm text-red-600"><ArrowDownRight className="w-4 h-4" />{pct}%<span className="text-gray-600 ml-1">vs last month</span></span>;

    if (isLoading) return (
        <div className="flex items-center justify-center p-24">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
    );

    if (error) return (
        <div className="p-6">
            <div className="bg-red-100 border border-red-500/30 text-red-600 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
                <button onClick={fetchStats} className="ml-auto text-xs underline">Retry</button>
            </div>
        </div>
    );

    const ov = data?.overview;
    const trends = data?.trends;
    const topItems = data?.analytics?.topItems ?? [];
    const labels = data?.roleLabels;
    const showPendingApprovals = (ov?.pendingApprovals?.total ?? 0) > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{labels?.title || 'Reports & Analytics'}</h1>
                    <p className="text-gray-500 mt-1">{labels?.subtitle || 'Comprehensive overview of performance'}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchStats} className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2 border border-gray-200">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <button onClick={handleExport} disabled={exporting}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50">
                        {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</> : <><Download className="w-4 h-4" /> Export</>}
                    </button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Registrations', value: ov?.totalStudents ?? 0, icon: Users, color: 'blue', growth: ov?.registrationsGrowth ?? 0, fmt: (n:number)=>n.toLocaleString('en-IN') },
                    { label: 'Total Revenue', value: ov?.totalRevenue ?? 0, icon: IndianRupee, color: 'green', growth: ov?.revenueGrowth ?? 0, fmt },
                    { label: 'Active Events', value: ov?.totalEvents ?? 0, icon: Calendar, color: 'teal', growth: null, sub: 'Live & upcoming' },
                    { label: 'Active Clubs', value: ov?.totalClubs ?? 0, icon: Filter, color: 'purple', growth: null, sub: showPendingApprovals ? `${ov?.pendingApprovals.total ?? 0} pending approval` : 'Registered clubs' },
                ].map(({ label, value, icon: Icon, color, growth, fmt: fmtFn, sub }, idx) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
                        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">{label}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{fmtFn ? fmtFn(value) : value.toLocaleString('en-IN')}</h3>
                            </div>
                            <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
                                <Icon className={`w-5 h-5 text-${color}-400`} />
                            </div>
                        </div>
                        {growth !== null && growth !== undefined
                            ? <GrowthBadge pct={growth} />
                            : <p className="text-sm text-gray-600">{sub}</p>}
                    </motion.div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Registration Trends</h3>
                    <p className="text-xs text-gray-600 mb-2">Monthly new students — {new Date().getFullYear()}</p>
                    <BarChart data={trends?.monthlyRegistrations ?? new Array(12).fill(0)} color="bg-emerald-500" />
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                        {MONTHS.map(m => <span key={m}>{m}</span>)}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Revenue Overview</h3>
                    <p className="text-xs text-gray-600 mb-2">Monthly collected revenue — {new Date().getFullYear()}</p>
                    <LineChart data={trends?.monthlyRevenue ?? new Array(12).fill(0)} color="#10b981" />
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                        {MONTHS.map(m => <span key={m}>{m}</span>)}
                    </div>
                </motion.div>
            </div>

            {/* Table — role-specific breakdown */}
            {labels?.tableLabel && topItems.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">{labels.tableLabel}</h3>
                        <p className="text-sm text-gray-600 mt-1">{labels.tableSubLabel}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left">#</th>
                                    <th className="px-6 py-4 text-left">{labels.col1}</th>
                                    <th className="px-6 py-4 text-left">Students</th>
                                    {topItems.some(i => i.clubs > 0) && <th className="px-6 py-4 text-left">Clubs</th>}
                                    <th className="px-6 py-4 text-right">Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {topItems.map((item, i) => {
                                    const totalSt = topItems.reduce((s, it) => s + it.students, 0) || 1;
                                    const share = Math.round((item.students / totalSt) * 100);
                                    return (
                                        <tr key={item.name} className="hover:bg-gray-50/60">
                                            <td className="px-6 py-4 text-gray-600 text-sm">{i + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-600" />
                                                    <span className="text-gray-900 font-medium">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">{item.students.toLocaleString('en-IN')}</td>
                                            {topItems.some(it => it.clubs > 0) && <td className="px-6 py-4 text-gray-700">{item.clubs}</td>}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${share}%` }} />
                                                    </div>
                                                    <span className="text-xs text-gray-500 w-8 text-right">{share}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
