import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Loader2, Check } from 'lucide-react';
import { useCreateSubscriber } from '@/models/newsletter';
import { validateEmail } from '@/lib/utils/validation';
import type { NewsletterSubscribeBlockConfig } from '@/types/blockConfigs';

interface Props {
  config: NewsletterSubscribeBlockConfig;
}

export default function NewsletterSubscribeBlock({ config }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const createSubscriber = useCreateSubscriber();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error('Ange en giltig e-postadress');
      return;
    }

    try {
      await createSubscriber.mutateAsync({
        email: email.trim(),
        name: config.showNameField ? name.trim() : undefined,
      });
      setIsSubmitted(true);
      toast.success(config.successMessage || 'Thank you for subscribing!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not subscribe';
      if (message.includes('duplicate')) {
        toast.error('This email is already registered');
      } else {
        toast.error(message);
      }
    }
  };

  if (isSubmitted) {
    return (
      <section
        className="section-container-sm px-4"
        style={{ backgroundColor: config.backgroundColor || 'transparent' }}
      >
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">{config.successMessage || 'Thanks!'}</h3>
          <p className="text-muted-foreground">You will receive a confirmation email shortly.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="section-container-sm px-4"
      style={{ backgroundColor: config.backgroundColor || 'transparent' }}
    >
      <div className="max-w-xl mx-auto text-center">
        <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
          Newsletter
        </span>
        <h2 className="section-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {config.heading || 'Subscribe to Newsletter'}
        </h2>
        <p className="section-subtitle mt-4 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {config.description || 'Get the latest updates straight to your inbox.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {config.showNameField && (
            <Input
              type="text"
              placeholder="Ditt namn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-md mx-auto"
            />
          )}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Din e-postadress"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={createSubscriber.isPending} className="gap-2">
              {createSubscriber.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {config.buttonText || 'Prenumerera'}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
