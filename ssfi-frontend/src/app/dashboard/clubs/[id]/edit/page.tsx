'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, Save, Loader2, AlertCircle, CheckCircle,
    Shield, MapPin, Phone, Mail, User, Calendar, Hash, Globe, FileText
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface ClubData {
    id: string;
    name: string;
    code: string;
    uid: string;
    email: string;
    phone: string;
    contactPerson: string;
    address: string;
    city: string;
    pincode: string;
    establishedYear: number | null;
    stateId: number;
    districtId: number;
    registrationNumber: string;
    website: string;
    logo: string;
}

export default function EditClubPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const [form, setForm] = useState<Partial<ClubData>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!token || !id) return;
        (async () => {
            try {
                const res = await api.get(`/clubs/${id}`);
                const club = res.data?.data?.club || res.data?.data || res.data;
                setForm({
                    name: club.name || club.club_name || '',
                    code: club.code || '',
                    uid: club.uid || '',
                    email: club.email || '',
                    phone: club.phone || '',
                    contactPerson: club.contactPerson || '',
                    address: club.address || '',
                    city: club.city || '',
                    pincode: club.pincode || '',
                    establishedYear: club.establishedYear || club.established_year || null,
                    stateId: club.stateId,
                    districtId: club.districtId,
                    registrationNumber: club.registrationNumber || club.registration_number || '',
                    website: club.website || '',
                    logo: club.logo || '',
                });
            } catch {
                setError('Failed to load club details.');
            } finally {
                setLoading(false);
            }
        })();
    }, [token, id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await api.put(`/clubs/${id}`, form);
            setSuccess('Club updated successfully!');
            setTimeout(() => router.push('/dashboard/clubs'), 1500);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update club.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const field = (label: string, name: string, icon: React.ReactNode, type = 'text', disabled = false) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
                <input
                    type={type}
                    name={name}
                    value={(form as any)[name] ?? ''}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard/clubs" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Club</h1>
                    <p className="text-sm text-gray-500">UID: {form.uid}</p>
                </div>
            </div>

            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                </motion.div>
            )}
            {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" /> {success}
                </motion.div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" /> Club Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {field('Club Name', 'name', <Shield className="w-4 h-4" />)}
                        {field('Club Code', 'code', <Hash className="w-4 h-4" />, 'text', true)}
                        {field('Registration Number', 'registrationNumber', <FileText className="w-4 h-4" />)}
                        {field('Contact Person', 'contactPerson', <User className="w-4 h-4" />)}
                        {field('Email', 'email', <Mail className="w-4 h-4" />, 'email')}
                        {field('Phone', 'phone', <Phone className="w-4 h-4" />, 'tel')}
                        {field('Address', 'address', <MapPin className="w-4 h-4" />)}
                        {field('City', 'city', <MapPin className="w-4 h-4" />)}
                        {field('Pincode', 'pincode', <Hash className="w-4 h-4" />)}
                        {field('Established Year', 'establishedYear', <Calendar className="w-4 h-4" />, 'number')}
                        {field('Website', 'website', <Globe className="w-4 h-4" />, 'url')}
                        {field('Logo URL', 'logo', <Globe className="w-4 h-4" />, 'url')}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Link href="/dashboard/clubs" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
