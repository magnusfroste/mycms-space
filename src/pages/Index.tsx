
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AboutMe from '@/components/AboutMe';
import FeaturedIn from '@/components/FeaturedIn';
import ExpertiseCards from '@/components/ExpertiseCards';
import ProjectShowcase from '@/components/ProjectShowcase';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';
import { logPageVisit } from '@/lib/airtable';

const Index = () => {
  // Set Airtable credentials from environment variables
  useEffect(() => {
    // Get environment variables
    const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const tableId = import.meta.env.VITE_AIRTABLE_TABLE_ID;
    const name = import.meta.env.VITE_AIRTABLE_NAME;
    
    // Set them in localStorage for use throughout the app
    localStorage.setItem('VITE_AIRTABLE_API_KEY', apiKey);
    localStorage.setItem('VITE_AIRTABLE_BASE_ID', baseId);
    localStorage.setItem('VITE_AIRTABLE_TABLE_ID', tableId);
    localStorage.setItem('VITE_AIRTABLE_NAME', name);
    
    // Also store in localStorage under alternative keys for backward compatibility
    localStorage.setItem('airtableApiKey', apiKey);
    localStorage.setItem('airtableBaseId', baseId);
    localStorage.setItem('airtableTableId', tableId);
    localStorage.setItem('airtableName', name);
    
    // Log homepage visit
    logPageVisit('homepage')
      .then(() => console.log('Homepage visit logged'))
      .catch(err => console.error('Failed to log homepage visit:', err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <AboutMe />
        <FeaturedIn />
        <ExpertiseCards />
        <ProjectShowcase />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
