import { cn } from '@/lib/utils';
import { t } from '@lingui/macro';
import { useMemo } from 'react';
import { Link, matchRoutes, Outlet, useLocation } from 'react-router';

import { Logo } from '@/components/Logo';
import { useAuthProviders } from '@/hooks/useAuthProviders';

import { SocialAuth } from '@/components/SocialAuth';
import { ThemeSwitch } from '@/components/ThemeSwitch';

const authRoutes = [{ path: '/auth/login' }, { path: '/auth/register' }];

export const AuthLayout = () => {
  const location = useLocation();
  const { providers } = useAuthProviders();
  const isAuthRoute = useMemo(() => matchRoutes(authRoutes, location) !== null, [location]);

  if (!providers) return null;

  // Condition (providers.length === 1) hides the divider if providers[] includes only "email"
  const hideDivider = !providers.includes('email') || providers.length === 1;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="relative flex w-full flex-col justify-center gap-y-8 px-12 sm:mx-auto sm:w-[420px] sm:flex-shrink-0 sm:px-0 lg:w-[480px] lg:px-0">
        <div className="top-2 z-10 flex w-full items-center justify-between px-12 sm:px-0 lg:absolute lg:pl-12 lg:pr-4">
          <Link to="/" className="block">
            <Logo size={24} />
          </Link>

          <ThemeSwitch />
        </div>

        <div className="px-12 sm:px-0 lg:px-12">
          <Outlet />
        </div>

        {isAuthRoute && (
          <div className="px-12 sm:px-0 lg:px-12">
            <div className={cn('flex items-center gap-x-4', hideDivider && 'hidden')}>
              <hr className="flex-1" />
              <span className="text-xs font-medium">
                {t({
                  message: 'or continue with',
                  context:
                    'The user can either login with email/password, or continue with GitHub or Google.',
                })}
              </span>
              <hr className="flex-1" />
            </div>

            <SocialAuth />
          </div>
        )}
      </div>

      <div className="relative hidden lg:block lg:flex-1">
        <img
          width={1920}
          height={1080}
          alt="AI?"
          className="h-screen w-full object-cover object-center"
          src="https://unsplash.com/photos/a-sign-with-a-question-mark-and-a-question-mark-drawn-on-it-OAsF0QMRWlA"
        />

        <div className="bg-primary/30 text-primary-foreground absolute bottom-5 right-5 z-10 px-4 py-2 text-xs font-medium backdrop-blur-sm">
          <a
            target="_blank"
            rel="noopener noreferrer nofollow"
            href="https://unsplash.com/photos/a-sign-with-a-question-mark-and-a-question-mark-drawn-on-it-OAsF0QMRWlA"
          >
            {t`Photograph by Nahrizul Kadri`}
          </a>
        </div>
      </div>
    </div>
  );
};
