'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Ticket, Trophy } from 'lucide-react';

const eventCategories = [
    {
        id: 'national',
        title: 'National Events',
        subtitle: 'COMPETE AT THE HIGHEST LEVEL',
        description: 'Join national championships and represent your state on the biggest stage. Compete against the best athletes from across the country.',
        image: '/images/events/national-event.webp',
        href: '/events?level=national',
        // Amber/Orange Theme
        cardGradient: 'from-amber-500/90 to-orange-600/90',
        shadowColor: 'shadow-orange-500/30',
        accentColor: 'text-amber-100',
        buttonColor: 'bg-white text-orange-600 hover:bg-orange-50',
    },
    {
        id: 'state',
        title: 'State Events',
        subtitle: 'STATE CHAMPIONSHIPS',
        description: 'Compete in state-level championships and qualify for nationals. Showcase your talent and earn your spot in the state team.',
        image: '/images/events/state-event.webp',
        href: '/events?level=state',
        // Blue/Cyan Theme
        cardGradient: 'from-blue-500/90 to-cyan-600/90',
        shadowColor: 'shadow-blue-500/30',
        accentColor: 'text-blue-100',
        buttonColor: 'bg-white text-blue-600 hover:bg-blue-50',
    },
    {
        id: 'district',
        title: 'District Events',
        subtitle: 'LOCAL COMPETITIONS',
        description: 'Start your journey at local district events, build your skills, and prepare for higher levels of competition.',
        image: '/images/events/district-event.webp',
        href: '/events?level=district',
        // Emerald/Teal Theme
        cardGradient: 'from-emerald-500/90 to-teal-600/90',
        shadowColor: 'shadow-emerald-500/30',
        accentColor: 'text-emerald-100',
        buttonColor: 'bg-white text-emerald-600 hover:bg-emerald-50',
    },
];

export default function EventCategories() {
    return (
        <section className="relative py-32 bg-white overflow-visible">
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Faded Skating Shoe Icons */}
                <div className="absolute top-20 left-10 opacity-[0.03] transform -rotate-12">
                    <Ticket size={300} />
                </div>
                <div className="absolute bottom-20 right-10 opacity-[0.03] transform rotate-12">
                    <Trophy size={300} />
                </div>

                {/* Particles */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-slate-900/5"
                        style={{
                            width: Math.random() * 20 + 5,
                            height: Math.random() * 20 + 5,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, Math.random() * -100],
                            opacity: [0, 0.5, 0],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-28"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-bold uppercase tracking-wider mb-4 border border-slate-200 shadow-sm">
                        Event Categories
                    </span>
                    <h2 className="text-4xl md:text-6xl font-headline font-bold text-slate-900 mb-6 tracking-tight">
                        Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Events</span>
                    </h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        From local competitions to national championships, find the perfect event for your skating journey.
                    </p>
                </motion.div>

                {/* Event Cards Grid */}
                <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
                    {eventCategories.map((category, index) => {
                        return (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className="group relative pt-24 h-full flex"
                            >
                                {/* 3D Image - Projecting Above Card */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 w-64 h-64 pointer-events-none">
                                    <motion.div
                                        whileHover={{ scale: 1.1, y: -15, rotate: 2 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                        className="relative w-full h-full"
                                    >
                                        <Image
                                            src={category.image}
                                            alt={category.title}
                                            fill
                                            className="object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)] transition-all duration-500"
                                            priority={index === 0}
                                        />
                                    </motion.div>
                                </div>

                                {/* Card */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                    className={`relative w-full rounded-[2.5rem] bg-gradient-to-br ${category.cardGradient} p-8 pt-32 text-center shadow-xl ${category.shadowColor} hover:shadow-2xl transition-all duration-300 flex flex-col mt-4`}
                                >
                                    {/* Glassmorphism Overlay */}
                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] rounded-[2.5rem]" />

                                    {/* Subtle Noise Texture */}
                                    <div
                                        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay rounded-[2.5rem]"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                        }}
                                    />

                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col h-full">
                                        <p className={`${category.accentColor} text-xs font-bold uppercase tracking-[0.2em] mb-3`}>
                                            {category.subtitle}
                                        </p>
                                        <h3 className="text-3xl font-headline font-bold text-white mb-4 drop-shadow-sm">
                                            {category.title}
                                        </h3>
                                        <p className="text-white/90 text-sm mb-8 leading-relaxed font-medium flex-grow">
                                            {category.description}
                                        </p>

                                        {/* Standout Button */}
                                        <div className="mt-auto">
                                            <Link
                                                href={category.href}
                                                className={`inline-flex items-center gap-2 px-8 py-4 ${category.buttonColor} font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group-hover:ring-4 ring-white/30`}
                                            >
                                                Explore Events
                                                <ArrowRight className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
