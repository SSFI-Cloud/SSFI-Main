'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Building2, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';

interface Department { name: string; email: string; phone?: string; }
interface SiteSettings {
  contactPhone?: string;
  contactPhone2?: string;
  contactEmail?: string;
  address?: string;
  metadata?: {
    officeHours?: { weekdays?: string; saturday?: string };
    departments?: Department[];
    mapEmbedUrl?: string;
    phone2?: string;
  };
}

const FALLBACK_DEPARTMENTS: Department[] = [
  { name: 'General Enquiries', email: 'info@ssfiskate.com', phone: '+91 XXXXX XXXXX' },
  { name: 'Event Registration', email: 'events@ssfiskate.com', phone: '+91 XXXXX XXXXX' },
  { name: 'Coaching & Certification', email: 'coaching@ssfiskate.com', phone: '+91 XXXXX XXXXX' },
  { name: 'Media & Press', email: 'media@ssfiskate.com', phone: '+91 XXXXX XXXXX' },
];

const CARD_COLORS: Record<string, { gradient: string; bg: string; border: string }> = {
  emerald: { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  violet: { gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', border: 'border-violet-100' },
  sky: { gradient: 'from-sky-500 to-blue-500', bg: 'bg-sky-50', border: 'border-sky-100' },
  amber: { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-100' },
};

interface ContactPageClientProps {
  initialSettings: SiteSettings | null;
}

export default function ContactPageClient({ initialSettings }: ContactPageClientProps) {
  const settings = initialSettings;
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phone1 = settings?.contactPhone || '+91 XXXXX XXXXX';
  const phone2 = settings?.metadata?.phone2 || settings?.contactPhone2 || '';
  const email = settings?.contactEmail || 'info@ssfiskate.com';
  const address = settings?.address || 'SSFI National Office, Chennai, Tamil Nadu, India';
  const weekdays = settings?.metadata?.officeHours?.weekdays || 'Mon – Fri: 9 AM – 6 PM';
  const saturday = settings?.metadata?.officeHours?.saturday || 'Sat: 10 AM – 2 PM';
  const departments = (settings?.metadata?.departments?.length ? settings.metadata.departments : FALLBACK_DEPARTMENTS);
  const mapUrl = settings?.metadata?.mapEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248849.84916296526!2d80.04419748372182!3d13.047325953744937!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5265ea4f7d3361%3A0x6e61a70b6863d433!2sChennai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1679298123456!5m2!1sen!2sin';

  const contactCards = [
    { icon: MapPin, title: 'Visit Us', details: [address], color: 'emerald' },
    { icon: Phone, title: 'Call Us', details: [phone1, phone2].filter(Boolean), color: 'violet' },
    { icon: Mail, title: 'Email Us', details: [email], color: 'sky' },
    { icon: Clock, title: 'Office Hours', details: [weekdays, saturday], color: 'amber' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/contact/submit', formData);
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 shadow-sm text-sm';

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50]">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end">
            <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex-1 pt-28 pb-16 md:pt-36 md:pb-20">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6">
                <MessageCircle className="w-4 h-4" /> Get in Touch
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-5">
                Contact{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Us</span>
              </h1>
              <p className="text-white/50 text-lg md:text-xl max-w-xl">Have questions about events, registration, or coaching? We&apos;re here to help.</p>
            </motion.div>
            <div className="hidden lg:block lg:w-[400px] xl:w-[460px] flex-shrink-0 self-end relative">
              <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-violet-500/8 via-transparent to-transparent blur-3xl pointer-events-none" />
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                <motion.div animate={{ y: [0, -20, 0], rotate: [-0.5, 1.5, -0.5] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} style={{ filter: 'drop-shadow(0 40px 55px rgba(0,0,0,0.55)) drop-shadow(0 12px 24px rgba(139,92,246,0.3))' }}>
                  <div className="relative w-full h-[420px] xl:h-[460px]">
                    <Image src="/images/mascot/13.webp" alt="SSFI Mascot" fill className="object-contain object-bottom" sizes="460px" priority />
                  </div>
                </motion.div>
                <div className="mx-auto w-36 h-4 rounded-full -mt-2" style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.3) 0%, transparent 70%)' }} />
              </motion.div>
            </div>
          </div>
        </div>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
      </section>

      {/* CONTACT CARDS */}
      <section className="py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactCards.map((c, i) => {
              const cc = CARD_COLORS[c.color];
              return (
                <motion.div key={c.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cc.gradient} flex items-center justify-center mb-4 shadow-md`}>
                    <c.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-gray-900 font-bold mb-2">{c.title}</h3>
                  <div className="space-y-0.5">{c.details.map((d, j) => <p key={j} className="text-gray-400 text-sm">{d}</p>)}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="pb-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 md:p-9">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Send a Message</h2>
                <p className="text-gray-400 text-sm mb-7">Fill in the form below and we&apos;ll get back to you within 24 hours.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Full Name *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputBase} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputBase} placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Phone</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputBase} placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Subject *</label>
                      <select name="subject" value={formData.subject} onChange={handleChange} required className={`${inputBase} appearance-none cursor-pointer`}>
                        <option value="">Select a subject</option>
                        <option value="general">General Enquiry</option>
                        <option value="events">Event Registration</option>
                        <option value="coaching">Coaching & Certification</option>
                        <option value="partnership">Partnership</option>
                        <option value="media">Media & Press</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Message *</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} required rows={5} className={`${inputBase} resize-none`} placeholder="Tell us what you need help with…" />
                  </div>
                  <button type="submit" disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl text-white font-bold text-base shadow-lg shadow-emerald-200/40 hover:shadow-emerald-300/50 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100 transition-all duration-300">
                    {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Sending…</>) : (<><Send className="w-5 h-5" />Send Message</>)}
                  </button>
                </form>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-gray-900">Department Contacts</h3>
                </div>
                <div className="p-4 space-y-2.5">
                  {departments.map((dept, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-emerald-200 transition-all">
                      <h4 className="text-gray-900 text-sm font-bold mb-2">{dept.name}</h4>
                      <a href={`mailto:${dept.email}`} className="flex items-center gap-2 text-gray-400 text-xs hover:text-emerald-600 transition-colors mb-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />{dept.email}
                      </a>
                      {dept.phone && (
                        <a href={`tel:${dept.phone}`} className="flex items-center gap-2 text-gray-400 text-xs hover:text-emerald-600 transition-colors">
                          <Phone className="w-3 h-3 flex-shrink-0" />{dept.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="h-[250px] relative">
                  <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <a href="https://maps.google.com/?q=Chennai,+Tamil+Nadu" target="_blank" rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg text-xs text-gray-600 hover:text-emerald-600 transition-colors shadow-sm">
                  <ExternalLink className="w-3 h-3" /> Open in Maps
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
