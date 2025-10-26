import { useCallback, useEffect, useState } from 'react';

import { useSignUp } from '@clerk/clerk-react';
import { t, Trans } from '@lingui/macro';
import { CheckCircleIcon, EnvelopeIcon, WarningIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';

import { Button } from '@frontend/components/Button';
import { Input } from '@frontend/components/Input';
import { SEO } from '@frontend/components/SEO';

// Constants
const VERIFICATION_CODE_LENGTH = 6;
const RESEND_SUCCESS_TIMEOUT = 5000;

/**
 * VerifyEmailPage component
 * Displays email verification status and allows users to enter verification code
 */
export const VerifyEmailPage = () => {
  // ==================== State ====================
  const [verificationCode, setVerificationCode] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== Hooks ====================
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  // ==================== Effects ====================
  useEffect(() => {
    if (!isLoaded) return;

    // If no sign up in progress, redirect to register
    if (!signUp) {
      navigate('/auth/register', { replace: true });
      return;
    }

    // If sign up is complete, redirect to dashboard
    if (signUp.status === 'complete') {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Note: We don't call prepareEmailAddressVerification here because
    // it's already been called during registration. This prevents sending
    // duplicate verification emails.
  }, [isLoaded, signUp, navigate]);

  // ==================== Event Handlers ====================
  const handleVerifyCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!verificationCode.trim()) {
        setError(t`Please enter the verification code`);
        return;
      }

      if (!signUp) return;

      setIsVerifying(true);
      setError(null);

      try {
        const result = await signUp.attemptEmailAddressVerification({
          code: verificationCode,
        });

        if (result.status === 'complete') {
          // Set the session as active
          await setActive({ session: result.createdSessionId });
          navigate('/dashboard', { replace: true });
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        setError(
          err?.errors?.[0]?.message || t`Invalid verification code. Please check and try again.`
        );
      } finally {
        setIsVerifying(false);
      }
    },
    [verificationCode, signUp, setActive, navigate]
  );

  const handleResendEmail = useCallback(async () => {
    if (!signUp) return;

    try {
      setError(null);
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), RESEND_SUCCESS_TIMEOUT);
    } catch (err: any) {
      console.error('Error sending verification email:', err);
      setError(
        err?.errors?.[0]?.message || t`Failed to send verification email. Please try again.`
      );
    }
  }, [signUp]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
  }, []);

  // ==================== Early Returns ====================
  if (!isLoaded) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">{t`Loading...`}</p>
      </div>
    );
  }

  if (!signUp) {
    return null;
  }

  // ==================== Render ====================

  return (
    <>
      <SEO
        title="Verify Email"
        description="Verify your email address to complete your CursorRulesCraft account setup."
        url="https://cursorrulescraft.com/auth/verify-email"
        noindex={true}
      />

      <div className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
            <EnvelopeIcon className="size-8" weight="duotone" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">{t`Verify Your Email`}</h2>
          <p className="text-muted-foreground text-sm">
            <Trans>
              We've sent a verification code to{' '}
              <strong className="text-foreground">{signUp.emailAddress}</strong>
            </Trans>
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 border-muted rounded-lg border p-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            <Trans>
              Please enter the 6-digit verification code from your email. If you don't see the
              email, check your spam folder.
            </Trans>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
            <WarningIcon className="mt-0.5 size-4 shrink-0" weight="fill" />
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {resendSuccess && (
          <div className="text-success flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200">
            <CheckCircleIcon className="size-4 shrink-0" weight="fill" />
            <p>{t`Verification email sent! Please check your inbox.`}</p>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="verificationCode" className="text-sm font-medium leading-none">
              {t`Verification Code`}
            </label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="000000"
              maxLength={VERIFICATION_CODE_LENGTH}
              value={verificationCode}
              onChange={handleCodeChange}
              disabled={isVerifying}
              className="text-center text-lg tracking-widest"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <Button type="submit" disabled={isVerifying} className="w-full" size="lg">
            {isVerifying ? t`Verifying...` : t`Verify Email`}
          </Button>
        </form>

        {/* Resend Button */}
        <div className="text-center">
          <Button
            onClick={handleResendEmail}
            variant="link"
            className="h-auto p-0 text-sm"
            disabled={resendSuccess}
          >
            {t`Didn't receive the code? Resend`}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-muted-foreground text-center text-xs">
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
