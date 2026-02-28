// src/components/layout/Footer.tsx
'use client';

import { Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-dark-900 border-t border-white/10">
      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Image src="/images/logo/light.webp" alt="SSFI" width={80} height={80} className="object-contain" />
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              The official governing body for roller and inline skating sports in India, promoting excellence and growth nationwide.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/ssfi_official?igsh=MXFveXZwMXpxeW9zZQ%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-primary-500 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@SSFIXBharatSkate"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-primary-500 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {['About Us', 'Events', 'Gallery', 'News', 'Contact'].map((link) => (
                <li key={link}>
                  <Link
                    href={link === 'About Us' ? '/about' : `/${link.toLowerCase().replace(' ', '-')}`}
                    className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Members */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6">For Members</h4>
            <ul className="space-y-3">
              {[
                { name: 'Register', href: '/auth/register' },
                { name: 'Login', href: '/auth/login' },
                { name: 'Dashboard', href: '/auth/login' },
                { name: 'Events', href: '/events' },
                { name: 'Certificates', href: '/certificates' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="mailto:info@ssfiskate.com"
                  className="flex items-start gap-3 text-gray-400 hover:text-primary-400 text-sm transition-colors"
                >
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>info@ssfiskate.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+919600635806"
                  className="flex items-start gap-3 text-gray-400 hover:text-primary-400 text-sm transition-colors"
                >
                  <Phone className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>+91 96006 35806 / +91 98944 87268</span>
                </a>
              </li>
              <li>
                <a
                  href="https://maps.app.goo.gl/cMozowyKxZ2AuZSF6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-gray-400 hover:text-primary-400 text-sm transition-colors"
                >
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    P-12 Porkudil Nagar, Podumbhu - 625018,
                    <br />
                    Madurai, Tamilnadu, India
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} SSFI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/refund"
                className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
              >
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer >
  );
};

export default Footer;
