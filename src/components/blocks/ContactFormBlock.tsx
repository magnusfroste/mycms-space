// ============================================
// Contact Form Block
// A simple, elegant contact form
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader2 } from 'lucide-react';
import { useCreateContactMessage } from '@/models/contactMessages';
import { validateEmail } from '@/lib/utils/validation';

interface ContactFormBlockConfig {
  title?: string;
  subtitle?: string;
  showSubject?: boolean;
  buttonText?: string;
  successMessage?: string;
}

interface ContactFormBlockProps {
  config: ContactFormBlockConfig;
}

const ContactFormBlock: React.FC<ContactFormBlockProps> = ({ config }) => {
  const {
    title = 'Kontakta mig',
    subtitle = 'Har du ett projekt eller en idé? Skicka ett meddelande så återkommer jag så snart jag kan.',
    showSubject = true,
    buttonText = 'Skicka meddelande',
    successMessage = 'Tack för ditt meddelande! Jag återkommer så snart jag kan.',
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Namn krävs';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Namn får max vara 100 tecken';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-post krävs';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Ogiltig e-postadress';
    } else if (formData.email.length > 255) {
      newErrors.email = 'E-post får max vara 255 tecken';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Meddelande krävs';
    } else if (formData.message.length > 2000) {
      newErrors.message = 'Meddelande får max vara 2000 tecken';
    }

    if (showSubject && formData.subject.length > 200) {
      newErrors.subject = 'Ämne får max vara 200 tecken';
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
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-sm border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">{successMessage}</h3>
            <Button
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="mt-4"
            >
              Skicka ett till meddelande
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground text-lg">{subtitle}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 md:p-10 shadow-sm border space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                placeholder="Ditt namn"
                value={formData.name}
                onChange={handleChange('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-post *</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@email.se"
                value={formData.email}
                onChange={handleChange('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          {showSubject && (
            <div className="space-y-2">
              <Label htmlFor="subject">Ämne</Label>
              <Input
                id="subject"
                placeholder="Vad gäller det?"
                value={formData.subject}
                onChange={handleChange('subject')}
                className={errors.subject ? 'border-destructive' : ''}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Meddelande *</Label>
            <Textarea
              id="message"
              placeholder="Beskriv ditt projekt eller din fråga..."
              rows={5}
              value={formData.message}
              onChange={handleChange('message')}
              className={errors.message ? 'border-destructive' : ''}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={createMessage.isPending}
          >
            {createMessage.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Skickar...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
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
