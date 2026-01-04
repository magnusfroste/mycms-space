import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useContactForm } from '@/hooks/useContactForm';

const ContactForm = () => {
  const {
    name,
    setName,
    email,
    setEmail,
    message,
    setMessage,
    isSubmitting,
    handleSubmit,
  } = useContactForm();

  return (
    <section id="contact" className="py-20 bg-card">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="section-title">Let's Connect</h2>
        
        <p className="text-center text-muted-foreground text-lg mb-10">
          Ready to explore how we can drive innovation and growth together? Let's start a conversation.
        </p>
        
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Your Name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Your Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                Your Message
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field min-h-[150px]"
                placeholder="Your Message"
                required
              />
            </div>
            
            <div className="text-center">
              <Button 
                type="submit" 
                className="apple-button w-full sm:w-auto flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
