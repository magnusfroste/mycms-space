// ============================================
// Contact Form Block - 2026 Design System
// Elegant form with subtle animations
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useCreateContactMessage } from '@/models/contactMessages';
import { validateEmail } from '@/lib/utils/validation';
import { useIsStudio } from '@/hooks/useCurrentTheme';
import { cn } from '@/lib/utils';

interface ContactFormBlockConfig {
  title?: string;
  subtitle?: string;
  showSubject?: boolean;
  buttonText?: string;
  successMessage?: string;
  /** Hide the eyebrow/title/subtitle (e.g. when the page provides its own heading) */
  showHeader?: boolean;
}

interface ContactFormBlockProps {
  config: ContactFormBlockConfig;
}

const ContactFormBlock: React.FC<ContactFormBlockProps> = ({ config }) => {
  const {
    title = 'Get in Touch',
    subtitle = 'Have a project or idea? Send me a message and I\'ll get back to you soon.',
    showSubject = true,
    buttonText = 'Send Message',
    successMessage = 'Thanks for reaching out! I\'ll get back to you soon.',
    showHeader = true,
  } = config;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const createMessage = useCreateContactMessage();
  const isStudio = useIsStudio();
  // Studio without header: the page around it provides layout and heading
  const bare = isStudio && !showHeader;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be under 100 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    } else if (formData.email.length > 255) {
      newErrors.email = 'Email must be under 255 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length > 2000) {
      newErrors.message = 'Message must be under 2000 characters';
    }

    if (showSubject && formData.subject.length > 200) {
      newErrors.subject = 'Subject must be under 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await createMessage.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: showSubject ? formData.subject.trim() || undefined : undefined,
        message: formData.message.trim(),
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      // Error handled by mutation
    }
  };

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (submitted) {
    return (
      <section className={bare ? '' : 'section-container'}>
        <div className={bare ? '' : 'container max-w-2xl mx-auto px-4'}>
          <div className={cn('elevated-card text-center animate-scale-in', isStudio ? 'p-8 md:p-10' : 'p-12')}>
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">{successMessage}</h3>
            <Button
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="mt-6 rounded-full px-8"
            >
              Send Another Message
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        bare
          ? 'relative'
          : isStudio
            ? 'relative border-t border-border/70 py-16 md:py-20'
            : showHeader
              ? 'section-container relative overflow-hidden'
              : 'pb-20 md:pb-28 relative overflow-hidden'
      )}
    >
      {/* Background */}
      {!isStudio && <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30" />}

      <div className={cn('relative', bare ? '' : isStudio ? 'mx-auto max-w-[720px] px-4 sm:px-6' : 'container max-w-3xl mx-auto px-4')}>
        {/* Header */}
        {showHeader && (
          <div className={isStudio ? 'mb-8' : 'text-center mb-12'}>
            <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
              Contact
            </span>
            <h2 
              className={cn("section-title animate-fade-in", isStudio && "!text-left")}
              style={{ animationDelay: '0.1s' }}
            >
              {title}
            </h2>
            {subtitle && (
              <p 
                className={cn("section-subtitle mt-4 animate-fade-in", isStudio && "!mx-0 !text-left")}
                style={{ animationDelay: '0.2s' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className={cn(
            'animate-fade-in',
            isStudio
              ? 'rounded-[14px] border border-border bg-card p-6 md:p-8 space-y-5'
              : 'elevated-card p-8 md:p-12 space-y-6'
          )}
          style={{ animationDelay: '0.3s' }}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange('name')}
                className={`input-field ${errors.name ? 'border-destructive focus:ring-destructive/20' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-destructive animate-fade-in">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={handleChange('email')}
                className={`input-field ${errors.email ? 'border-destructive focus:ring-destructive/20' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
              )}
            </div>
          </div>

          {showSubject && (
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="What's this about?"
                value={formData.subject}
                onChange={handleChange('subject')}
                className={`input-field ${errors.subject ? 'border-destructive focus:ring-destructive/20' : ''}`}
              />
              {errors.subject && (
                <p className="text-sm text-destructive animate-fade-in">{errors.subject}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Tell me about your project or question..."
              rows={6}
              value={formData.message}
              onChange={handleChange('message')}
              className={`input-field resize-none ${errors.message ? 'border-destructive focus:ring-destructive/20' : ''}`}
            />
            {errors.message && (
              <p className="text-sm text-destructive animate-fade-in">{errors.message}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className={cn('w-full btn-primary text-base', isStudio ? '!h-12 !py-0' : '!py-4')}
            disabled={createMessage.isPending}
          >
            {createMessage.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {buttonText}
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default ContactFormBlock;