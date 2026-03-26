'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Users } from 'lucide-react';
interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photo?: string;
  email?: string;
  linkedinUrl?: string;
}

const FALLBACK_TEAM: TeamMember[] = [
  { id: '1', name: 'Shri S. Muruganantham', role: 'General Secretary', photo: '/images/team/muruganantham.webp' },
  { id: '2', name: 'Mr. Krishna Baisware', role: 'President', photo: '/images/team/krishna-baisware.webp' },
];

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1').replace('/api/v1', '');

interface OurTeamProps {
  members?: TeamMember[];
}

export default function OurTeam({ members }: OurTeamProps) {
  const [team, setTeam] = useState<TeamMember[]>(FALLBACK_TEAM);

  // Accept members from parent (aggregate endpoint)
  // Merge local static photos over CMS upload URLs (Railway ephemeral FS loses uploads on redeploy)
  const fallbackPhotoMap: Record<string, string> = {};
  FALLBACK_TEAM.forEach(m => { if (m.photo) fallbackPhotoMap[m.role] = m.photo; });
  useEffect(() => {
    if (Array.isArray(members) && members.length > 0) {
      setTeam(members.map((m: any) => ({
        ...m,
        photo: m.photo?.startsWith('/uploads/') ? (fallbackPhotoMap[m.role] || m.photo) : m.photo,
      })));
    }
  }, [members]);

  const getPhotoSrc = (photo?: string) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    if (photo.startsWith('/images/')) return photo;
    return `${API_BASE}${photo}`;
  };

  return (
    <section className="relative py-20 lg:py-24 overflow-hidden bg-gray-50">
      {/* Subtle grid line background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ghost watermark — left-aligned, partially visible */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <span className="absolute left-[-2vw] bottom-[-2vw] font-hero italic font-black text-[30vw] lg:text-[20vw] leading-none tracking-tight text-gray-400/[0.12] whitespace-nowrap">
          TEAM
        </span>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-500 text-sm font-medium mb-4 shadow-sm">
            <Users className="w-4 h-4" />
            Leadership
          </span>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-gray-900 mb-3 tracking-tight">
            Meet Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Team</span>
          </h2>
          <p className="text-base text-gray-400 max-w-md mx-auto">
            The people driving India&apos;s skating revolution forward.
          </p>
        </motion.div>

        {/* Curved rectangular container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-lg shadow-gray-200/40 px-8 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14"
        >
          <div className={`flex flex-wrap items-start justify-center ${team.length <= 3 ? 'gap-12 sm:gap-16 lg:gap-20' : 'gap-10 sm:gap-12 lg:gap-14'}`}>
            {team.map((member, i) => {
              const photoSrc = getPhotoSrc(member.photo);
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex flex-col items-center text-center group w-[160px] sm:w-[180px]"
                >
                  {/* Circular image — fixed size for uniformity */}
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden mb-4 ring-4 ring-white shadow-lg shadow-gray-200/60 group-hover:ring-emerald-200/60 group-hover:shadow-emerald-100/40 transition-all duration-300 flex-shrink-0">
                    {photoSrc ? (
                      <Image
                        src={photoSrc}
                        alt={`${member.name} - ${member.role}, SSFI`}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
                        sizes="160px"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <Users className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  {/* Name — single line */}
                  <h3 className="text-sm sm:text-base font-headline font-bold text-gray-900 leading-tight mb-1 whitespace-nowrap">{member.name}</h3>
                  {/* Designation */}
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">{member.role}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
