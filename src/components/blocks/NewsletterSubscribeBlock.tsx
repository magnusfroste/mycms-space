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
      toast.success(config.successMessage || 'Tack för din prenumeration!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Kunde inte prenumerera';
      if (message.includes('duplicate')) {
        toast.error('E-postadressen är redan registrerad');
      } else {
        toast.error(message);
      }
    }
  };

  if (isSubmitted) {
    return (
      <section
        className="py-16 px-4"
        style={{ backgroundColor: config.backgroundColor || 'transparent' }}
      >
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2">{config.successMessage || 'Tack!'}</h3>
          <p className="text-muted-foreground">Du får snart ett bekräftelsemail.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="py-16 px-4"
      style={{ backgroundColor: config.backgroundColor || 'transparent' }}
    >
      <div className="max-w-xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-4">{config.heading || 'Prenumerera på nyhetsbrevet'}</h2>
        <p className="text-muted-foreground mb-8">
          {config.description || 'Få de senaste nyheterna direkt i din inkorg.'}
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
