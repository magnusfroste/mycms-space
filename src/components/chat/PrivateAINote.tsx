import { ShieldCheck } from 'lucide-react';
import { useAIModule } from '@/models/modules';
import { cn } from '@/lib/utils';
import { usesPrivateAI } from '@/lib/privateAI';

/**
 * "Runs on private AI" note next to the chat. Shown only when Magnet's
 * provider is GarageAI, so it is never claimed for a public cloud model.
 */
export default function PrivateAINote({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { config } = useAIModule();
  if (!usesPrivateAI(config)) return null;
  return (
    <p className={cn('flex items-start justify-center gap-1.5 text-[12px] leading-snug text-muted-foreground', className)}>
      <ShieldCheck aria-hidden="true" className="mt-[1px] h-3.5 w-3.5 shrink-0 text-accent" />
      <span>
        {compact ? 'Private AI · ' : 'Magnet runs on '}
        <a
          href="https://garageai.eu"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground/80 underline underline-offset-2 hover:text-foreground"
        >
          GarageAI
        </a>
        {compact
          ? ' · European hardware, no public cloud'
          : ': private AI on European hardware, no public cloud. Your questions never leave it.'}
      </span>
    </p>
  );
}
