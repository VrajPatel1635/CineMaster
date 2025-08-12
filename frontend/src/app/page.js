// src/app/page.js
'use client';
import AIPicksSection from '@/components/AIPicksSection';
import dynamic from 'next/dynamic';
import RecommendationsSection from '@/components/RecommendationsSection';
import useUser from '@/hooks/useUser';

const HeroSection = dynamic(() => import('@/components/HeroSection'), { ssr: false });

export default function Home() {
  const { userId, isAuthenticated, isLoading } = useUser();
  console.log("[Home Page] Rendering. userId:", userId, "isAuthenticated:", isAuthenticated, "isLoading:", isLoading); 

  return (
    <div className="pt-20">
      <HeroSection />
      {isAuthenticated && <RecommendationsSection userId={userId} />}
      <AIPicksSection />
    </div>
  );
}
