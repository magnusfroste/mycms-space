// Form validation utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateContactForm = (data: {
  name: string;
  email: string;
  message: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Invalid email address';
  }

  if (!data.message.trim()) {
    errors.message = 'Message is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
