'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Lock,
    Shield,
    Mail,
    Phone,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SettingsPage() {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile Form State
    const [profileData, setProfileData] = useState({
        phone: user?.phone || '',
        email: user?.email || '',
    });

    // Password Form State
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await axios.put(
                'http://localhost:5001/api/v1/auth/profile',
                profileData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 'success') {
                setMessage({ type: 'success', text: 'Profile updated successfully' });
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:5001/api/v1/auth/change-password',
                {
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 'success') {
                setMessage({ type: 'success', text: 'Password changed successfully' });
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500">Manage your account and preferences</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar / Tabs */}
                <div className="lg:w-64 space-y-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Profile</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'security'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <Shield className="w-5 h-5" />
                        <span className="font-medium">Security</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success'
                                    ? 'bg-green-100 border-green-500/20 text-green-600'
                                    : 'bg-red-100 border-red-500/20 text-red-600'
                                }`}
                        >
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </motion.div>
                    )}

                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl border border-gray-200 p-6"
                    >
                        {activeTab === 'profile' ? (
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Personal Information</h2>
                                    <p className="text-gray-500 text-sm">Update your personal details here.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-500">User ID (Read Only)</label>
                                            <div className="px-4 py-2.5 bg-[#f5f6f8]/50 border border-gray-200 rounded-lg text-gray-600 flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                {user?.uid || 'Loading...'}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-500">Role (Read Only)</label>
                                            <div className="px-4 py-2.5 bg-[#f5f6f8]/50 border border-gray-200 rounded-lg text-gray-600 flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                {user?.role || 'Loading...'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                            <input
                                                type="tel"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Security Settings</h2>
                                    <p className="text-gray-500 text-sm">Ensure your account is secure by using a strong password.</p>
                                </div>

                                <div className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Current Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                            <input
                                                type="password"
                                                value={passwordData.oldPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
