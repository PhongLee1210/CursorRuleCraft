import { t } from '@lingui/macro';
import { CheckCircleIcon, SpinnerGapIcon, XCircleIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

export const GitHubCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const githubStatus = searchParams.get('github');
  const message = searchParams.get('message');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // If this is opened in a popup (has opener), notify parent and close
    if (window.opener) {
      if (githubStatus === 'connected') {
        window.opener.postMessage({ type: 'github-oauth-success' }, window.location.origin);
        // Small delay before closing to show success state
        setTimeout(() => {
          window.close();
        }, 500);
      } else if (githubStatus === 'error') {
        window.opener.postMessage({ type: 'github-oauth-error', message }, window.location.origin);
        // Show error for a few seconds before closing
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              window.close();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(countdownInterval);
      }
    } else {
      // If not in a popup, redirect to repositories page
      const delay = githubStatus === 'error' ? 3000 : 1000;
      const timer = setTimeout(() => {
        navigate('/dashboard/repositories');
      }, delay);

      if (githubStatus === 'error') {
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => {
          clearTimeout(timer);
          clearInterval(countdownInterval);
        };
      }

      return () => clearTimeout(timer);
    }
  }, [githubStatus, message, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-4">
        {githubStatus === 'connected' ? (
          <>
            <CheckCircleIcon size={64} className="text-success" weight="fill" />
            <div className="text-center">
              <h2 className="text-2xl font-semibold">{t`GitHub Connected!`}</h2>
              <p className="text-muted-foreground mt-2">
                {window.opener ? t`You can close this window` : t`Redirecting...`}
              </p>
            </div>
          </>
        ) : githubStatus === 'error' ? (
          <>
            <XCircleIcon size={64} className="text-destructive" weight="fill" />
            <div className="max-w-md text-center">
              <h2 className="text-2xl font-semibold">{t`Connection Failed`}</h2>
              <p className="text-muted-foreground mt-2">
                {message || t`Failed to connect GitHub. Please try again.`}
              </p>
              {window.opener && countdown > 0 && (
                <p className="text-muted-foreground/60 mt-4 text-sm">
                  {t`Closing in ${countdown}...`}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <SpinnerGapIcon size={64} className="text-primary animate-spin" />
            <div className="text-center">
              <h2 className="text-2xl font-semibold">{t`Connecting GitHub`}</h2>
              <p className="text-muted-foreground mt-2">{t`Please wait while we complete the connection...`}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
