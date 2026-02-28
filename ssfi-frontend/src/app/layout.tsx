import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Syne } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-headline',
  display: 'swap',
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
  authors: [{ name: 'Speed Skating Federation of India', url: BASE_URL }],
  creator: 'SSFI',
  publisher: 'Speed Skating Federation of India',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
        url: `${BASE_URL}/images/og/og-default.jpg`,
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
    images: [`${BASE_URL}/images/og/og-default.jpg`],
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
      <body
        className={`${plusJakartaSans.variable} ${syne.variable} font-body bg-dark-900 text-white min-h-screen flex flex-col`}
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
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
