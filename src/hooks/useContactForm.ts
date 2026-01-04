import { useState } from 'react';
import { toast } from 'sonner';

// Hook that handles contact form submission logic
export const useContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contact form currently runs in demo mode
  // Can be extended to use Supabase for message storage
  const isConfigured = false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Demo mode - simulate submission
      setTimeout(() => {
        toast.success('Message sent!', {
          description: 'Thanks for reaching out. This is a demo mode.',
        });

        setName('');
        setEmail('');
        setMessage('');
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    message,
    setMessage,
    isSubmitting,
    isConfigured,
    handleSubmit,
  };
};
