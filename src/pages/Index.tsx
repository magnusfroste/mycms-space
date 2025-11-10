import React, { useEffect } from 'react';
import Header from '@/components/Header';
import WelcomeSection from '@/components/WelcomeSection';
import AboutMe from '@/components/AboutMe';
import FeaturedIn from '@/components/FeaturedIn';
import ExpertiseCards from '@/components/ExpertiseCards';
import ProjectShowcase from '@/components/ProjectShowcase';
import Footer from '@/components/Footer';
import { configService } from '@/services/configService';
import { useAnalytics } from '@/hooks/useAnalytics';

const Index = () => {
  // Initialize configuration
  useEffect(() => {
    configService.initialize();
  }, []);

  // Track homepage visit
  useAnalytics('homepage');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <WelcomeSection />
        <AboutMe />
        <FeaturedIn />
        <ExpertiseCards />
        <ProjectShowcase />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
