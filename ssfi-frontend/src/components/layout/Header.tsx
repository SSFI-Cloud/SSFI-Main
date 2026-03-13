'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { api } from '@/lib/api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Bell,
  Users,
  Shield,
  Building2,
  MapPin,
  ArrowRight,
  GraduationCap,
  Award,
} from 'lucide-react';
import { TubelightNavbar } from '@/components/ui/TubelightNavbar';

// Types
interface UserData {
  id: number;
  full_name?: string;
  name?: string;
  email: string;
  role: string;
  profile_photo?: string;
}

interface ActiveRegistration {
  id: number | string;
  type: string;
  name: string;
  endDate: string;
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/results', label: 'Results' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/news', label: 'News' },
  { href: '/affiliated-coaches', label: 'Coaches' },
  {
    label: 'Programs',
    children: [
      { href: '/beginner-certification', label: 'Beginner Certification' },
      { href: '/coach-certification', label: 'Coach Certification' },
    ],
  },
  { href: '/contact', label: 'Contact' },
];

const registrationTypeConfig: Record<string, { icon: any; color: string; label: string; href?: string }> = {
  student: { icon: Users, color: 'text-emerald-400', label: 'Student Registration' },
  club: { icon: Shield, color: 'text-teal-400', label: 'Club Affiliation' },
  district: { icon: Building2, color: 'text-amber-400', label: 'District Association' },
  state: { icon: MapPin, color: 'text-green-400', label: 'State Association' },
};

