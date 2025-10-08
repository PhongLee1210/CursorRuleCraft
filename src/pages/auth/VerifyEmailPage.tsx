import { Button } from '@/components/Button';
import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

/**
 * VerifyEmailPage component
 * Displays email verification status and instructions
 */
export const VerifyEmailPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // If email is already verified, redirect to dashboard
    if (isLoaded && user?.primaryEmailAddress?.verification?.status === 'verified') {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, user, navigate]);

  if (!isLoaded) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const handleResendEmail = async () => {
    try {
      await user?.primaryEmailAddress?.prepareVerification({
        strategy: 'email_code',
      });
      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('Failed to send verification email. Please try again.');
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Verify Your Email</h2>
        <p className="text-muted-foreground text-sm">
          We've sent a verification email to{' '}
          <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
        </p>
      </div>

      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm">
          Please check your email and click the verification link to activate your account.
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={handleResendEmail} variant="outline" className="w-full">
          Resend Verification Email
        </Button>
        <Button onClick={() => navigate('/dashboard')} className="w-full">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};
