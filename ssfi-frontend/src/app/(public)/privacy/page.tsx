import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the SSFI Privacy Policy to understand how we collect, use, and safeguard your personal information on ssfiskate.com.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy | SSFI',
    description: 'How SSFI collects, uses, and protects your personal information.',
    url: '/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-28 pb-16">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Privacy Policy', url: '/privacy' },
        ]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-slate-900/50 rounded-2xl border border-white/10 p-8 md:p-12 backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-white mb-8 border-b border-white/10 pb-6">
            Privacy Policy
          </h1>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p>
                Welcome to the Speed Skating Federation of India (SSFI). We are committed to
                protecting your privacy and ensuring transparency in how we handle your personal
                information. This Privacy Policy outlines how we collect, use, and safeguard your
                data when you visit our website{' '}
                <span className="text-blue-400">www.ssfiskate.com</span> or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              <p className="mb-4">We may collect the following types of information:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Personal Information:</strong> Name, email address, phone number, date of
                  birth, and address provided during registration or inquiry.
                </li>
                <li>
                  <strong>Usage Data:</strong> Information about how you interact with our website,
                  such as IP address, browser type, and pages visited.
                </li>
                <li>
                  <strong>Payment Information:</strong> Transaction details when you register for
                  events or pay membership fees (processed securely via third-party gateways).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="mb-4">We use your data for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To process registrations for memberships, clubs, and events.</li>
                <li>To communicate important updates, event schedules, and newsletters.</li>
                <li>To improve our website functionality and user experience.</li>
                <li>To comply with legal obligations and ensure the safety of our platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                4. Data Sharing and Security
              </h2>
              <p>
                We do not sell or rent your personal information to third parties. We may share data
                with trusted service providers (e.g., payment processors) only as necessary to
                provide our services. We implement strict security measures to protect your data from
                unauthorized access, alteration, or disclosure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
              <p>
                You have the right to access, correct, or request the deletion of your personal
                data. If you have any concerns or wish to exercise these rights, please contact us
                using the information below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="bg-slate-800/50 p-6 rounded-lg border border-white/5">
                <p className="mb-2">
                  <strong className="text-white">Email:</strong> info@ssfiskate.com
                </p>
                <p className="mb-2">
                  <strong className="text-white">Phone:</strong> +91 96006 35806 / +91 98944 87268
                </p>
                <p>
                  <strong className="text-white">Address:</strong> P-12 Porkudil Nagar, Podumbhu -
                  625018, Madurai, Tamilnadu, India
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
