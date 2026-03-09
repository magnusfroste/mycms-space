import React from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Circle, AlertCircle, Key, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { IntegrationStatus } from './IntegrationListItem';

interface IntegrationDetailSheetProps {
  open: boolean;
  onClose: () => void;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  isActive: boolean;
  isAvailable: boolean;
  isConfigured: IntegrationStatus;
  showActivate: boolean;
  onActivate: () => void;
  children?: React.ReactNode;
}

const IntegrationDetailSheet: React.FC<IntegrationDetailSheetProps> = ({
  open,
  onClose,
  name,
  description,
  icon,
  iconColor,
  isActive,
  isAvailable,
  isConfigured,
  showActivate,
  onActivate,
  children,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const statusBadge = () => {
    if (!isAvailable) return <Badge variant="outline" className="text-xs">Coming Soon</Badge>;
    if (isConfigured === 'connected') return (
      <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
        <Circle className="h-2 w-2 mr-1.5 fill-green-500 text-green-500" />
        Connected
      </Badge>
    );
    if (isConfigured === true) return (
      <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
        <Check className="h-3 w-3 mr-1" />
        Ready
      </Badge>
    );
    if (isConfigured === 'requires_secret') return (
      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
        <Key className="h-3 w-3 mr-1" />
        Requires secret
      </Badge>
    );
    return (
      <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Not configured
      </Badge>
    );
  };

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close integration details"
        onClick={onClose}
        className="fixed inset-0 z-[120]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${name} integration details`}
        className="fixed right-0 top-0 h-full w-full max-w-md border-l border-border bg-background shadow-xl animate-slide-in-right z-[121]"
      >
        <div className="h-full overflow-y-auto p-6">
          {/* Header */}
          <header className="pb-4">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted ${iconColor}`}>
                {icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              </div>
            </div>
          </header>

          {/* Status + Activate */}
          <div className="flex items-center justify-between py-3">
            {statusBadge()}
            {isActive && (
              <Badge variant="default" className="text-xs gap-1">
                <Zap className="h-3 w-3" /> Active for Chat
              </Badge>
            )}
          </div>

          {showActivate && !isActive && isAvailable && (
            <Button size="sm" onClick={onActivate} className="w-full mb-4">
              Use for Chat
            </Button>
          )}

          <Separator />

          {/* Configuration content */}
          {isAvailable && children && (
            <div className="py-4 space-y-4">
              {children}
            </div>
          )}
        </div>
      </section>
    </>,
    document.body
  );
};

export default IntegrationDetailSheet;
