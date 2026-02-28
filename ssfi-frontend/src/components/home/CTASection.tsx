'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Users, Trophy, Calendar } from 'lucide-react';
import { MovingBorderButton } from '@/components/ui/MovingBorderButton';

export default function CTASection() {
    const features = [
        { icon: Users, label: '50,000+ Members', color: 'text-primary-400' },
        { icon: Trophy, label: '100+ Championships', color: 'text-accent-gold' },
        { icon: Calendar, label: '200+ Events/Year', color: 'text-accent-cyan' },
    ];

    return (
        <section className="py-20 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-900 to-accent-cyan/10" />

            {/* Decorative elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
                    >
                        <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                        <span className="text-sm text-primary-400 font-medium">Registration Open for 2026</span>
                    </motion.div>

                    {/* Main heading */}
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                        Ready to
                        <span className="gradient-text"> Start Your Journey</span>
                        ?
                    </h2>

                    <p className="text-lg md:text-xl text-dark-400 mb-10 max-w-2xl mx-auto">
                        Join the Skating Sports Federation of India and become part of a community
                        dedicated to excellence in skating sports.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap justify-center gap-4 mb-10">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full glass"
                            >
                                <feature.icon className={`w-5 h-5 ${feature.color}`} />
                                <span className="text-white font-medium">{feature.label}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <MovingBorderButton
                            href="/register"
                            className="px-8 py-4 text-lg"
                            containerClassName="min-w-[200px]"
                        >
                            Register Now
                            <ArrowRight className="w-5 h-5" />
                        </MovingBorderButton>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link href="/about" className="btn-secondary inline-flex items-center gap-2 text-lg">
                                Learn More
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Bottom decoration */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="mt-16 flex justify-center"
                >
                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent rounded-full" />
                </motion.div>
            </div>
        </section>
    );
}
