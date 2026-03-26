'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FileText, Newspaper, Image as ImageIcon,
  Menu as MenuIcon, Settings, Megaphone, Users, Flag, MailOpen
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/cms', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/cms/news', label: 'News', icon: Newspaper },
  { href: '/dashboard/cms/team', label: 'Team', icon: Users },
  { href: '/dashboard/cms/milestones', label: 'Milestones', icon: Flag },
  { href: '/dashboard/cms/contact-messages', label: 'Inbox', icon: MailOpen },
  { href: '/dashboard/cms/pages', label: 'Pages', icon: FileText },
  { href: '/dashboard/cms/banners', label: 'Banners', icon: Megaphone },
  { href: '/dashboard/cms/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/dashboard/cms/settings', label: 'Settings', icon: Settings },
];

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-500">Manage your website content, news, team, and settings</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="min-h-[calc(100vh-200px)]">{children}</div>
    </div>
  );
}
