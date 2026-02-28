import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the SSFI Terms of Service governing your use of ssfiskate.com, membership, registration, and event participation.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service | SSFI',
    description: 'Terms governing your use of SSFI website and services.',
    url: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-28 pb-16">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Terms of Service', url: '/terms' },
        ]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-slate-900/50 rounded-2xl border border-white/10 p-8 md:p-12 backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-white mb-8 border-b border-white/10 pb-6">
            Terms of Service
          </h1>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the website{' '}
                <span className="text-blue-400">www.ssfiskate.com</span>, you agree to be bound by
                these Terms of Service. If you do not agree with any part of these terms, please do
                not use our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                2. Membership and Registration
              </h2>
              <p>
                To participate in SSFI events or become a member, you must provide accurate and
                complete information during registration. You are responsible for maintaining the
                confidentiality of your account credentials and for all activities that occur under
                your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Conduct</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Use the website for any unlawful purpose.</li>
                <li>
                  Attempt to gain unauthorized access to any portion of the site or its systems.
                </li>
                <li>Harass, threaten, or intimidate other users or SSFI staff.</li>
                <li>
                  Upload malicious code or interfere with the proper working of the website.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                4. Intellectual Property
              </h2>
              <p>
                All content on this website, including text, graphics, logos, and images, is the
                property of the Speed Skating Federation of India (SSFI) or its licensors and is
                protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                5. Limitation of Liability
              </h2>
              <p>
                SSFI shall not be liable for any indirect, incidental, special, or consequential
                damages arising out of or in connection with your use of our website or services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Your continued use of the
                website following any changes indicates your acceptance of the new Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Contact Information</h2>
              <p className="mb-4">For any questions regarding these Terms, please contact us:</p>
              <div className="bg-slate-800/50 p-6 rounded-lg border border-white/5">
                <p className="mb-2">
                  <strong className="text-white">Email:</strong> info@ssfiskate.com
                </p>
                <p className="mb-2">
                  <strong className="text-white">Phone:</strong> +91 96006 35806
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
