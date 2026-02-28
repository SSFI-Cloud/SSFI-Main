'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Calendar,
    MapPin,
    AlertCircle,
    ChevronLeft,
    Phone,
    Download,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { portalService } from '@/services/portal.service';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

export default function MyEventRegistrationPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const [registration, setRegistration] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRegistration = async () => {
            if (!token || !params.id) return;

            try {
                setIsLoading(true);
                const data = await portalService.getMyRegistration(Number(params.id), token);
                setRegistration(data);
            } catch (err: any) {
                console.error('Error fetching registration:', err);
                setError(err.message || 'Failed to load registration details');
                toast.error('Failed to load details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRegistration();
    }, [params.id, token]);

    const handleDownload = async () => {
        const ticketElement = document.getElementById('ticket-content');
        if (!ticketElement) return;

        try {
            setIsDownloading(true);
            const canvas = await html2canvas(ticketElement, {
                scale: 2, // Higher quality
                backgroundColor: '#ffffff',
                useCORS: true // For images
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `${registration.event.name.replace(/\s+/g, '-')}-Ticket.png`;
            link.click();
            toast.success('Ticket downloaded successfully!');
        } catch (err) {
            console.error('Download failed:', err);
            toast.error('Failed to download ticket');
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !registration) {
        return (
            <div className="min-h-screen bg-[#f5f6f8] flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Not Found</h2>
                <p className="text-gray-500 mb-6">{error || "We couldn't find your registration for this event."}</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const { event, student, payment } = registration;

    // Bib Number Logic: Extract last part of ID and prepend 'S'
    // Example: SSFI-TN-CHE-TSC-ST-0001 -> 0001 -> S0001
    const lastIdPart = student.membershipId ? student.membershipId.split('-').pop() : '';
    const bibNumber = lastIdPart ? `S${lastIdPart}` : 'PENDING';

    // QR Code Data
    const qrData = JSON.stringify({
        eventId: event.id,
        eventName: event.name,
        studentId: student.id,
        membershipId: student.membershipId,
        studentName: student.name,
        bibNumber: bibNumber,
        registrationId: registration.id
    });

    return (
        <div className="min-h-screen bg-[#f5f6f8] pb-20 pt-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-400 border border-green-500/30">
                        Confirmed Ticket
                    </span>
                </div>

                {/* Ticket Card */}
                <motion.div
                    id="ticket-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-2xl relative"
                >
                    {/* Top Section (Event Details) */}
                    <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <h1 className="text-2xl md:text-3xl font-bold mb-4 relative z-10">{event.name}</h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-blue-200 mt-1" />
                                <div>
                                    <p className="text-blue-100 text-sm">Date & Time</p>
                                    <p className="font-semibold text-lg">
                                        {new Date(event.eventDate).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-blue-100">
                                        {new Date(event.eventDate).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-blue-200 mt-1" />
                                <div>
                                    <p className="text-blue-100 text-sm">Venue</p>
                                    <p className="font-semibold text-lg">{event.venue}</p>
                                    <p className="text-blue-100">{event.city}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section (Student Details) */}
                    <div className="p-8 bg-slate-50">
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                            {/* QR Code */}
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
                                <div style={{ height: "auto", margin: "0 auto", maxWidth: 128, width: "100%" }}>
                                    <QRCode
                                        size={256}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        value={qrData}
                                        viewBox={`0 0 256 256`}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Participant Name</p>
                                    <p className="font-bold text-lg text-gray-900">{student.name}</p>
                                    <p className="text-sm text-gray-600 font-mono">{student.membershipId}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Bib Number</p>
                                    <p className="font-bold text-2xl text-gray-900 font-mono tracking-wider">
                                        {bibNumber}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Skate Category</p>
                                    <p className="font-semibold text-gray-900">{registration.skateCategory}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Races</p>
                                    <div className="flex flex-wrap gap-1">
                                        {registration.selectedRaces?.map((race: string) => (
                                            <span key={race} className="px-2 py-0.5 bg-slate-200 text-gray-700 text-xs rounded font-medium">
                                                {race.replace('RACE_', '').replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section (Organizer Info) */}
                    <div className="p-6 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <div className="flex items-center gap-4 text-gray-600">
                            <div>
                                <p className="font-medium text-gray-900">Organizer: {event.associationName || 'SSFI'}</p>
                                <p className="flex items-center gap-2 mt-1">
                                    <Phone className="w-3 h-3" /> Contact Support
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isDownloading ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isDownloading ? 'Downloading...' : 'Download Ticket'}
                        </button>
                    </div>

                    {/* Dashed Line Decoration */}
                    <div className="absolute top-[35%] -left-3 w-6 h-6 bg-[#f5f6f8] rounded-full" />
                    <div className="absolute top-[35%] -right-3 w-6 h-6 bg-[#f5f6f8] rounded-full" />
                    <div className="absolute top-[35%] left-4 right-4 border-t-2 border-dashed border-slate-300/50" />
                </motion.div>

                <p className="text-center text-gray-600 text-sm mt-8">
                    Please show this digital ticket or a printed copy at the event entry.
                </p>
            </div>
        </div>
    );
}
