import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description:
    'SSFI refund and cancellation policy for membership fees, event registrations, and payment transactions on ssfiskate.com.',
  alternates: { canonical: '/refund' },
  openGraph: {
    title: 'Refund & Cancellation Policy | SSFI',
    description: 'SSFI refund policy for memberships and event registrations.',
    url: '/refund',
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-28 pb-16">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Refund Policy', url: '/refund' },
        ]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-slate-900/50 rounded-2xl border border-white/10 p-8 md:p-12 backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-white mb-8 border-b border-white/10 pb-6">
            Refund and Cancellation Policy
          </h1>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. General Policy</h2>
              <p>
                The Speed Skating Federation of India (SSFI) strives to ensure a fair and
                transparent process for all transactions made through{' '}
                <span className="text-blue-400">www.ssfiskate.com</span>. Please read this policy
                carefully before making any payments.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Membership Fees</h2>
              <p>
                Membership fees for Student, Club, District, and State registrations are generally{' '}
                <strong>non-refundable</strong> once processed. This is because membership benefits
                and administrative processing commence immediately upon registration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Event Registration</h2>
              <p className="mb-4">
                Refunds for event registrations are subject to the specific rules of each event. In
                general:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Cancellations by Participant:</strong> Cancellations made 7 days or more
                  before the event start date may be eligible for a partial refund, subject to a
                  processing fee. No refunds will be issued for cancellations made within 7 days of
                  the event.
                </li>
                <li>
                  <strong>Event Cancellation:</strong> If an event is cancelled by SSFI due to
                  unforeseen circumstances, a full refund of the registration fee will be processed
                  to the original payment method.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Processing Refunds</h2>
              <p>
                Approved refunds will be processed within 5-7 business days. The amount will be
                credited back to the original method of payment used during the transaction (e.g.,
                credit card, debit card, or bank account).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Contact Validation</h2>
              <p>
                If you believe a charge was made in error or if you have issues with a refund,
                please contact our support team immediately with your transaction details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Contact Us</h2>
              <p className="mb-4">For any refund-related queries, please reach out to us at:</p>
              <div className="bg-slate-800/50 p-6 rounded-lg border border-white/5">
                <p className="mb-2">
                  <strong className="text-white">Email:</strong> info@ssfiskate.com
                </p>
                <p className="mb-2">
                  <strong className="text-white">Phone:</strong> +91 96006 35806
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
