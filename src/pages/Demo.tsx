
import React from 'react';
import ContactForm from '@/components/ContactForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Demo = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-white to-gray-100">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Live Demo Available</h1>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="text-xl leading-relaxed mb-6">
                I'm excited to offer personalized demonstrations of this AI initiative and proof of concept.
              </p>
              <p className="text-xl leading-relaxed mb-6">
                Sometimes, seeing is better than exploring on your own. I'd be happy to walk you through the project, 
                explain the technical aspects, and show how it can be adapted to your specific use case.
              </p>
              <p className="text-xl leading-relaxed">
                Please use the contact form below to schedule a convenient time for a live demonstration.
              </p>
            </div>
          </div>
        </section>
        
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Demo;
