import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  const { toast } = useToast();

  const validateEmail = () => {
    try {
      emailSchema.parse({ email });
      setError('');
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0]?.message || 'Invalid email');
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send reset email. Please try again.',
          variant: 'destructive',
        });
      } else {
        setEmailSent(true);
        toast({
          title: 'Email Sent',
          description: 'Check your inbox for the password reset link.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-hero-dark relative px-4 py-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(280,50%,20%,0.3)_0%,_transparent_50%)]" />
        
        <div className="relative z-10 w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-white">QP Hub</span>
          </Link>

          <Card className="border-border/30 bg-card/95 backdrop-blur-sm shadow-2xl">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
              <p className="text-muted-foreground mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEmailSent(false)}
                >
                  Try Different Email
                </Button>
                <Link to="/auth">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero-dark relative px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(280,50%,20%,0.3)_0%,_transparent_50%)]" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-white">QP Hub</span>
        </Link>

        <Card className="border-border/30 bg-card/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="inline-block mr-1 h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
