import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface PinAuthProps {
  onAuthenticated: () => void;
}

const ADMIN_PIN = '1225';

export const PinAuth = ({ onAuthenticated }: PinAuthProps) => {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('admin_authenticated', 'true');
      onAuthenticated();
      toast.success('Welcome to the admin panel');
    } else {
      toast.error('Please try again');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Enter PIN to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="text-center text-2xl tracking-widest"
            autoFocus
          />
          <Button type="submit" className="w-full">
            Access Admin
          </Button>
        </form>
      </div>
    </div>
  );
};
