'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { Users, Trophy, MapPin, Award } from 'lucide-react';
import { api } from '@/lib/api/client';
import PremiumIcon from '@/components/ui/PremiumIcon';
import { MagneticCard } from '@/components/ui/MagneticCard';

interface Stat {
  id: number;
  label: string;
  value: number;
  suffix: string;
  icon: any; // Lucide icon component
  variant: 'blue' | 'purple' | 'orange' | 'pink' | 'cyan' | 'emerald' | 'amber';
}

const initialStats: Stat[] = [
  {
    id: 1,
    label: 'States',
    value: 0,
    suffix: '+',
    icon: MapPin,
    variant: 'blue',
  },
  {
    id: 2,
    label: 'Registered Clubs',
    value: 0,
    suffix: '+',
    icon: Award,
    variant: 'emerald',
  },
  {
    id: 3,
    label: 'Active Skaters',
    value: 10000,
    suffix: '+',
    icon: Users,
    variant: 'cyan',
  },
  {
    id: 4,
    label: 'Events This Year',
    value: 0,
    suffix: '+',
    icon: Trophy,
    variant: 'orange',
  },
];

/* ... AnimatedCounter component remains same ... */
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.floor(latest).toLocaleString();
      }
    });

    return () => unsubscribe();
  }, [springValue]);

  return (
    <span ref={ref} className="tabular-nums">
      0
    </span>
  );
}

const StatsCounter = () => {
  const [stats, setStats] = useState<Stat[]>(initialStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats/public');
        const payload = (response.data as any);
        // Backend returns { status: 'success', data: {...} } via sendSuccess()
        const success = payload.success || payload.status === 'success';
        if (success) {
          const data = payload.data ?? payload;
          setStats(prevStats => prevStats.map(stat => {
            switch (stat.id) {
              case 1: return { ...stat, value: data.states || 0 };
              case 2: return { ...stat, value: data.clubs || 0 };
              case 3: return { ...stat, value: data.students || 0 };
              case 4: return { ...stat, value: data.activeEvents || 0 };
              default: return stat;
            }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch public stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="relative py-24 bg-dark-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-[0.03]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary-500/10 text-primary-400 text-sm font-semibold mb-4 border border-primary-500/20 font-body">
            Our Impact
          </span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-6">
            Skating Across India
          </h2>
          <p className="text-xl font-body font-light text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Building the largest skating community in the nation with verified athletes and standardized events.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            // Map variant to glow color
            const glowColors: Record<string, string> = {
              blue: '#14b8a6',
              purple: '#10b981',
              cyan: '#22d3ee',
              orange: '#f97316',
              pink: '#14b8a6',
              amber: '#f59e0b',
              emerald: '#10b981',
            };
            const glowColor = glowColors[stat.variant] || '#14b8a6';

            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <MagneticCard glowColor={glowColor} className="h-full">
                  <div className="p-8">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center sm:justify-start">
                      <PremiumIcon
                        icon={stat.icon}
                        variant={stat.variant}
                        size="lg"
                        animate={true}
                      />
                    </div>

                    {/* Number */}
                    <div className="mb-2 text-center sm:text-left">
                      <h3 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                        <span>{stat.suffix}</span>
                      </h3>
                    </div>

                    {/* Label */}
                    <p className="text-gray-400 text-lg font-body font-normal text-center sm:text-left">
                      {stat.label}
                    </p>
                  </div>
                </MagneticCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
