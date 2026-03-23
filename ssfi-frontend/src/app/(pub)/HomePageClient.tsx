'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api/client';
import HeroSection from '@/components/home/HeroSection';

// Eagerly loaded — above the fold
import EventHighlightCards from '@/components/home/EventHighlightCards';

// Lazy loaded — below the fold (reduces initial JS bundle by ~80KB+)
const CoachCertification = dynamic(() => import('@/components/home/CoachCertification'), { ssr: false });
const WhyJoinSSFI = dynamic(() => import('@/components/home/WhyJoinSSFI'), { ssr: false });
const BeginnerCertification = dynamic(() => import('@/components/home/BeginnerCertification'), { ssr: false });
const RecentResults = dynamic(() => import('@/components/home/RecentResults'), { ssr: false });
const OurTeam = dynamic(() => import('@/components/home/OurTeam'), { ssr: false });
const MeetRollie = dynamic(() => import('@/components/home/MeetRollie'), { ssr: false });
const DonationsSection = dynamic(() => import('@/components/home/DonationsSection'), { ssr: false });
const PartnersMarquee = dynamic(() => import('@/components/home/PartnersMarquee'), { ssr: false });

export default function HomePageClient() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/homepage')
      .then(res => {
        if (res.data?.success) setData(res.data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* 1. Hero — dark full-screen slider + stats strip + community stats */}
      <HeroSection banners={data?.banners} stats={data?.stats} />

      {/* 2. Events & Programs — 3 highlight cards (LIGHT) */}
      <EventHighlightCards />

      {/* 3. Coach Certification — right after events for context (DARK) */}
      <CoachCertification programs={data?.coachPrograms} />

      {/* 4. Why Join SSFI — value proposition, features (LIGHT) */}
      <WhyJoinSSFI stats={data?.stats} />

      {/* 5. Beginner Certification — separated from coach cert (DARK) */}
      <BeginnerCertification programs={data?.beginnerPrograms} />

      {/* 6. Championship Highlights — recent results (LIGHT) */}
      <RecentResults results={data?.recentResults} />

      {/* 7. Our Team — leadership (DARK) */}
      <OurTeam members={data?.teamMembers} />

      {/* 8. Meet Rollie — fun mascot break (LIGHT) */}
      <MeetRollie />

      {/* 9. Donations — emotional appeal (LIGHT/pink) */}
      <DonationsSection />

      {/* 10. Partners Marquee — trust signals (LIGHT) */}
      <PartnersMarquee />
    </main>
  );
}
