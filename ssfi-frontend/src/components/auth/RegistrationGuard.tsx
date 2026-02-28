'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle, CalendarClock } from 'lucide-react';
import { motion } from 'framer-motion';

interface RegistrationGuardProps {
    children: React.ReactNode;
    type: 'student' | 'club' | 'district' | 'state';
}

export default function RegistrationGuard({ children, type }: RegistrationGuardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [activeWindow, setActiveWindow] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkActiveWindow = async () => {
            try {
                // Determine API URL - consistent with other components
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
                const response = await axios.get(`${apiUrl}/registration-windows/active/${type}`);

                if (response.data.success && response.data.data) {
                    setActiveWindow(response.data.data);
                } else {
                    setError('No active registration window found');
                }
            } catch (err: any) {
                // If 404, it means no active window (based on my controller logic usually, or just error)
                // My controller returns 404 if not found.
                if (err.response?.status === 404) {
                    setError('Registration is currently closed');
                } else {
                    console.error('Registration check failed', err);
                    setError('Unable to verify registration status. Please try again later.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkActiveWindow();
    }, [type]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Verifying registration status...</p>
                </div>
            </div>
        );
    }

    if (error || !activeWindow) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center"
                >
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarClock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Registration Closed</h2>
                    <p className="text-slate-400 mb-8">
                        {type === 'student' && "Student registration is currently closed."}
                        {type === 'club' && "Club affiliation is currently closed."}
                        {type === 'district' && "District Secretary registration is closed."}
                        {type === 'state' && "State Secretary registration is closed."}
                        {' '}Please check back later or contact administration.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    >
                        Back to Home
                    </a>
                </motion.div>
            </div>
        );
    }

    // Pass the active window data to children if they need it?
    // The children are currently simple components.
    // I can clone children to pass props, but for now just rendering children is enough.
    // The requirement is "window shouldn't open". logic handled.
    return <>{children}</>;
}
