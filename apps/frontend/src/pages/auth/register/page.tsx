import { useState } from 'react';

import { t, Trans } from '@lingui/macro';
import { ArrowRightIcon, EyeIcon, EyeSlashIcon, WarningIcon } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import { Button } from '@frontend/components/Button';
import { Input } from '@frontend/components/Input';
import { SEO } from '@frontend/components/SEO';
import { useRegister } from '@frontend/services/auth';



interface RegisterFormData {
  emailAddress: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export const RegisterPage = () => {
  const { register, isLoading } = useRegister();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      emailAddress: '',
      password: '',
      username: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      const result = await register(data);

      // If registration requires email verification, redirect to verify-email page
      if (
        result.status === 'missing_requirements' ||
        result.verifications?.emailAddress?.status === 'unverified'
      ) {
        navigate('/auth/verify-email');
      } else if (result.status === 'complete') {
        // If registration is complete, redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err?.errors?.[0]?.message ||
          t`Failed to create account. Please try again or use a different email address.`
      );
    }
  };

  return (
    <>
      <SEO
        title="Create Account"
        description="Create your CursorRulesCraft account to start managing your cursor rules and projects."
        url="https://cursorrulescraft.com/auth/register"
        noindex={true}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{t`Create your account`}</h2>
          <p className="text-muted-foreground text-sm">
            <Trans>Get started with CursorRulesCraft today</Trans>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
            <WarningIcon className="mt-0.5 size-4 shrink-0" weight="fill" />
            <p>{error}</p>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium leading-none">
                {t`First Name`}
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                autoComplete="given-name"
                disabled={isLoading}
                {...formRegister('firstName', {
                  required: t`First name is required`,
                })}
                className={errors.firstName ? 'border-error' : ''}
              />
              {errors.firstName && <p className="text-error text-sm">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium leading-none">
                {t`Last Name`}
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                autoComplete="family-name"
                disabled={isLoading}
                {...formRegister('lastName', {
                  required: t`Last name is required`,
                })}
                className={errors.lastName ? 'border-error' : ''}
              />
              {errors.lastName && <p className="text-error text-sm">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium leading-none">
              {t`Username`}
            </label>
            <Input
              id="username"
              type="text"
              placeholder="john.doe"
              autoComplete="username"
              disabled={isLoading}
              {...formRegister('username', {
                required: t`Username is required`,
                minLength: {
                  value: 3,
                  message: t`Username must be at least 3 characters`,
                },
                pattern: {
                  value: /^[a-zA-Z0-9_.-]+$/,
                  message: t`Username can only contain letters, numbers, dots, hyphens, and underscores`,
                },
              })}
              className={errors.username ? 'border-error' : ''}
            />
            {errors.username && <p className="text-error text-sm">{errors.username.message}</p>}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="emailAddress" className="text-sm font-medium leading-none">
              {t`Email`}
            </label>
            <Input
              id="emailAddress"
              type="email"
              placeholder="john.doe@example.com"
              autoComplete="email"
              disabled={isLoading}
              {...formRegister('emailAddress', {
                required: t`Email is required`,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t`Please enter a valid email address`,
                },
              })}
              className={errors.emailAddress ? 'border-error' : ''}
            />
            {errors.emailAddress && (
              <p className="text-error text-sm">{errors.emailAddress.message}</p>
            )}
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
                autoComplete="new-password"
                disabled={isLoading}
                {...formRegister('password', {
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
              <Trans>Use at least 8 characters with a mix of letters, numbers, and symbols</Trans>
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full" size="lg">
            {isLoading ? t`Creating account...` : t`Create account`}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="space-y-4 text-center text-sm">
          <div>
            <span className="text-muted-foreground">{t`Already have an account?`} </span>
            <Button asChild variant="link" className="h-auto p-0 font-semibold">
              <Link to="/auth/login">
                {t`Sign in now`}
                <ArrowRightIcon className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
