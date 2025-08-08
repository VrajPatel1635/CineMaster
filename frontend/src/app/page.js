// src/app/page.js
'use client';
import AIPicksSection from '@/components/AIPicksSection';
import HeroSection from '@/components/HeroSection';
import RecommendationsSection from '@/components/RecommendationsSection';
import useUser from '@/hooks/useUser';

export default function Home() {
  const { userId, isAuthenticated, isLoading } = useUser();
  console.log("[Home Page] Rendering. userId:", userId, "isAuthenticated:", isAuthenticated, "isLoading:", isLoading); // Add this log

  return (
    <div className="pt-20">
      <HeroSection />
      {isAuthenticated && <RecommendationsSection userId={userId} />}
      <AIPicksSection />
    </div>
  );
}
