'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, Shield, Users, Zap, X, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';

const impacts = [
  { icon: Users, label: 'Equipment for underprivileged young athletes', color: 'text-emerald-400' },
  { icon: Shield, label: 'Safety gear for skaters across rural India', color: 'text-teal-300' },
  { icon: Zap, label: 'Coaching programs in underserved communities', color: 'text-teal-300' },
];

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function DonationsSection() {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const effectiveAmount = customAmount ? Number(customAmount) : selectedAmount;

  const handleQuickAmount = (amt: number) => {
    setSelectedAmount(amt);
    setCustomAmount('');
  };

  const handleDonateClick = () => {
    if (!effectiveAmount || effectiveAmount < 1) {
      toast.error('Please enter a valid amount');
      return;
    }
    setShowModal(true);
  };

  const handleSubmitDonation = useCallback(async () => {
    if (!donorName.trim() || !donorEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create donation + Razorpay order
      const { data } = await apiClient.post('/donations/donate', {
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        donorPhone: donorPhone.trim() || undefined,
        amount: effectiveAmount,
        message: message.trim() || undefined,
        isAnonymous,
      });

      const { razorpayOrderId, amount: amountPaise, currency, key } = data.data;

      // 2. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway');
        setIsProcessing(false);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key,
        amount: amountPaise,
        currency,
        name: 'SSFI',
        description: 'Donation to Speed Skating Federation of India',
        order_id: razorpayOrderId,
        prefill: {
          name: donorName,
          email: donorEmail,
          contact: donorPhone || '',
        },
        theme: { color: '#10b981' },
        handler: async (response: any) => {
          try {
            await apiClient.post('/donations/donate/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setShowModal(false);
            setShowThankYou(true);
            // Reset form
            setDonorName('');
            setDonorEmail('');
            setDonorPhone('');
            setMessage('');
            setIsAnonymous(false);
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
          setIsProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.error(response.error?.description || 'Payment failed. Please try again.');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate donation');
      setIsProcessing(false);
    }
  }, [donorName, donorEmail, donorPhone, effectiveAmount, message, isAnonymous]);

  return (
    <section className="relative py-0 overflow-hidden">
      <div className="relative py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #080808 0%, #1a1208 40%, #1f0c14 60%, #080808 100%)' }}>

        {/* Ambient glows */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[200px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[180px] pointer-events-none" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Decorative skating SVGs */}
        <svg viewBox="0 0 100 100" className="absolute top-12 left-8 w-24 h-24 opacity-5 text-emerald-400" fill="none">
          <path d="M30 70 Q50 20 70 70" stroke="currentColor" strokeWidth="2" />
          <circle cx="35" cy="75" r="5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="65" cy="75" r="5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg viewBox="0 0 100 100" className="absolute bottom-16 right-10 w-20 h-20 opacity-5 text-teal-400 rotate-12" fill="none">
          <path d="M30 70 Q50 20 70 70" stroke="currentColor" strokeWidth="2" />
          <circle cx="35" cy="75" r="5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="65" cy="75" r="5" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto">

            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* ── Left: Text content ── */}
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>

                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 mb-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center"
                >
                  <Heart className="w-8 h-8 text-emerald-400" fill="currentColor" />
                </motion.div>

                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-emerald-400 text-sm font-medium mb-6" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  Make a Difference
                </span>

                <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-6 tracking-tight leading-tight">
                  Support the Future of{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                    Indian Skating
                  </span>
                </h2>

                <p className="text-lg leading-relaxed mb-8" style={{ color: '#b0a090' }}>
                  Your contribution empowers young athletes across India — directly funding training, equipment, and event sponsorships for underprivileged skaters.
                </p>

                {/* Impact items */}
                <div className="space-y-3 mb-10">
                  {impacts.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="flex items-center gap-3 px-5 py-3.5 rounded-xl border"
                        style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                        <span className="text-sm" style={{ color: '#ddd0c0' }}>{item.label}</span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#8a7a70' }}>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 100% Secure Payment</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Tax Benefits Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Funds go directly to athletes</span>
                </div>
              </motion.div>

              {/* ── Right: Donation card ── */}
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}>
                <div className="relative rounded-3xl overflow-hidden">
                  {/* Gradient border */}
                  <div className="absolute -inset-[1px] bg-gradient-to-br from-emerald-500/50 via-teal-400/30 to-emerald-500/50 rounded-3xl" />

                  <div className="relative rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)' }}>
                    <h3 className="font-headline font-bold text-xl mb-2" style={{ color: '#ffffff' }}>Choose Your Impact</h3>
                    <p className="text-sm mb-6" style={{ color: '#c0b0a0' }}>Every rupee makes a real difference</p>

                    {/* Quick amounts */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => handleQuickAmount(amt)}
                          className={`text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 ${
                            selectedAmount === amt && !customAmount
                              ? 'bg-emerald-500/30 border-emerald-500/60 text-emerald-300'
                              : ''
                          }`}
                          style={selectedAmount === amt && !customAmount ? {} : { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff' }}
                        >
                          ₹{amt.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center"><div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} /></div>
                      <div className="relative flex justify-center"><span className="px-3 text-xs" style={{ background: '#1a1208', color: '#b09070' }}>or enter custom amount</span></div>
                    </div>

                    {/* Custom amount input */}
                    <div className="flex items-center gap-3 mb-6 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <span className="font-semibold" style={{ color: '#10b981' }}>₹</span>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min={1}
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: '#ffffff' }}
                      />
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handleDonateClick}
                      className="group flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-300"
                    >
                      <Heart className="w-5 h-5" fill="currentColor" />
                      Donate ₹{effectiveAmount.toLocaleString('en-IN')}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="text-center text-xs mt-4" style={{ color: '#907060' }}>Secured by Razorpay · 80G Tax Exemption Available</p>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Donation Details Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Donation Details</h3>
                  <p className="text-emerald-400 font-semibold">₹{effectiveAmount.toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Email *</label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Phone (optional)</label>
                  <input
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Message (optional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Leave a message of support..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-400">Make my donation anonymous</span>
                </label>
              </div>

              <button
                onClick={handleSubmitDonation}
                disabled={isProcessing || !donorName.trim() || !donorEmail.trim()}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <><Heart className="w-5 h-5" /> Proceed to Pay ₹{effectiveAmount.toLocaleString('en-IN')}</>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Thank You Modal ── */}
      <AnimatePresence>
        {showThankYou && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
              <p className="text-slate-400 mb-6">
                Your generous donation of <span className="text-emerald-400 font-semibold">₹{effectiveAmount.toLocaleString('en-IN')}</span> will help young athletes across India.
              </p>
              <button
                onClick={() => setShowThankYou(false)}
                className="px-6 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors font-medium"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
