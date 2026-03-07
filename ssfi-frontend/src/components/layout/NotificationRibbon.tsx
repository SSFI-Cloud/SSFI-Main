'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Bell } from 'lucide-react';
import { api } from '@/lib/api/client';
import Link from 'next/link';

interface Notification {
  id: string;
  message: string;
  link?: string;
  type?: 'info' | 'warning' | 'success';
}

export default function NotificationRibbon() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const ribbonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const res = await api.get('/notifications/public/active');
        const data = res.data?.data;
        if (data && (Array.isArray(data) ? data.length > 0 : data.message)) {
          setNotification(Array.isArray(data) ? data[0] : data);
        }
      } catch {
        // No active notification — ribbon stays hidden
      }
    };
    fetchNotification();
  }, []);

  // Update CSS variable for layout offset
  useEffect(() => {
    const updateHeight = () => {
      const h = !dismissed && notification && ribbonRef.current
        ? ribbonRef.current.offsetHeight
        : 0;
      document.documentElement.style.setProperty('--ribbon-h', `${h}px`);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.setProperty('--ribbon-h', '0px');
    };
  }, [notification, dismissed]);

  if (!notification || dismissed) return null;

  return (
    <div
      ref={ribbonRef}
      className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm shadow-md"
    >
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <Bell className="w-4 h-4 flex-shrink-0" />
        <p className="text-center font-medium truncate">
          {notification.link ? (
            <Link href={notification.link} className="hover:underline">
              {notification.message}
            </Link>
          ) : (
            notification.message
          )}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
