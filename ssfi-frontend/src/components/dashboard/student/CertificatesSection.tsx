'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Medal } from 'lucide-react';
import { certificateService } from '@/services/certificate.service';
import toast from 'react-hot-toast';

export default function CertificatesSection() {
    const [certificates, setCertificates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const data = await certificateService.getMyCertificates();
                // @ts-ignore
                setCertificates(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to load certificates', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCertificates();
    }, []);

    // Helper for medal colors
    const getMedalColor = (pos: number) => {
        switch (pos) {
            case 1: return 'text-yellow-400 drop-shadow-lg'; // Gold
            case 2: return 'text-gray-700 drop-shadow-md';   // Silver
            case 3: return 'text-orange-600 drop-shadow-md';  // Bronze
            default: return 'text-emerald-600/50';               // Participation
        }
    };

    const handleDownload = async (cert: any) => {
        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1';
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE}/certificates/${cert.id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SSFI_Certificate_${cert.certificateNumber || cert.id}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Certificate downloaded!');
        } catch {
            toast.error('Failed to download certificate. Please try again.');
        }
    };

    if (isLoading) return <div className="p-4 text-center text-gray-600">Loading certificates...</div>;

    const medals = certificates.filter(c => typeof c.position === 'number');
    if (medals.length === 0) return null; // Don't show if empty

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6"
        >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                My Achievements & Certificates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.filter(c => typeof c.position === 'number').map((cert) => (
                    <div key={cert.id} className="bg-[#f5f6f8]/50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{cert.eventDate ? new Date(cert.eventDate).getFullYear() : '2024'}</p>
                            <h3 className="font-bold text-gray-900 text-lg">{cert.eventName}</h3>
                            <p className="text-sm text-gray-700 flex items-center gap-1 mt-1">
                                {cert.position && typeof cert.position === 'number' ? (
                                    <>
                                        <Medal className={`w-4 h-4 ${getMedalColor(cert.position)}`} />
                                        <span className={getMedalColor(cert.position).split(' ')[0]}>
                                            {cert.position === 1 ? 'Gold Winner' : cert.position === 2 ? 'Silver Winner' : 'Bronze Winner'}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-gray-600">Participant</span>
                                )}
                            </p>
                        </div>

                        <button
                            onClick={() => handleDownload(cert)}
                            title="Download Certificate"
                            className="p-3 bg-white hover:bg-gray-100 text-emerald-600 rounded-lg transition-colors border border-gray-100 shadow-sm"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
