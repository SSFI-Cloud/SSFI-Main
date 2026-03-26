// src/components/layout/Footer.tsx
'use client';

import { useState } from 'react';
import { Instagram, Youtube, Mail, Phone, MapPin, Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="relative">
      {/* ── CTA Section with background image ── */}
      <section className="relative h-[480px] md:h-[540px] overflow-hidden">
        <Image
          src="/images/footer.webp"
          alt="SSFI Speed Skater"
          fill
          className="object-cover"
          style={{ objectPosition: '50% 30%' }}
          sizes="100vw"
          quality={85}
        />
        {/* Gradient overlay: bright top → dark bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/40 to-gray-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/30 to-transparent" />

        <div className="relative z-10 h-full flex items-end pb-16 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-white mb-4 max-w-lg leading-tight">
              Ready to Hit the Rink?
            </h2>
            <p className="text-white/60 text-base md:text-lg max-w-md mb-6">
              Join thousands of skaters across India. Your skating journey starts here.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Register Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all duration-300"
              >
                View Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Footer ── */}
      <div className="bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

            {/* Col 1 — Brand + Newsletter */}
            <div className="sm:col-span-2 lg:col-span-4">
              <div className="mb-4">
                <Image src="/images/logo/logo-wide.webp" alt="Speed Skating Federation of India" width={180} height={60} className="object-contain" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                The official governing body for speed skating in India, promoting excellence and growth nationwide since 2001.
              </p>

              {/* Newsletter */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Stay Updated</h4>
                <p className="text-gray-500 text-xs mb-3">Get event updates & news delivered to your inbox.</p>
                <form onSubmit={handleSubscribe} className="flex gap-0">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 min-w-0 px-4 py-2.5 bg-white/5 border border-white/10 rounded-l-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-r-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center"
                    aria-label="Subscribe"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                {subscribed && (
                  <p className="text-emerald-400 text-xs mt-2 animate-pulse">Thanks for subscribing!</p>
                )}
              </div>

              {/* Socials */}
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/ssfi_official?igsh=MXFveXZwMXpxeW9zZQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-emerald-500 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://www.youtube.com/@SSFIXBharatSkate" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-emerald-500 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Col 2 — Navigation */}
            <div className="lg:col-span-2">
              <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-5">Navigation</h4>
              <ul className="space-y-3">
                {[
                  { name: 'Home', href: '/' },
                  { name: 'About', href: '/about' },
                  { name: 'Events', href: '/events' },
                  { name: 'Results', href: '/results' },
                  { name: 'Gallery', href: '/gallery' },
                  { name: 'State Directory', href: '/state-directory' },
                  { name: 'News', href: '/news' },
                  { name: 'Contact', href: '/contact' },
                ].map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Programs */}
            <div className="lg:col-span-2">
              <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-5">Programs</h4>
              <ul className="space-y-3">
                {[
                  { name: 'Register', href: '/auth/register' },
                  { name: 'Coach Certification', href: '/affiliated-coaches' },
                  { name: 'Beginner Program', href: '/beginner-program' },
                  { name: 'Dashboard', href: '/auth/login' },
                  { name: 'Certificates', href: '/auth/login' },
                ].map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Legal */}
            <div className="lg:col-span-2">
              <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-5">Legal</h4>
              <ul className="space-y-3">
                {[
                  { name: 'Privacy Policy', href: '/privacy' },
                  { name: 'Terms of Service', href: '/terms' },
                  { name: 'Refund Policy', href: '/refund' },
                ].map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 5 — Contact */}
            <div className="lg:col-span-2">
              <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-5">Get in Touch</h4>
              <ul className="space-y-4">
                <li>
                  <a href="mailto:info@ssfiskate.com" className="flex items-start gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                    <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>info@ssfiskate.com</span>
                  </a>
                </li>
                <li>
                  <a href="tel:+919600635806" className="flex items-start gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                    <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>+91 96006 35806</span>
                  </a>
                </li>
                <li>
                  <a href="https://maps.app.goo.gl/cMozowyKxZ2AuZSF6" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Madurai, Tamil Nadu, India</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                &copy; {currentYear} Speed Skating Federation of India. All rights reserved.
              </p>
              <p className="text-xs text-gray-600">
                Designed by{' '}
                <a href="https://indefine.in" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  Team Indefine
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* ── Large SSFI watermark ── */}
        <div className="relative overflow-hidden h-32 sm:h-40 md:h-52">
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
            <span className="text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] font-headline font-black text-white/[0.03] leading-none tracking-tighter whitespace-nowrap">
              S.S.F.I
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
