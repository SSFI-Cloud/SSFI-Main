'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This page redirects to the main registration portal at /register
 * The /register page shows all available registration types with their status
 */
export default function AuthRegisterRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/register');
    }, [router]);

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Redirecting to Registration Portal...</p>
            </div>
        </div>
    );
}
