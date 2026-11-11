// ============================================
// Admin sign-in — same quiet look as the public site (studio theme).
// Sign-up is closed on the server, so there is no sign-up form.
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useHeaderModule } from '@/models/modules';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { config: headerConfig } = useHeaderModule();
  const wordmark = headerConfig?.logo_text || window.location.host.replace(/^www\./, '');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-[1072px] items-center px-4 sm:px-6">
          <Link to="/" className="text-[15px] font-bold tracking-[-0.01em] text-foreground">
            {wordmark}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-[380px]">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-foreground">Sign in</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">Admin for {wordmark}.</p>

          <form onSubmit={handleSignIn} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-full text-[15px]" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-[13px] text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              ← Back to {wordmark}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};
