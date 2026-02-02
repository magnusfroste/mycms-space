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
    case 'hero':
      return {
        name: 'Your Name',
        tagline: 'Your Professional Title & Expertise',
        enable_animations: true,
        animation_style: 'falling-stars',
        features: [
          { icon: 'Rocket', text: 'Feature 1' },
          { icon: 'BarChart', text: 'Feature 2' },
          { icon: 'Brain', text: 'Feature 3' },
        ],
      };

    case 'chat-widget':
      return {
        initial_placeholder: 'Hello! How can I help you today?',
        active_placeholder: 'Type a message...',
        show_quick_actions: true,
        quick_actions: [
          { id: crypto.randomUUID(), label: 'Learn more', message: 'Tell me more about your services', icon: 'Info', enabled: true, order_index: 1 },
          { id: crypto.randomUUID(), label: 'Get in touch', message: 'I would like to discuss a project', icon: 'MessageCircle', enabled: true, order_index: 2 },
        ],
      };

    case 'text-section':
      return {
        title: 'Section Title',
        content: 'Add your content here. This text section can be used for any purpose - about information, descriptions, announcements, or any other textual content you need.',
        alignment: 'left',
      };

    case 'about-split':
      return {
        name: 'About Me',
        intro_text: 'Share your story here. Describe who you are, what you do, and what drives you professionally.',
        additional_text: 'Add more details about your background, experience, and what makes you unique in your field.',
        image_url: '',
        skills: [
          { icon: 'Briefcase', title: 'Skill 1', description: 'Describe your first key skill or area of expertise.' },
          { icon: 'Lightbulb', title: 'Skill 2', description: 'Describe your second key skill or area of expertise.' },
          { icon: 'Target', title: 'Skill 3', description: 'Describe your third key skill or area of expertise.' },
        ],
      };

    case 'featured-carousel':
      return {
        items: [
          { id: crypto.randomUUID(), title: 'Achievement 1', description: 'Describe your first achievement or recognition.', image_url: '', enabled: true, order_index: 1 },
          { id: crypto.randomUUID(), title: 'Achievement 2', description: 'Describe your second achievement or recognition.', image_url: '', enabled: true, order_index: 2 },
          { id: crypto.randomUUID(), title: 'Achievement 3', description: 'Describe your third achievement or recognition.', image_url: '', enabled: true, order_index: 3 },
        ],
      };

    case 'expertise-grid':
      return {
        items: [
          { id: crypto.randomUUID(), icon: 'Code', title: 'Expertise 1', description: 'Describe your first area of expertise.', enabled: true, order_index: 1 },
          { id: crypto.randomUUID(), icon: 'Palette', title: 'Expertise 2', description: 'Describe your second area of expertise.', enabled: true, order_index: 2 },
          { id: crypto.randomUUID(), icon: 'Rocket', title: 'Expertise 3', description: 'Describe your third area of expertise.', enabled: true, order_index: 3 },
          { id: crypto.randomUUID(), icon: 'Users', title: 'Expertise 4', description: 'Describe your fourth area of expertise.', enabled: true, order_index: 4 },
        ],
      };

    case 'project-showcase':
      return {
        show_section: true,
        section_title: 'My Projects',
        section_subtitle: 'Explore my work',
        section_description: 'A collection of projects showcasing my skills and experience.',
        projects: [],
      };

    case 'image-text':
      return {
        title: 'Image & Text Section',
        content: 'Add descriptive content here that complements the image.',
        image_url: '',
        image_position: 'left',
        cta_text: 'Learn More',
        cta_link: '#',
      };

    case 'cta-banner':
      return {
        title: 'Ready to Get Started?',
        description: 'Add a compelling call-to-action message here.',
        button_text: 'Contact Me',
        button_link: '#contact',
        variant: 'primary',
      };

    case 'spacer':
      return {
        height: 'md',
      };

    case 'video-hero':
      return {
        video_url: '',
        title: 'Video Hero Title',
        subtitle: 'Add a subtitle for your video section',
        overlay_opacity: 0.5,
      };

    case 'parallax-section':
      return {
        background_image: '',
        title: 'Parallax Section',
        content: 'Add content for your parallax section.',
        height: 'md',
      };

    case 'bento-grid':
      return {
        items: [
          { id: crypto.randomUUID(), title: 'Item 1', description: 'Description for item 1', icon: 'Star', size: 'large', enabled: true },
          { id: crypto.randomUUID(), title: 'Item 2', description: 'Description for item 2', icon: 'Heart', size: 'small', enabled: true },
          { id: crypto.randomUUID(), title: 'Item 3', description: 'Description for item 3', icon: 'Zap', size: 'small', enabled: true },
          { id: crypto.randomUUID(), title: 'Item 4', description: 'Description for item 4', icon: 'Globe', size: 'medium', enabled: true },
        ],
      };

    case 'marquee':
      return {
        items: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
        speed: 'normal',
        direction: 'left',
      };

    case 'stats-counter':
      return {
        items: [
          { id: crypto.randomUUID(), value: 100, suffix: '+', label: 'Projects Completed', enabled: true },
          { id: crypto.randomUUID(), value: 50, suffix: '+', label: 'Happy Clients', enabled: true },
          { id: crypto.randomUUID(), value: 10, suffix: '+', label: 'Years Experience', enabled: true },
        ],
      };

    case 'testimonial-carousel':
      return {
        items: [
          { id: crypto.randomUUID(), quote: 'Add a testimonial quote here.', author: 'Client Name', role: 'Position, Company', image_url: '', enabled: true },
          { id: crypto.randomUUID(), quote: 'Add another testimonial quote here.', author: 'Client Name', role: 'Position, Company', image_url: '', enabled: true },
        ],
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

    case 'newsletter-subscribe':
      return {
        heading: 'Subscribe to Newsletter',
        description: 'Get the latest news directly to your inbox.',
        buttonText: 'Subscribe',
        successMessage: 'Thank you for subscribing!',
        showNameField: false,
        backgroundColor: '',
      };

    default:
      return {};
  }
};
