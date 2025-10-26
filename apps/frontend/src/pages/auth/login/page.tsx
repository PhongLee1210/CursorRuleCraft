import { useState } from 'react';

import { t, Trans } from '@lingui/macro';
import { ArrowRightIcon, EyeIcon, EyeSlashIcon, WarningIcon } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';

import { Button } from '@frontend/components/Button';
import { Input } from '@frontend/components/Input';
import { SEO } from '@frontend/components/SEO';
import { useLogin } from '@frontend/services/auth';



interface LoginFormData {
  identifier: string;
  password: string;
}

export const LoginPage = () => {
  const { login, isLoading } = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const result = await login(data);

      // If login is successful and status is complete, redirect
      if (result.status === 'complete') {
        // Check if there's a saved location to redirect back to (from AuthGuard or WorkspaceProvider)
        const from = (location.state as any)?.from;

        if (from?.pathname && from.pathname !== '/auth/login') {
          // Redirect to the saved location with full path
          navigate(`${from.pathname}${from.search || ''}${from.hash || ''}`, { replace: true });
        } else {
          // Default redirect to dashboard
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err?.errors?.[0]?.message ||
          t`Invalid email or password. Please check your credentials and try again.`
      );
    }
  };

  return (
    <>
      <SEO
        title="Sign In"
        description="Sign in to your CursorRulesCraft account to manage your cursor rules and projects."
        url="https://cursorrulescraft.com/auth/login"
        noindex={true}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{t`Welcome back`}</h2>
          <p className="text-muted-foreground text-sm">
            <Trans>Sign in to your account to continue</Trans>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
            <WarningIcon className="mt-0.5 size-4 shrink-0" weight="fill" />
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email/Username Field */}
          <div className="space-y-2">
            <label htmlFor="identifier" className="text-sm font-medium leading-none">
              {t`Email or Username`}
            </label>
            <Input
              id="identifier"
              type="text"
              placeholder="john.doe@example.com"
              autoComplete="email"
              disabled={isLoading}
              {...register('identifier', {
                required: t`Email or username is required`,
              })}
              className={errors.identifier ? 'border-error' : ''}
            />
            {errors.identifier && <p className="text-error text-sm">{errors.identifier.message}</p>}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none">
              {t`Password`}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                {...register('password', {
                  required: t`Password is required`,
                  minLength: {
                    value: 8,
                    message: t`Password must be at least 8 characters`,
                  },
                })}
                className={errors.password ? 'border-error pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-error text-sm">{errors.password.message}</p>}
            <p className="text-muted-foreground text-xs">
              <Trans>
                Hold <b>Ctrl</b> to display your password temporarily
              </Trans>
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full" size="lg">
            {isLoading ? t`Signing in...` : t`Sign in`}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="space-y-4 text-center text-sm">
          <div>
            <span className="text-muted-foreground">{t`Don't have an account?`} </span>
            <Button asChild variant="link" className="h-auto p-0 font-semibold">
              <Link to="/auth/register">
                {t`Create one now`}
                <ArrowRightIcon className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
