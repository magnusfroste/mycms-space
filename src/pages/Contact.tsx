// ============================================
// Contact Page
// Dedicated /contact route reusing the contact form block
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/common/SEOHead';
import ContactFormBlock from '@/components/blocks/ContactFormBlock';
import { useMainLandingPage } from '@/models/pages';
import { usePageBlocks } from '@/models/pageBlocks';
import { useAnalytics } from '@/hooks/useAnalytics';

const Contact = () => {
  useAnalytics('contact');

  // Reuse the landing page's contact form settings (button text, success message...) when present
  const { data: mainPage } = useMainLandingPage();
  const { data: homeBlocks } = usePageBlocks(mainPage?.slug || 'home');
  const contactBlockConfig = homeBlocks?.find((b) => b.block_type === 'contact-form')?.block_config || {};

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Contact"
        description="Get in touch with Magnus Froste about consulting assignments, roles or projects."
      />
      <Header />
      <main className="flex-grow">
        <section className="pt-16 md:pt-24 pb-10 md:pb-12">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
              Contact
            </span>
            <h1 className="section-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Let's work together
            </h1>
            <p className="section-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Looking for a consultant, discussing a role or have a project in mind?
              Send me a message and I'll get back to you.
            </p>
            <p className="mt-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <MessageSquare className="inline w-4 h-4 mr-1.5 -mt-0.5" aria-hidden="true" />
              Prefer a quick answer first?{' '}
              <Link to="/chat" className="text-primary font-medium hover:underline">
                Ask my AI agent
              </Link>
            </p>
          </div>
        </section>

        <ContactFormBlock config={{ ...contactBlockConfig, showHeader: false }} />
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
