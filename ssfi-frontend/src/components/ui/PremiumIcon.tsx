'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumIconProps {
    icon: LucideIcon;
    variant?: 'blue' | 'purple' | 'orange' | 'pink' | 'cyan' | 'emerald' | 'amber';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    animate?: boolean;
}

const variantStyles = {
    blue: {
        bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
        shadow: 'shadow-lg shadow-blue-500/20',
        icon: 'text-blue-400',
        ring: 'ring-1 ring-blue-500/30',
    },
    purple: {
        bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
        shadow: 'shadow-lg shadow-purple-500/20',
        icon: 'text-purple-400',
        ring: 'ring-1 ring-purple-500/30',
    },
    orange: {
        bg: 'bg-gradient-to-br from-orange-500/20 to-red-500/20',
        shadow: 'shadow-lg shadow-orange-500/20',
        icon: 'text-orange-400',
        ring: 'ring-1 ring-orange-500/30',
    },
    pink: {
        bg: 'bg-gradient-to-br from-pink-500/20 to-rose-500/20',
        shadow: 'shadow-lg shadow-pink-500/20',
        icon: 'text-pink-400',
        ring: 'ring-1 ring-pink-500/30',
    },
    cyan: {
        bg: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20',
        shadow: 'shadow-lg shadow-cyan-500/20',
        icon: 'text-cyan-400',
        ring: 'ring-1 ring-cyan-500/30',
    },
    emerald: {
        bg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/20',
        shadow: 'shadow-lg shadow-emerald-500/20',
        icon: 'text-emerald-400',
        ring: 'ring-1 ring-emerald-500/30',
    },
    amber: {
        bg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20',
        shadow: 'shadow-lg shadow-amber-500/20',
        icon: 'text-amber-400',
        ring: 'ring-1 ring-amber-500/30',
    },
};

const sizeStyles = {
    sm: {
        container: 'w-10 h-10',
        icon: 20,
    },
    md: {
        container: 'w-12 h-12',
        icon: 24,
    },
    lg: {
        container: 'w-16 h-16',
        icon: 32,
    },
    xl: {
        container: 'w-20 h-20',
        icon: 40,
    },
};

export default function PremiumIcon({
    icon: Icon,
    variant = 'blue',
    size = 'md',
    animate = true,
}: PremiumIconProps) {
    const variantClasses = variantStyles[variant];
    const sizeClasses = sizeStyles[size];

    const Container = animate ? motion.div : 'div';

    return (
        <Container
            {...(animate && {
                whileHover: { scale: 1.05, rotate: 5 },
                transition: { type: 'spring', stiffness: 300, damping: 20 },
            })}
            className={`
        ${sizeClasses.container}
        ${variantClasses.bg}
        ${variantClasses.shadow}
        ${variantClasses.ring}
        rounded-full
        flex items-center justify-center
        backdrop-blur-sm
        transition-all duration-300
        group-hover:shadow-xl
      `}
        >
            <Icon
                className={`${variantClasses.icon} transition-transform duration-300`}
                size={sizeClasses.icon}
                strokeWidth={1.5}
            />
        </Container>
    );
}
