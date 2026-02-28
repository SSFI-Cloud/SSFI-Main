'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    AlertTriangle,
    Clock,
    RefreshCw,
    Unlock,
    Calendar,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import renewalService, { ExpiringAccount } from '@/services/renewal.service';

type Role = '' | 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB_OWNER' | 'STUDENT';
type Tab = 'expiring' | 'expired';

export default function RenewalManagement() {
    const [activeTab, setActiveTab] = useState<Tab>('expiring');
    const [expiringAccounts, setExpiringAccounts] = useState<ExpiringAccount[]>([]);
    const [expiredAccounts, setExpiredAccounts] = useState<ExpiringAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<Role>('');
    const [daysFilter, setDaysFilter] = useState<number>(30);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Modal states
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<ExpiringAccount | null>(null);
    const [renewalMonths, setRenewalMonths] = useState(12);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [unlockReason, setUnlockReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expiring, expired] = await Promise.all([
                renewalService.getExpiringAccounts(roleFilter || undefined, daysFilter),
                renewalService.getExpiredAccounts(roleFilter || undefined),
            ]);
            setExpiringAccounts(expiring);
            setExpiredAccounts(expired);
        } catch (error) {
            console.error('Error fetching renewal data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [roleFilter, daysFilter]);

    const handleRenew = async () => {
        if (!selectedAccount) return;
        setActionLoading(true);
        try {
            await renewalService.renewAccount(selectedAccount.id, paymentConfirmed, renewalMonths);
            setRenewModalOpen(false);
            setPaymentConfirmed(false);
            setRenewalMonths(12);
            fetchData();
        } catch (error) {
            console.error('Error renewing account:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlock = async () => {
        if (!selectedAccount || !unlockReason.trim()) return;
        setActionLoading(true);
        try {
            await renewalService.unlockAccount(selectedAccount.id, unlockReason);
            setUnlockModalOpen(false);
            setUnlockReason('');
            fetchData();
        } catch (error) {
            console.error('Error unlocking account:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLockExpired = async () => {
        setActionLoading(true);
        try {
            const count = await renewalService.lockExpiredAccounts();
            alert(`${count} accounts marked as expired.`);
            fetchData();
        } catch (error) {
            console.error('Error locking expired accounts:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredAccounts = (activeTab === 'expiring' ? expiringAccounts : expiredAccounts)
        .filter(account => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                account.name?.toLowerCase().includes(query) ||
                account.uid?.toLowerCase().includes(query) ||
                account.email?.toLowerCase().includes(query) ||
                account.phone?.includes(query)
            );
        });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'STATE_SECRETARY': return 'bg-purple-100 text-purple-600';
            case 'DISTRICT_SECRETARY': return 'bg-blue-100 text-blue-600';
            case 'CLUB_OWNER': return 'bg-green-100 text-green-600';
            case 'STUDENT': return 'bg-amber-100 text-amber-600';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">Active</span>;
            case 'EXPIRED': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">Expired</span>;
            case 'LOCKED': return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-600">Locked</span>;
            default: return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">{status}</span>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Renewal Management</h1>
                    <p className="text-gray-500 mt-1">Manage account renewals and expirations</p>
                </div>
                <button
                    onClick={handleLockExpired}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <Clock className="w-4 h-4" />
                    Run Expiry Check
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{expiringAccounts.length}</p>
                            <p className="text-sm text-gray-500">Expiring Soon</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{expiredAccounts.length}</p>
                            <p className="text-sm text-gray-500">Expired/Locked</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {expiringAccounts.filter(a => (a.daysUntilExpiry || 0) <= 7).length}
                            </p>
                            <p className="text-sm text-gray-500">Expiring in 7 Days</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {expiredAccounts.filter(a => a.accountStatus === 'LOCKED').length}
                            </p>
                            <p className="text-sm text-gray-500">Locked Accounts</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabs and Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('expiring')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'expiring'
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Expiring ({expiringAccounts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('expired')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'expired'
                                    ? 'bg-red-100 text-red-600'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Expired/Locked ({expiredAccounts.length})
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-blue-500 w-48"
                            />
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 flex items-center gap-2 hover:border-slate-500"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                {showFilterDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {showFilterDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-10 p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-2">Role</label>
                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value as Role)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">All Roles</option>
                                            <option value="STATE_SECRETARY">State Secretary</option>
                                            <option value="DISTRICT_SECRETARY">District Secretary</option>
                                            <option value="CLUB_OWNER">Club Owner</option>
                                            <option value="STUDENT">Student</option>
                                        </select>
                                    </div>
                                    {activeTab === 'expiring' && (
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-2">Days Until Expiry</label>
                                            <select
                                                value={daysFilter}
                                                onChange={(e) => setDaysFilter(Number(e.target.value))}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                                            >
                                                <option value={7}>7 days</option>
                                                <option value={15}>15 days</option>
                                                <option value={30}>30 days</option>
                                                <option value={60}>60 days</option>
                                                <option value={90}>90 days</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
                        </div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No accounts found</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Expiry Date</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAccounts.map((account) => (
                                    <tr key={account.id} className="border-b border-gray-200/30 hover:bg-gray-50/60">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-gray-900 font-medium">{account.name}</p>
                                                <p className="text-sm text-gray-500 font-mono">{account.uid}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(account.role)}`}>
                                                {account.role?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm">
                                                <p className="text-gray-700">{account.phone}</p>
                                                {account.email && <p className="text-gray-600">{account.email}</p>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-gray-900">
                                                    {account.expiryDate
                                                        ? new Date(account.expiryDate).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })
                                                        : 'N/A'}
                                                </p>
                                                {account.daysUntilExpiry !== null && account.daysUntilExpiry > 0 && (
                                                    <p className={`text-sm ${account.daysUntilExpiry <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                                                        {account.daysUntilExpiry} days left
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {getStatusBadge(account.accountStatus)}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAccount(account);
                                                        setRenewModalOpen(true);
                                                    }}
                                                    className="px-3 py-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                    Renew
                                                </button>
                                                {account.accountStatus === 'LOCKED' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAccount(account);
                                                            setUnlockModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                                    >
                                                        <Unlock className="w-4 h-4" />
                                                        Unlock
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Renew Modal */}
            {renewModalOpen && selectedAccount && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md mx-4"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Renew Account</h2>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <p className="text-gray-900 font-medium">{selectedAccount.name}</p>
                                <p className="text-sm text-gray-500">{selectedAccount.uid}</p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Renewal Period (months)</label>
                                <select
                                    value={renewalMonths}
                                    onChange={(e) => setRenewalMonths(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                                >
                                    <option value={6}>6 months</option>
                                    <option value={12}>12 months (1 year)</option>
                                    <option value={24}>24 months (2 years)</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-green-100 border border-green-500/20 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={paymentConfirmed}
                                    onChange={(e) => setPaymentConfirmed(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-200 bg-gray-100 text-green-500 focus:ring-green-500"
                                />
                                <div>
                                    <p className="text-green-600 font-medium">Payment Confirmed</p>
                                    <p className="text-sm text-gray-500">I confirm that payment has been received</p>
                                </div>
                            </label>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setRenewModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRenew}
                                    disabled={!paymentConfirmed || actionLoading}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Confirm Renewal
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Unlock Modal */}
            {unlockModalOpen && selectedAccount && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md mx-4"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Unlock Account</h2>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <p className="text-gray-900 font-medium">{selectedAccount.name}</p>
                                <p className="text-sm text-gray-500">{selectedAccount.uid}</p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Reason for Unlocking</label>
                                <textarea
                                    value={unlockReason}
                                    onChange={(e) => setUnlockReason(e.target.value)}
                                    placeholder="Enter reason for unlocking this account..."
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-blue-500 h-24 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setUnlockModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUnlock}
                                    disabled={!unlockReason.trim() || actionLoading}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                                    ) : (
                                        <>
                                            <Unlock className="w-4 h-4" />
                                            Unlock Account
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
