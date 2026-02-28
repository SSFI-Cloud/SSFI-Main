'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Newspaper, Image, Settings, Users, Flag, MailOpen } from 'lucide-react';

const modules = [
  {
    title: 'News & Announcements',
    description: 'Manage news articles, press releases, and updates.',
    icon: Newspaper,
    href: '/dashboard/cms/news',
    color: 'bg-blue-500',
  },
  {
    title: 'Team Members',
    description: 'Add and manage federation officials shown on the website.',
    icon: Users,
    href: '/dashboard/cms/team',
    color: 'bg-emerald-500',
  },
  {
    title: 'Milestones',
    description: 'Edit the achievements timeline shown on the About page.',
    icon: Flag,
    href: '/dashboard/cms/milestones',
    color: 'bg-amber-500',
  },
  {
    title: 'Contact Inbox',
    description: 'View and manage messages from the website contact form.',
    icon: MailOpen,
    href: '/dashboard/cms/contact-messages',
    color: 'bg-red-500',
  },
  {
    title: 'Static Pages',
    description: 'Create and edit static content pages like About, Terms.',
    icon: FileText,
    href: '/dashboard/cms/pages',
    color: 'bg-purple-500',
  },
  {
    title: 'Gallery & Media',
    description: 'Manage photo albums, videos, and media assets.',
    icon: Image,
    href: '/dashboard/cms/gallery',
    color: 'bg-pink-500',
  },
  {
    title: 'Site Settings',
    description: 'Configure global site settings, contact info, and social links.',
    icon: Settings,
    href: '/dashboard/cms/settings',
    color: 'bg-gray-300',
  },
];

export default function CMSOverviewPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {modules.map((module) => (
        <Link
          key={module.title}
          href={module.href}
          className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-200 hover:border-slate-500 transition-all hover:-translate-y-0.5"
        >
          <div className={`absolute top-0 right-0 w-24 h-24 ${module.color} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`} />
          <div className="relative z-10">
            <div className={`w-11 h-11 rounded-xl ${module.color} bg-opacity-20 flex items-center justify-center mb-4`}>
              <module.icon className={`w-5 h-5 ${module.color.replace('bg-', 'text-')}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">{module.title}</h3>
            <p className="text-gray-500 text-sm mb-4 leading-relaxed">{module.description}</p>
            <div className="flex items-center gap-1 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Open <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
