import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router';

import { GitHubCallbackPage } from '@/pages/auth/callback/github/page';
import { AuthLayout } from '@/pages/auth/layout';
import { LoginPage } from '@/pages/auth/login/page';
import { RegisterPage } from '@/pages/auth/register/page';
import { SSOCallbackPage } from '@/pages/auth/sso/page';
import { VerifyEmailPage } from '@/pages/auth/verify-email/page';
import { CursorRuleDetailPage } from '@/pages/cursor/rules/page';
import { DashboardLayout } from '@/pages/dashboard/layout';
import { RepositoriesPage } from '@/pages/dashboard/repositories/page';
import { SettingsPage } from '@/pages/dashboard/settings/page';
import { ErrorPage } from '@/pages/error/page';
import { HomeLayout } from '@/pages/home/layout';
import { HomePage } from '@/pages/home/page';
import { Providers } from '@/providers';
import { AuthGuard } from '@/router/guards/AuthGuard';
import { GuestGuard } from '@/router/guards/GuestGuard';

export const routes = createRoutesFromElements(
  <Route element={<Providers />}>
    <Route errorElement={<ErrorPage />}>
      <Route element={<HomeLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="cursor/rules/:id" element={<CursorRuleDetailPage />} />
      </Route>

      <Route path="auth">
        <Route element={<AuthLayout />}>
          <Route element={<GuestGuard />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          <Route path="verify-email" element={<VerifyEmailPage />} />

          {/* OAuth Callbacks - no auth required */}
          <Route path="callback" element={<SSOCallbackPage />} />
          <Route path="callback/github" element={<GitHubCallbackPage />} />
        </Route>

        <Route index element={<Navigate replace to="/auth/login" />} />
      </Route>

      <Route path="dashboard">
        <Route element={<AuthGuard />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<RepositoriesPage />} />
            <Route path="repositories" element={<RepositoriesPage />} />
          </Route>
          <Route path="settings">
            <Route element={<DashboardLayout />}>
              <Route index element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Route>
  </Route>
);

export const router = createBrowserRouter(routes);
