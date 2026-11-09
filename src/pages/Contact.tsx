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
import { useResumeModule, useFooterModule } from '@/models/modules';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useIsStudio } from '@/hooks/useCurrentTheme';
import { StudioContainer } from '@/components/studio/StudioSection';

const Contact = () => {
  useAnalytics('contact');
  const isStudio = useIsStudio();
  const { config: resume } = useResumeModule();
  const { config: footer } = useFooterModule();

  // Reuse the landing page's contact form settings (button text, success message...) when present
  const { data: mainPage } = useMainLandingPage();
  const { data: homeBlocks } = usePageBlocks(mainPage?.slug || 'home');
  const contactBlockConfig = homeBlocks?.find((b) => b.block_type === 'contact-form')?.block_config || {};

  const linkedIn = footer?.social_links?.find((l) => l.platform === 'linkedin')?.url;
  const available = resume?.owner_availability === 'available';

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Contact"
        description="Get in touch with Magnus Froste about consulting assignments, roles or projects."
      />
      <Header />
      <main className="flex-grow">
        {isStudio ? (
          <StudioContainer className="grid grid-cols-1 gap-12 pb-20 pt-14 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-16">
            <div className="flex min-w-0 flex-col items-start gap-6">
              {available && (
                <span className="inline-flex min-h-[30px] items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-[13px] font-medium text-success">
                  <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-success" aria-hidden="true" />
                  Available for new assignments
                </span>
              )}
              <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[48px]">
                Let's work together
              </h1>
              <p className="max-w-[480px] text-[17px] leading-[1.55] text-foreground/75">
                Looking for a consultant, discussing a role or have a project in mind? Send me a message and I'll
                get back to you.
              </p>
              <div className="w-full max-w-[480px] border-t border-border pt-6">
                <p className="font-mono text-xs text-muted-foreground">Helpful to include</p>
                <ul className="mt-3 space-y-2 text-[15px] text-foreground/80">
                  <li>What the assignment or role is about</li>
                  <li>Timing, scope and whether it is remote or on site</li>
                  <li>How to reach you</li>
                </ul>
              </div>
              <div className="w-full max-w-[480px] border-t border-border pt-6 text-[15px]">
                <p className="text-foreground/80">
                  Prefer a quick answer first?{' '}
                  <Link to="/chat" className="studio-link font-medium">
                    Ask Magnet, my AI twin <span aria-hidden="true">→</span>
                  </Link>
                </p>
                {linkedIn && (
                  <p className="mt-2 text-foreground/80">
                    Or find me on{' '}
                    <a href={linkedIn} target="_blank" rel="noopener noreferrer" className="studio-link font-medium">
                      LinkedIn
                    </a>
                  </p>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <ContactFormBlock config={{ ...contactBlockConfig, showHeader: false }} />
            </div>
          </StudioContainer>
        ) : (
          <>
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
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
