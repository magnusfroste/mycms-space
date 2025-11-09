import { useState } from 'react';
import { toast } from 'sonner';
import { sendContactMessage } from '@/lib/airtable';
import { hasAirtableConfig } from '@/lib/utils/config';

// Hook that handles contact form submission logic
export const useContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConfigured = hasAirtableConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!isConfigured) {
        // Demo mode - simulate submission
        setTimeout(() => {
          toast.success('Demo mode: Message would be sent to Airtable', {
            description: 'Configure Airtable to store real messages',
          });

          setName('');
          setEmail('');
          setMessage('');
          setIsSubmitting(false);
        }, 1500);
        return;
      }

      // Send message to Airtable
      await sendContactMessage({ name, email, message });

      toast.success('Message sent successfully!', {
        description: "Thanks for reaching out. I'll get back to you soon.",
      });

      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
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
