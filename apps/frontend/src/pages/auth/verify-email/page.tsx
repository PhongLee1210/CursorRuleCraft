import { Button } from '@/components/Button';
import { SEO } from '@/components/SEO';
import { useUser } from '@clerk/clerk-react';
import { t, Trans } from '@lingui/macro';
import { CheckCircleIcon, EnvelopeIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

/**
 * VerifyEmailPage component
 * Displays email verification status and instructions
 */
export const VerifyEmailPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // If email is already verified, redirect to dashboard
    if (isLoaded && user?.primaryEmailAddress?.verification?.status === 'verified') {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, user, navigate]);

  if (!isLoaded) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">{t`Loading...`}</p>
      </div>
    );
  }

  const handleResendEmail = async () => {
    try {
      await user?.primaryEmailAddress?.prepareVerification({
        strategy: 'email_code',
      });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert(t`Failed to send verification email. Please try again.`);
    }
  };

  return (
    <>
      <SEO
        title="Verify Email"
        description="Verify your email address to complete your CursorRulesCraft account setup."
        url="https://cursorrulescraft.com/auth/verify-email"
        noindex={true}
      />

      <div className="space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <EnvelopeIcon className="size-8" weight="duotone" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{t`Verify Your Email`}</h2>
          <p className="text-muted-foreground text-sm">
            <Trans>
              We've sent a verification email to{' '}
              <strong className="text-foreground">{user?.primaryEmailAddress?.emailAddress}</strong>
            </Trans>
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 border-muted rounded-lg border p-4 text-left">
          <p className="text-muted-foreground text-sm leading-relaxed">
            <Trans>
              Please check your email and click the verification link to activate your account. If
              you don't see the email, check your spam folder or request a new verification email.
            </Trans>
          </p>
        </div>

        {/* Success Message */}
        {resendSuccess && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200">
            <CheckCircleIcon className="size-4 shrink-0" weight="fill" />
            <p>{t`Verification email sent! Please check your inbox.`}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={handleResendEmail} variant="outline" className="w-full" size="lg">
            {t`Resend Verification Email`}
          </Button>
          <Button onClick={() => navigate('/dashboard')} className="w-full" size="lg">
            {t`Go to Dashboard`}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-muted-foreground text-xs">
          <Trans>
            Having trouble? Contact us at{' '}
            <a href="mailto:support@cursorrulescraft.com" className="text-primary hover:underline">
              support@cursorrulescraft.com
            </a>
          </Trans>
        </p>
      </div>
    </>
  );
};
