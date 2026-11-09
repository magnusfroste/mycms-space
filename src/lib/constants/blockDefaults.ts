// ============================================
// Block Default Configurations
// Generic placeholder content for new blocks
// ============================================

import type { BlockType } from '@/types';

/**
 * Returns generic placeholder content for a new block.
 * These defaults are intentionally generic and not tied to any specific brand/person.
 * Existing blocks with content remain untouched - this only affects NEW blocks.
 */
export const getDefaultBlockConfig = (blockType: BlockType): Record<string, unknown> => {
  switch (blockType) {
    case 'chat-hero':
      return {
        agent_name: 'AI Assistant',
        agent_tagline: 'How can I help you today?',
        welcome_badge: 'Welcome',
        enable_animations: true,
        animation_style: 'falling-stars',
        placeholder: 'Ask me anything...',
        show_quick_actions: true,
        quick_actions: [
          { id: crypto.randomUUID(), label: 'Learn more', message: 'Tell me more about yourself', icon: 'Info', enabled: true, order_index: 1 },
          { id: crypto.randomUUID(), label: 'Get in touch', message: 'I would like to discuss a project', icon: 'MessageCircle', enabled: true, order_index: 2 },
        ],
      };

    case 'text-section':
      return {
        title: 'Section Title',
        content: 'Add your content here. This text section can be used for any purpose - about information, descriptions, announcements, or any other textual content you need.',
        alignment: 'left',
      };

    case 'expertise-grid':
      return {
        title: 'What I Do',
        subtitle: 'How I can help you achieve your goals',
        items: [
          { id: crypto.randomUUID(), icon: 'Rocket', title: 'Service 1', description: 'Describe your first service or offering.', cta_text: 'Learn more', cta_link: '#', enabled: true, order_index: 1 },
          { id: crypto.randomUUID(), icon: 'Palette', title: 'Service 2', description: 'Describe your second service or offering.', cta_text: 'Learn more', cta_link: '#', enabled: true, order_index: 2 },
          { id: crypto.randomUUID(), icon: 'Code', title: 'Service 3', description: 'Describe your third service or offering.', cta_text: 'Learn more', cta_link: '#', enabled: true, order_index: 3 },
        ],
      };

    case 'cta-banner':
      return {
        title: 'Ready to Get Started?',
        description: 'Add a compelling call-to-action message here.',
        button_text: 'Contact Me',
        button_link: '#contact',
        variant: 'primary',
      };

    case 'contact-form':
      return {
        title: 'Get in Touch',
        description: 'Fill out the form below and I will get back to you as soon as possible.',
        show_subject: true,
        submit_button_text: 'Send Message',
      };

    case 'blog':
      return {
        display_mode: 'latest',
        layout: 'grid',
        posts_count: 6,
        show_excerpt: true,
        show_reading_time: true,
        show_categories: true,
        show_author: false,
        heading: 'Latest Posts',
        subheading: '',
      };

    case 'github':
      return {
        username: '',
        title: 'Open Source Projects',
        subtitle: 'My contributions to the open source community',
        showProfile: true,
        showStats: true,
        showLanguages: true,
        showTopics: true,
        maxRepos: 6,
        layout: 'grid',
        sortBy: 'pushed',
      };

    default:
      return {};
  }
};
