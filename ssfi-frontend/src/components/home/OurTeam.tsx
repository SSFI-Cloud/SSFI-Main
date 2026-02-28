'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Linkedin, Mail, Users } from 'lucide-react';
import { api } from '@/lib/api/client';

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
  { id: '1', name: 'Mr. Krishna Baisware', role: 'President', bio: 'Co-founder and President of SSFI, leading the strategic direction of speed skating in India since its inception.', email: 'president@ssfiskate.com' },
  { id: '2', name: 'Shri S. Muruganantham', role: 'General Secretary', bio: 'Co-founder and General Secretary, driving operational excellence and nationwide expansion of speed skating.', email: 'secretary@ssfiskate.com' },
];

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

export default function OurTeam() {
  const [team, setTeam] = useState<TeamMember[]>(FALLBACK_TEAM);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/team-members/public?showOnHome=true')
      .then(res => {
        const members = res.data?.data;
        if (Array.isArray(members) && members.length > 0) setTeam(members);
      })
      .catch(() => {/* silently keep fallback */})
      .finally(() => setLoaded(true));
  }, []);

  const getPhotoSrc = (photo?: string) => {
    if (!photo) return null;
    return photo.startsWith('http') ? photo : `${API_BASE}${photo}`;
  };

  return (
    <section className="relative py-28 overflow-hidden bg-gray-950">
      {/* Glows */}
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Leadership
          </span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-4 tracking-tight">
            Meet Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Team</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            The people driving India&apos;s skating revolution forward.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className={`grid gap-8 max-w-5xl mx-auto ${team.length === 1 ? 'md:grid-cols-1 max-w-xs' : team.length === 2 ? 'md:grid-cols-2 max-w-2xl' : team.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
          {team.map((member, i) => {
            const photoSrc = getPhotoSrc(member.photo);
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
              >
                {/* Photo or gradient placeholder */}
                {photoSrc ? (
                  <Image
                    src={photoSrc}
                    alt={member.name}
                    fill
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-gray-900 to-blue-900/60 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                      <Users className="w-12 h-12 text-white/30" />
                    </div>
                  </div>
                )}

                {/* Default Bottom Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-60 group-hover:opacity-0 transition-opacity duration-500" />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-amber-400 text-sm font-semibold uppercase tracking-wider mb-1">{member.role}</p>
                    <h3 className="text-2xl font-headline font-bold text-white mb-2">{member.name}</h3>
                    {member.bio && <p className="text-white/50 text-sm mb-4 leading-relaxed line-clamp-3">{member.bio}</p>}
                    <div className="flex gap-2">
                      {member.linkedinUrl && (
                        <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-blue-500/30 border border-white/10 flex items-center justify-center text-white/60 hover:text-blue-400 transition-all">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {member.email && (
                        <a href={`mailto:${member.email}`}
                          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-amber-500/30 border border-white/10 flex items-center justify-center text-white/60 hover:text-amber-400 transition-all">
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Default name label */}
                <div className="absolute bottom-0 left-0 right-0 p-5 group-hover:opacity-0 transition-opacity duration-300">
                  <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">{member.role}</p>
                  <h3 className="text-lg font-headline font-bold text-white">{member.name}</h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
