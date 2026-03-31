import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Coming Soon | SSFI - Speed Skating Federation of India',
  description: 'SSFI website is being updated. We will be back soon.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/images/logo/favicon.webp"
            alt="SSFI Logo"
            width={100}
            height={100}
            className="rounded-2xl"
            priority
          />
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-headline tracking-tight">
            Coming Soon
          </h1>
          <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full" />
          <p className="text-lg text-blue-200/80 leading-relaxed">
            We are upgrading the SSFI platform with new features for the upcoming season.
            The website will be live shortly.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-3">
          <p className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">
            Renewal Season 2026
          </p>
          <p className="text-white/70 text-sm">
            Membership renewals, event registrations, and new features coming soon.
            Stay tuned for updates.
          </p>
        </div>

        {/* Contact */}
        <div className="text-white/40 text-sm space-y-1">
          <p>Speed Skating Federation of India</p>
          <p>
            <a href="mailto:info@ssfiskate.com" className="text-blue-400 hover:text-blue-300 transition-colors">
              info@ssfiskate.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
