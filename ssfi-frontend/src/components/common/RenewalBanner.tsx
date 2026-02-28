'use client';

import { X, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RenewalBannerProps {
    expiryDate: Date | string | null;
    daysUntilExpiry: number;
    userRole: string;
    onRenew?: () => void;
}

export const RenewalBanner: React.FC<RenewalBannerProps> = ({
    expiryDate,
    daysUntilExpiry,
    userRole,
    onRenew
}) => {
    const [isDismissed, setIsDismissed] = useState(false);

    // Check if banner was dismissed today
    useEffect(() => {
        const dismissedDate = localStorage.getItem('renewal-banner-dismissed');
        if (dismissedDate) {
            const dismissed = new Date(dismissedDate);
            const today = new Date();
            if (dismissed.toDateString() === today.toDateString()) {
                setIsDismissed(true);
            }
        }
    }, []);

    const handleDismiss = () => {
        const today = new Date().toISOString();
        localStorage.setItem('renewal-banner-dismissed', today);
        setIsDismissed(true);
    };

    if (!expiryDate || daysUntilExpiry <= 0 || isDismissed) {
        return null;
    }

    // Determine urgency level and colors
    const getUrgencyConfig = () => {
        if (daysUntilExpiry <= 7) {
            return {
                bg: 'bg-red-50 dark:bg-red-950/20',
                border: 'border-red-200 dark:border-red-800',
                text: 'text-red-900 dark:text-red-100',
                icon: 'text-red-600 dark:text-red-400',
                accentBg: 'bg-red-600',
                accentHover: 'hover:bg-red-700'
            };
        } else if (daysUntilExpiry <= 15) {
            return {
                bg: 'bg-orange-50 dark:bg-orange-950/20',
                border: 'border-orange-200 dark:border-orange-800',
                text: 'text-orange-900 dark:text-orange-100',
                icon: 'text-orange-600 dark:text-orange-400',
                accentBg: 'bg-orange-600',
                accentHover: 'hover:bg-orange-700'
            };
        } else {
            return {
                bg: 'bg-yellow-50 dark:bg-yellow-950/20',
                border: 'border-yellow-200 dark:border-yellow-800',
                text: 'text-yellow-900 dark:text-yellow-100',
                icon: 'text-yellow-600 dark:text-yellow-400',
                accentBg: 'bg-yellow-600',
                accentHover: 'hover:bg-yellow-700'
            };
        }
    };

    const config = getUrgencyConfig();
    const formattedDate = expiryDate
        ? new Date(expiryDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
        : 'N/A';

    return (
        <div className={`relative rounded-lg border-2 ${config.border} ${config.bg} p-4 mb-6 shadow-sm`}>
            <button
                onClick={handleDismiss}
                className={`absolute top-3 right-3 ${config.text} opacity-50 hover:opacity-100 transition-opacity`}
                aria-label="Dismiss notification"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 ${config.icon}`}>
                    <AlertTriangle className="h-6 w-6" />
                </div>

                <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${config.text} mb-1`}>
                        Membership Renewal Required
                    </h3>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className={`h-4 w-4 ${config.icon}`} />
                            <p className={`text-sm ${config.text}`}>
                                {daysUntilExpiry === 1
                                    ? 'Your membership expires tomorrow!'
                                    : `Your membership expires in ${daysUntilExpiry} days`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className={`h-4 w-4 ${config.icon}`} />
                            <p className={`text-sm ${config.text}`}>
                                Expiry Date: <span className="font-medium">{formattedDate}</span>
                            </p>
                        </div>

                        <p className={`text-sm ${config.text} mt-2`}>
                            Please renew your membership to continue accessing all features and participating in events.
                            {userRole !== 'STUDENT' && ' Contact the Global Admin for renewal or payment options.'}
                        </p>
                    </div>

                    {onRenew && (
                        <button
                            onClick={onRenew}
                            className={`mt-4 px-4 py-2 ${config.accentBg} ${config.accentHover} text-white font-medium rounded-md transition-colors`}
                        >
                            Renew Now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RenewalBanner;
