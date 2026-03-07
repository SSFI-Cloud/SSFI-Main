'use client';

import { motion } from 'framer-motion';
import { LucideIcon, ArrowUpRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getStatusColor } from '@/lib/utils/status';

// ==========================================
// COLOR SYSTEM
// ==========================================
const colorMap = {
  blue:   { bg: 'from-emerald-500 to-teal-600',   soft: 'bg-emerald-50',   text: 'text-emerald-600',   border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700' },
  green:  { bg: 'from-green-500 to-emerald-600',  soft: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100', badge: 'bg-green-100 text-green-700' },
  purple: { bg: 'from-teal-500 to-emerald-600',  soft: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', badge: 'bg-teal-100 text-teal-700' },
  amber:  { bg: 'from-emerald-400 to-teal-500',   soft: 'bg-emerald-50',  text: 'text-emerald-600',  border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700' },
  red:    { bg: 'from-red-500 to-teal-600',       soft: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100',   badge: 'bg-red-100 text-red-700' },
  slate:  { bg: 'from-slate-500 to-slate-700',    soft: 'bg-slate-50',  text: 'text-gray-500',  border: 'border-slate-200', badge: 'bg-slate-100 text-gray-700' },
  pink:   { bg: 'from-teal-500 to-teal-500',      soft: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-100',  badge: 'bg-teal-100 text-teal-700' },
  teal:   { bg: 'from-teal-500 to-cyan-600',      soft: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-100',  badge: 'bg-teal-100 text-teal-700' },
};
export type ColorKey = keyof typeof colorMap;

// ==========================================
// STAT CARD
// ==========================================
interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: ColorKey;
  trend?: { value: number; isPositive: boolean };
  href?: string;
  delay?: number;
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, color, trend, href, delay = 0, subtitle }: StatCardProps) {
  const c = colorMap[color] ?? colorMap.blue;
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden ${href ? 'hover:shadow-md hover:border-gray-200 cursor-pointer transition-all group' : ''}`}
    >
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${c.bg} opacity-10`} />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-600">{subtitle}</p>}
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
              <ArrowUpRight className={`w-3 h-3 ${!trend.isPositive ? 'rotate-180' : ''}`} />
              {Math.abs(trend.value)}% from last month
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${c.bg} shadow-sm flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {href && (
        <div className={`mt-4 pt-4 border-t ${c.border} flex items-center gap-1 text-xs font-medium ${c.text} group-hover:gap-2 transition-all`}>
          View details <ChevronRight className="w-3.5 h-3.5" />
        </div>
      )}
    </motion.div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ==========================================
// MINI STAT
// ==========================================
interface MiniStatProps { label: string; value: number | string; icon: LucideIcon; color: ColorKey; }
export function MiniStat({ label, value, icon: Icon, color }: MiniStatProps) {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
}

// ==========================================
// PENDING APPROVAL CARD
// ==========================================
interface PendingApprovalCardProps { title: string; count: number; icon: LucideIcon; href: string; delay?: number; color?: ColorKey; }
export function PendingApprovalCard({ title, count, icon: Icon, href, delay = 0, color = 'amber' }: PendingApprovalCardProps) {
  const c = colorMap[color] ?? colorMap.amber;
  return (
    <Link href={href}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.bg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{title}</p>
          <p className="text-lg font-bold text-gray-900">{count} pending</p>
        </div>
        <ChevronRight className={`w-4 h-4 ${c.text} group-hover:translate-x-1 transition-transform`} />
      </motion.div>
    </Link>
  );
}

// ==========================================
// SECTION HEADER
// ==========================================
interface SectionHeaderProps { title: string; subtitle?: string; href?: string; hrefLabel?: string; icon?: LucideIcon; color?: ColorKey; }
export function SectionHeader({ title, subtitle, href, hrefLabel = 'View all', icon: Icon, color = 'blue' }: SectionHeaderProps) {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.bg} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link href={href} className={`text-xs font-medium ${c.text} hover:underline flex items-center gap-1`}>
          {hrefLabel} <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

// ==========================================
// CARD WRAPPER
// ==========================================
export function DashCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>;
}

// ==========================================
// RECENT LIST
// ==========================================
interface RecentListProps<T> { title: string; items: T[]; renderItem: (item: T, index: number) => React.ReactNode; emptyMessage?: string; href?: string; delay?: number; icon?: LucideIcon; color?: ColorKey; }
export function RecentList<T>({ title, items, renderItem, emptyMessage = 'No items to display', href, delay = 0, icon, color = 'blue' }: RecentListProps<T>) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <SectionHeader title={title} href={href} icon={icon} color={color} />
      </div>
      <div className="divide-y divide-gray-50">
        {items.length > 0
          ? items.map((item, i) => <div key={i} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">{renderItem(item, i)}</div>)
          : <p className="px-5 py-8 text-center text-sm text-gray-600">{emptyMessage}</p>}
      </div>
    </motion.div>
  );
}

// ==========================================
// STATUS BADGE
// ==========================================
interface StatusBadgeProps { status: string; size?: 'sm' | 'md'; }
export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const safeStatus = status || 'UNKNOWN';
  const colors = getStatusColor(safeStatus);
  const sz = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return <span className={`rounded-full font-medium ${colors.bg} ${colors.text} ${sz}`}>{safeStatus.replace(/_/g, ' ')}</span>;
}

// ==========================================
// CHART CARD
// ==========================================
interface ChartCardProps { title: string; children: React.ReactNode; delay?: number; subtitle?: string; }
export function ChartCard({ title, children, delay = 0, subtitle }: ChartCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ==========================================
// SIMPLE BAR CHART
// ==========================================
interface SimpleBarChartProps { data: { label: string; value: number; color?: string }[]; maxValue?: number; }
export function SimpleBarChart({ data, maxValue }: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const cols = ['bg-emerald-500', 'bg-teal-500', 'bg-teal-500', 'bg-teal-500', 'bg-teal-500'];
  return (
    <div className="space-y-3.5">
      {data.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-gray-500">{item.label}</span>
            <span className="text-xs font-semibold text-gray-900">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${item.color || cols[i % cols.length]}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// DONUT CHART
// ==========================================
interface DonutChartProps { data: { label: string; value: number; color: string }[]; size?: number; }
export function DonutChart({ data, size = 150 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="18" />
        {data.map((item, i) => {
          const pct = total > 0 ? item.value / total : 0;
          const dashArr = `${pct * 238.76} 238.76`;
          const dashOff = -currentAngle * 238.76 / 360;
          currentAngle += pct * 360;
          return <circle key={i} cx="50" cy="50" r="38" fill="none" stroke={item.color} strokeWidth="18" strokeDasharray={dashArr} strokeDashoffset={dashOff} transform="rotate(-90 50 50)" />;
        })}
        <text x="50" y="47" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 700, fill: '#111827' }}>{total.toLocaleString()}</text>
        <text x="50" y="59" textAnchor="middle" style={{ fontSize: '7px', fill: '#9ca3af' }}>Total</text>
      </svg>
      <div className="space-y-2 flex-1">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-500 flex-1 truncate">{item.label}</span>
            <span className="text-xs font-semibold text-gray-800">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// QUICK ACTION
// ==========================================
interface QuickActionProps { title: string; description: string; icon: LucideIcon; href: string; color: ColorKey; }
export function QuickAction({ title, description, icon: Icon, href, color }: QuickActionProps) {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <Link href={href}>
      <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center mb-3 shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${c.text} group-hover:gap-2 transition-all`}>
          Go <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}

// ==========================================
// RENEWAL COUNTDOWN BADGE
// ==========================================
interface RenewalCountdownBadgeProps {
  daysUntilExpiry: number | null | undefined;
  expiryDate: string | Date | null | undefined;
  accountStatus?: string;
}

export function RenewalCountdownBadge({ daysUntilExpiry, expiryDate, accountStatus }: RenewalCountdownBadgeProps) {
  if (daysUntilExpiry === null || daysUntilExpiry === undefined) return null;

  const isExpired = daysUntilExpiry <= 0;
  const isUrgent = daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  const isWarning = daysUntilExpiry > 7 && daysUntilExpiry <= 30;

  const colors = isExpired
    ? { ring: 'border-red-400', bg: 'bg-red-50', text: 'text-red-600', sub: 'text-red-500', pulse: 'bg-red-400' }
    : isUrgent
    ? { ring: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', sub: 'text-amber-500', pulse: 'bg-amber-400' }
    : isWarning
    ? { ring: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-amber-600', sub: 'text-amber-500', pulse: '' }
    : { ring: 'border-green-400', bg: 'bg-green-50', text: 'text-green-600', sub: 'text-green-500', pulse: '' };

  const displayDays = isExpired ? Math.abs(daysUntilExpiry) : daysUntilExpiry;
  const fmtDate = expiryDate ? new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${colors.ring} ${colors.bg} shadow-sm`}
    >
      {/* Countdown circle */}
      <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] ${colors.ring} flex flex-col items-center justify-center flex-shrink-0 bg-white`}>
        <span className={`text-xl sm:text-2xl font-extrabold ${colors.text} leading-none`}>
          {isExpired ? '!' : displayDays}
        </span>
        <span className={`text-[8px] sm:text-[9px] font-bold ${colors.sub} uppercase leading-tight tracking-wide`}>
          {isExpired ? 'Expired' : 'Days'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${colors.text}`}>
          {isExpired ? 'Registration Expired' : isUrgent ? 'Renewal Urgent!' : isWarning ? 'Renewal Due Soon' : 'Registration Active'}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          {isExpired
            ? `Expired ${displayDays} day${displayDays !== 1 ? 's' : ''} ago`
            : `${displayDays} day${displayDays !== 1 ? 's' : ''} remaining to renew`}
        </p>
        {fmtDate && (
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isExpired ? 'Expired on' : 'Expires'}: {fmtDate}
          </p>
        )}
      </div>

      {/* Animated pulse for urgent/expired */}
      {(isExpired || isUrgent) && (
        <div className="flex-shrink-0">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.pulse} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${colors.pulse}`} />
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ==========================================
// DASHBOARD HERO
// ==========================================
interface DashboardHeroProps { name: string; role: string; roleColor?: ColorKey; subtitle?: string; stats?: { label: string; value: string | number }[]; actions?: React.ReactNode; }
export function DashboardHero({ name, role, roleColor = 'blue', subtitle, stats, actions }: DashboardHeroProps) {
  const c = colorMap[roleColor] ?? colorMap.blue;
  return (
    <div className="bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50] rounded-2xl p-6 sm:p-8 mb-6 text-white overflow-hidden relative">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute top-8 right-20 w-16 h-16 rounded-full bg-white/5" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/25 rounded-full text-xs font-semibold text-white/90 mb-3`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            {role}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome back, {name.split(' ')[0]}! 👋</h1>
          {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
          {stats && (
            <div className="flex flex-wrap gap-6 mt-4">
              {stats.map((s, i) => (
                <div key={i}>
                  <p className="text-white/50 text-xs">{s.label}</p>
                  <p className="text-white font-bold text-lg">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
