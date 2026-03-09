'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Bell } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface Notification {
  id: string;
  message: string;
  link?: string;
  type?: 'info' | 'warning' | 'success';
}

const ROTATE_INTERVAL = 4000; // ms between notifications

export default function NotificationRibbon() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const ribbonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_BASE}/notifications/public/active`, { timeout: 5000 });
        const data = res.data?.data;
        if (!data) return;
        // Support both array and single object
        const items = Array.isArray(data) ? data : data.message ? [data] : [];
        if (items.length > 0) setNotifications(items);
      } catch {
        // No active notifications — ribbon stays hidden
      }
    };
    fetchNotifications();
  }, []);

  // Auto-rotate through notifications
  useEffect(() => {
    if (notifications.length <= 1) return;
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % notifications.length);
        setIsAnimating(false);
      }, 300); // matches CSS transition
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [notifications.length]);

  // Update CSS variable for layout offset
  const updateHeight = useCallback(() => {
    const h = !dismissed && notifications.length > 0 && ribbonRef.current
      ? ribbonRef.current.offsetHeight
      : 0;
    document.documentElement.style.setProperty('--ribbon-h', `${h}px`);
  }, [notifications.length, dismissed]);

  useEffect(() => {
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.setProperty('--ribbon-h', '0px');
    };
  }, [updateHeight]);

  if (notifications.length === 0 || dismissed) return null;

  const current = notifications[currentIdx];

  return (
    <div
      ref={ribbonRef}
      className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm shadow-md"
    >
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <Bell className="w-4 h-4 flex-shrink-0 animate-pulse" />

        <div className="relative overflow-hidden flex-1 text-center min-h-[1.25rem]">
          <p
            className={`font-medium truncate transition-all duration-300 ${
              isAnimating ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
            }`}
          >
            {current.link ? (
              <Link href={current.link} className="hover:underline">
                {current.message}
              </Link>
            ) : (
              current.message
            )}
          </p>
        </div>

        {/* Dot indicators for multiple notifications */}
        {notifications.length > 1 && (
          <div className="flex gap-1 flex-shrink-0">
            {notifications.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIdx ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

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
