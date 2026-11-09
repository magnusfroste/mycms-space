// ============================================
// Chat Hero - Studio variant
// Headline, intro and CTAs on the left; the AI twin as a chat card on the
// right. Submitting (or a suggestion chip) opens /chat with the message.
// ============================================

import React, { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResumeModule } from '@/models/modules';
import SmartLink from '@/components/studio/SmartLink';
import { StudioContainer } from '@/components/studio/StudioSection';
import type { ChatHeroBlockConfig } from '@/types/blockConfigs';
import type { QuickActionConfig, Message } from '@/components/chat/types';

interface ChatHeroStudioProps {
  config: Record<string, unknown>;
}

const pillButton =
  'inline-flex h-12 items-center rounded-full px-[22px] text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const ChatHeroStudio: React.FC<ChatHeroStudioProps> = ({ config }) => {
  const navigate = useNavigate();
  const c = config as ChatHeroBlockConfig;
  const { config: resume } = useResumeModule();
  const [value, setValue] = useState('');
  const headingId = useId();
  const cardHeadingId = useId();
  const inputId = useId();

  const agentName = c.agent_name || 'AI Assistant';
  const headline = c.headline || agentName;
  const intro = c.intro;
  const placeholder = c.placeholder || 'Ask me anything…';

  const isAvailable = resume?.owner_availability ? resume.owner_availability !== 'unavailable' : true;
  const availabilityText =
    c.availability_text ||
    (resume?.owner_availability === 'available' && resume?.availability_note
      ? `Available · ${resume.availability_note}`
      : '');
  const showAvailability = (c.show_availability ?? true) && !!availabilityText && isAvailable;

  const primaryText = c.primary_cta_text || 'Start a conversation';
  const primaryUrl = c.primary_cta_url || '/contact';
  const secondaryText = c.secondary_cta_text ?? 'See selected work';
  const secondaryUrl = c.secondary_cta_url || '#work';

  const cardTitle = c.card_title || `Ask ${agentName}`;
  const cardSubtitle = c.card_subtitle ?? 'Answers from my CV, projects and writing';
  const buttonText = c.card_button_text || 'Ask';

  const quickActions: QuickActionConfig[] = (c.quick_actions || [])
    .filter((a) => a.enabled !== false)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const showQuickActions = (c.show_quick_actions ?? true) && quickActions.length > 0;

  const openChat = (text: string) => {
    const message = text.trim();
    if (!message) return;
    const userMessage: Message = { id: crypto.randomUUID(), text: message, isUser: true };
    navigate('/chat', { state: { fromHero: true, messages: [userMessage], placeholder } });
  };

  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      inputRef.current?.focus();
      return;
    }
    openChat(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      openChat(value);
    }
  };

  return (
    <section aria-labelledby={headingId}>
      <StudioContainer className="grid items-center gap-12 pb-16 pt-14 md:pb-[72px] md:pt-[88px] lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-14">
        {/* Copy */}
        <div className="flex min-w-0 flex-col items-start gap-6">
          {showAvailability && (
            <span className="inline-flex min-h-[30px] items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-[13px] font-medium leading-tight text-success">
              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-success" aria-hidden="true" />
              {availabilityText}
            </span>
          )}
          <h1
            id={headingId}
            className="text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] text-foreground sm:text-[52px] lg:text-[64px] lg:leading-[1.02]"
          >
            {headline}
          </h1>
          {intro && (
            <p className="max-w-[560px] text-[17px] leading-[1.55] text-foreground/75 sm:text-[19px]">{intro}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <SmartLink href={primaryUrl} className={`${pillButton} bg-primary text-primary-foreground hover:bg-primary/85`}>
              {primaryText}
            </SmartLink>
            {secondaryText && (
              <SmartLink
                href={secondaryUrl}
                className={`${pillButton} border border-foreground/15 text-foreground hover:border-foreground/30 hover:bg-muted/60`}
              >
                {secondaryText}
              </SmartLink>
            )}
          </div>
        </div>

        {/* Chat card */}
        <aside
          aria-labelledby={cardHeadingId}
          className="w-full min-w-0 rounded-2xl border border-border bg-card p-5 shadow-[0_12px_32px_-12px_hsl(240_15%_5%/0.12)] dark:shadow-none lg:max-w-[460px] lg:justify-self-end"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[13px] font-bold text-accent"
              >
                {agentName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 id={cardHeadingId} className="text-[15px] font-semibold leading-tight text-foreground">
                  {cardTitle}
                </h2>
                {cardSubtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{cardSubtitle}</p>}
              </div>
            </div>

            <label htmlFor={inputId} className="sr-only">
              Your question
            </label>
            <textarea
              id={inputId}
              ref={inputRef}
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full resize-none rounded-xl border border-border bg-muted/40 p-3 text-[14px] leading-[1.5] text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/15"
            />

            {showQuickActions && (
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id || action.label}
                    type="button"
                    onClick={() => openChat(action.message)}
                    className="inline-flex h-8 items-center rounded-full border border-border bg-background px-3 text-[13px] text-foreground/80 transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="h-[42px] rounded-full bg-accent text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {buttonText}
            </button>
          </form>
        </aside>
      </StudioContainer>
    </section>
  );
};

export default ChatHeroStudio;