/** Match beginner_* / coach_* types from the API to config + correct pages */
function getRegConfig(reg: ActiveRegistration) {
  // Exact match first
  if (registrationTypeConfig[reg.type]) {
    return { ...registrationTypeConfig[reg.type], href: `/auth/register?type=${reg.type}` };
  }
  // Beginner certification programs (type: beginner_inline, beginner_quad, etc.)
  if (reg.type.startsWith('beginner_')) {
    return { icon: GraduationCap, color: 'text-teal-400', label: reg.name || 'Beginner Certification', href: '/beginner-certification' };
  }
  // Coach certification programs (type: coach_inline, coach_quad, etc.)
  if (reg.type.startsWith('coach_')) {
    return { icon: Award, color: 'text-orange-400', label: reg.name || 'Coach Certification', href: '/coach-certification' };
  }
  // Fallback
  return { icon: Users, color: 'text-gray-400', label: reg.name || 'Registration', href: `/auth/register?type=${reg.type}` };
}

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  // Pages with light/white backgrounds that need a permanently dark navbar
  const lightBgPages = ['/register', '/contact'];
  const forceDark = lightBgPages.some(p => pathname === p || pathname.startsWith(p + '/'));

  const [isScrolled, setIsScrolled] = useState(forceDark);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);
  const [activeRegistrations, setActiveRegistrations] = useState<ActiveRegistration[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);

  // Fetch active registrations
  useEffect(() => {
    const fetchActiveRegistrations = async () => {
      try {
        const response = await api.get('/registration-windows/active');
        if (response.data?.success && response.data?.data) {
          setActiveRegistrations(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch active registrations:', error);
        setActiveRegistrations([]);
      } finally {
        setIsLoadingRegistrations(false);
      }
    };

    fetchActiveRegistrations();
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(forceDark || window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.name || user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email?.split('@')[0] || 'User';
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ top: 'var(--ribbon-h, 0px)' }}
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-dark-900/95 backdrop-blur-xl border-b border-white/10 shadow-xl'
          : 'bg-transparent'
          }`}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-28">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <Image
                  src="/images/logo/light.webp"
                  alt="Speed Skating Federation of India"
                  fill
                  className="object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </Link>


            {/* Desktop Navigation - Tubelight Style */}
            <TubelightNavbar
              items={navLinks.map(link => ({
                name: link.label,
                ...('href' in link && { url: link.href }),
                ...('children' in link && link.children && {
                  children: link.children.map(c => ({ name: c.label, url: c.href })),
                }),
              }))}
              className="hidden lg:flex"
            />

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {user ? (
                // Logged In - User Menu
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center overflow-hidden">
                      {user.profile_photo ? (
                        <Image
                          src={user.profile_photo}
                          alt={getUserDisplayName()}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className="hidden md:block text-sm font-semibold text-white">
                      {getUserDisplayName()}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 rounded-lg bg-dark-800 border border-white/10 shadow-xl overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/10">
                          <p className="text-sm font-semibold text-white">{getUserDisplayName()}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                          <p className="text-xs text-primary-400 mt-1">{user.role}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Not Logged In - Login/Register Buttons
                <>
                  <Link
                    href="/auth/login"
                    className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold text-white hover:text-primary-400 transition-colors"
                  >
                    Login
                  </Link>

                  {/* Register Button with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsRegisterDropdownOpen(!isRegisterDropdownOpen)}
                      disabled={isLoadingRegistrations || activeRegistrations.length === 0}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${activeRegistrations.length > 0
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 hover:shadow-emerald-500/50 hover:scale-105'
                        : 'bg-gray-600 text-white cursor-not-allowed opacity-50'
                        }`}
                    >
                      Register
                      {activeRegistrations.length > 0 && (
                        <>
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/20 text-xs">
                            {activeRegistrations.length}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isRegisterDropdownOpen ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>

                    {/* Registration Dropdown */}
                    <AnimatePresence>
                      {isRegisterDropdownOpen && activeRegistrations.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-72 rounded-lg bg-dark-800 border border-white/10 shadow-xl overflow-hidden"
                        >
                          <div className="p-3 border-b border-white/10 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-primary-400" />
                              <span className="text-sm font-semibold text-white">Open Registrations</span>
                            </div>
                          </div>
                          <div className="p-2 max-h-80 overflow-y-auto">
                            {activeRegistrations.map((reg) => {
                              const config = getRegConfig(reg);
                              const Icon = config.icon;

                              return (
                                <Link
                                  key={reg.id}
                                  href={config.href}
                                  onClick={() => setIsRegisterDropdownOpen(false)}
                                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors group"
                                >
                                  <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${config.color}`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">
                                      {config.label}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Ends: {new Date(reg.endDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary-400 transition-colors" />
                                </Link>
                              );
                            })}
                          </div>
                          <div className="p-2 border-t border-white/10">
                            <Link
                              href="/auth/register"
                              onClick={() => setIsRegisterDropdownOpen(false)}
                              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 text-sm font-semibold hover:bg-primary-500/20 transition-colors"
                            >
                              View All Registrations
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-white/10 bg-dark-900/95 backdrop-blur-xl"
            >
              <div className="container mx-auto px-4 py-6 space-y-2">
                {navLinks.map((item) => {
                  if ('children' in item && item.children) {
                    return (
                      <div key={item.label}>
                        <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.label}</p>
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block px-6 py-3 rounded-lg text-sm font-semibold transition-colors ${pathname === child.href
                              ? 'bg-primary-500/10 text-primary-400'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                              }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.label}
                      href={'href' in item ? item.href : '/'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${'href' in item && pathname === item.href
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                {/* Mobile Auth Links */}
                {!user && (
                  <>
                    <div className="pt-4 border-t border-white/10">
                      <Link
                        href="/auth/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        Login
                      </Link>
                      {activeRegistrations.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="px-4 text-xs font-semibold text-gray-500 uppercase">Open Registrations</p>
                          {activeRegistrations.map((reg) => {
                            const config = getRegConfig(reg);
                            const Icon = config.icon;

                            return (
                              <Link
                                key={reg.id}
                                href={config.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <Icon className={`w-5 h-5 ${config.color}`} />
                                <span className="text-sm text-gray-300">{config.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
};

export default Header;
