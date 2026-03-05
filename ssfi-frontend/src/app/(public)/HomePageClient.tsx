'use client';

import dynamic from 'next/dynamic';
import HeroSection from '@/components/home/HeroSection';

// Eagerly loaded — above the fold
import EventHighlightCards from '@/components/home/EventHighlightCards';

// GlobeStats uses a COBE 3D WebGL globe that causes scroll jank if loaded eagerly
const GlobeStats = dynamic(() => import('@/components/home/GlobeStats'), { ssr: false });

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
  return (
    <main className="min-h-screen bg-white">
      {/* 1. Hero — dark full-screen slider */}
      <HeroSection />

      {/* 2. Globe Stats — social proof, big counter, cobe globe (LIGHT) */}
      <GlobeStats />

      {/* 3. Events & Programs — 3 highlight cards (LIGHT) */}
      <EventHighlightCards />

      {/* 4. Coach Certification — right after events for context (DARK) */}
      <CoachCertification />

      {/* 5. Why Join SSFI — value proposition, features (LIGHT) */}
      <WhyJoinSSFI />

      {/* 6. Beginner Certification — separated from coach cert (DARK) */}
      <BeginnerCertification />

      {/* 7. Championship Highlights — recent results (LIGHT) */}
      <RecentResults />

      {/* 8. Our Team — leadership (DARK) */}
      <OurTeam />

      {/* 9. Meet Rollie — fun mascot break (LIGHT) */}
      <MeetRollie />

      {/* 10. Donations — emotional appeal (LIGHT/pink) */}
      <DonationsSection />

      {/* 11. Partners Marquee — trust signals (LIGHT) */}
      <PartnersMarquee />
    </main>
  );
}
