'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Building2, MapPin, Trophy, Calendar, CreditCard,
  FileText, Settings, Bell, LogOut, Menu, X, ChevronDown, Globe, UserPlus,
  ClipboardList, Clock, GraduationCap, Award, Medal, ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { type UserRole } from '@/types/dashboard';
import { ROLE_CONFIG } from '@/config/roles';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB_OWNER', 'STUDENT'] },
  { label: 'States', href: '/dashboard/states', icon: Globe, roles: ['GLOBAL_ADMIN'] },
  { label: 'Districts', href: '/dashboard/districts', icon: MapPin, roles: ['GLOBAL_ADMIN', 'STATE_SECRETARY'] },
  { label: 'Clubs', href: '/dashboard/clubs', icon: Building2, roles: ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'] },
  { label: 'Students', href: '/dashboard/students', icon: Users, roles: ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB_OWNER'] },
  { label: 'Events', href: '/dashboard/events', icon: Trophy, roles: ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'] },
  { label: 'My Events',        href: '/dashboard/my-events',    icon: Calendar, roles: ['STUDENT'] },
  { label: 'My Certificates',  href: '/dashboard/certificates', icon: Award,    roles: ['STUDENT'] },
  {
    label: 'Approvals', href: '/dashboard/approvals', icon: ClipboardList,
    roles: ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'],
    children: [
      { label: 'State Secretaries', href: '/dashboard/approvals/state-secretaries' },
      { label: 'District Secretaries', href: '/dashboard/approvals/district-secretaries' },
      { label: 'Clubs', href: '/dashboard/approvals/clubs' },
      { label: 'Students', href: '/dashboard/approvals/students' },
    ],
  },
  { label: 'Registration Windows', href: '/dashboard/registration-windows', icon: UserPlus, roles: ['GLOBAL_ADMIN'] },
  { label: 'Coach Certification', href: '/dashboard/coach-certification', icon: Award, roles: ['GLOBAL_ADMIN'] },
  { label: 'Beginner Certification', href: '/dashboard/beginner-certification', icon: Medal, roles: ['GLOBAL_ADMIN'] },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard, roles: ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB_OWNER'] },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText, roles: ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'] },
  { label: 'Renewals', href: '/dashboard/renewals', icon: Clock, roles: ['GLOBAL_ADMIN'] },
  { label: 'Content Management', href: '/dashboard/cms', icon: Globe, roles: ['GLOBAL_ADMIN'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB_OWNER', 'STUDENT'] },
];

const roleColors: Record<string, string> = {
  red: 'bg-red-100 text-red-700 border-red-200',
  blue: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  purple: 'bg-teal-100 text-teal-700 border-teal-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const userRole = (user?.role || 'STUDENT') as UserRole;
  const roleConfig = ROLE_CONFIG[userRole];
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  const getFilteredChildren = (item: NavItem) => {
    if (!item.children) return [];
    if (userRole === 'GLOBAL_ADMIN') return item.children;
    return item.children.filter(child => {
      if (child.href.includes('state-secretaries')) return (userRole as string) === 'GLOBAL_ADMIN';
      if (child.href.includes('district-secretaries')) return ['GLOBAL_ADMIN', 'STATE_SECRETARY'].includes(userRole);
      if (child.href.includes('clubs')) return ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'].includes(userRole);
      if (child.href.includes('students')) return ['GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'].includes(userRole);
      return true;
    });
  };

  const toggleExpanded = (label: string) =>
    setExpandedItems(prev => prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]);

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavItem) => isActive(item.href) || (item.children?.some(c => pathname.startsWith(c.href)) ?? false);

  const roleColorCls = roleColors[roleConfig?.color] || roleColors.blue;

  const Sidebar = () => (
    <aside className="fixed top-0 left-0 z-40 h-screen w-64 bg-[#0a1628] flex flex-col border-r border-white/5">
      {/* Logo */}
      <div className="p-5 border-b border-white/10 flex justify-center">
        <Link href="/" className="flex items-center justify-center">
          <div className="relative w-28 h-28">
            <Image src="/images/logo/light.webp" alt="SSFI" fill className="object-contain" />
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden">
            {user?.profile_photo
              ? <Image src={user.profile_photo} alt={user.name || 'User'} fill className="object-cover" />
              : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.name || 'User'}</p>
            <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${roleColorCls}`}>
              {roleConfig?.label || userRole}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          const children = getFilteredChildren(item);
          const hasChildren = children.length > 0;
          const isExpanded = expandedItems.includes(item.label);
          const active = isParentActive(item);

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${active ? 'bg-emerald-600 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${active ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </Link>
              )}
              {hasChildren && isExpanded && (
                <div className="ml-7 mt-0.5 mb-1 space-y-0.5 border-l border-white/10 pl-3">
                  {children.map(child => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-xs transition-all ${isActive(child.href) ? 'bg-emerald-600/20 text-emerald-400 font-semibold' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-red-500/15 hover:text-red-600 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a1628] px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="relative w-8 h-8">
            <Image src="/images/logo/light.webp" alt="SSFI" fill className="object-contain" />
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-white/60 hover:text-white">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed top-0 left-0 z-40 h-screen w-64">
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-5 sm:p-8">
          {children}
        </div>
      </main>
      {/* <!-- Dashboard built by Indefine (indefine.in) & LearnCrew (learncrew.org) | Lakshmanan Annamalai | 2026 --> */}
    </div>
  );
}
