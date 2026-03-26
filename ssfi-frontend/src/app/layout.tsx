import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Syne, Barlow_Condensed } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-headline',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-hero',
  display: 'optional',  // Don't block render for decorative hero font
});

import ScrollNavigation from '@/components/ui/ScrollNavigation';
import { Toaster } from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ssfiskate.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1628' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'SSFI - Speed Skating Federation of India | Official Website',
    template: '%s | SSFI - Speed Skating Federation of India',
  },
  description:
    'Official website of the Speed Skating Federation of India (SSFI). Register for events, find clubs, view results, and join India\'s premier speed skating community. Est. 2001.',
  keywords: [
    'SSFI',
    'Speed Skating Federation of India',
    'speed skating India',
    'inline skating',
    'roller skating India',
    'skating events India',
    'national skating championship',
    'skating clubs India',
    'skating registration',
    'skating coach certification',
  ],
  authors: [
    { name: 'Speed Skating Federation of India', url: BASE_URL },
    { name: 'Indefine', url: 'https://indefine.in' },
    { name: 'LearnCrew', url: 'https://learncrew.org' },
  ],
  creator: 'SSFI',
  publisher: 'Speed Skating Federation of India',
  other: {
    'designer': 'Lakshmanan Annamalai — Team Indefine (indefine.in)',
    'development-agency': 'Indefine Digital Solutions — indefine.in | learncrew.org',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/images/logo/favicon.webp',
    apple: '/images/logo/favicon.webp',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE_URL,
    siteName: 'SSFI - Speed Skating Federation of India',
    title: 'SSFI - Speed Skating Federation of India',
    description:
      'Official governing body for speed skating in India. Register, compete, and grow with SSFI.',
    images: [
      {
        url: `${BASE_URL}/images/hero/slide-1.webp`,
        width: 1200,
        height: 630,
        alt: 'SSFI - Speed Skating Federation of India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSFI - Speed Skating Federation of India',
    description:
      'Official governing body for speed skating in India. Register, compete, and grow with SSFI.',
    images: [`${BASE_URL}/images/hero/slide-1.webp`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    // Add your verification codes when ready
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="dns-prefetch" href="https://api.ssfiskate.com" />
        <link rel="preconnect" href="https://api.ssfiskate.com" crossOrigin="anonymous" />
        {/* Signature */}
        <meta name="designer" content="Lakshmanan Annamalai — Team Indefine | indefine.in | learncrew.org" />
        <link rel="author" href="https://indefine.in" />
        <link rel="author" href="https://learncrew.org" />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${syne.variable} ${barlowCondensed.variable} font-body bg-dark-900 text-white min-h-screen flex flex-col`}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
        {children}
        <ScrollNavigation />
        {/* Developer signature — hidden */}
        <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
          <span>Designed &amp; Developed by <a href="https://indefine.in" rel="noopener">Indefine Digital Solutions</a> | <a href="https://learncrew.org" rel="noopener">LearnCrew</a></span>
          <span>Lead Developer: Lakshmanan Annamalai | Contact: 9738255304 | <a href="https://www.linkedin.com/in/lakshmanan-annamalai" rel="noopener">LinkedIn</a></span>
          <time dateTime="2026-03">Built March 2026</time>
        </div>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
