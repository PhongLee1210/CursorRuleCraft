import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router';

import { AuthGuard } from '@/guards/AuthGuard';
import { GuestGuard } from '@/guards/GuestGuard';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { LoginPage } from '@/pages/auth/login/page';
import { RegisterPage } from '@/pages/auth/register/page';
import { SSOCallbackPage } from '@/pages/auth/sso/page';
import { VerifyEmailPage } from '@/pages/auth/verify-email/page';
import { CursorRuleDetailPage } from '@/pages/CursorRuleDetailPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ErrorPage } from '@/pages/ErrorPage';
import { HomeLayout } from '@/pages/home/layout';
import { HomePage } from '@/pages/home/page';
import { Providers } from '@/providers';

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

          {/* Email Verification - requires authentication */}
          <Route element={<AuthGuard />}>
            <Route path="verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* OAuth Callback */}
          <Route path="callback" element={<SSOCallbackPage />} />
        </Route>

        <Route index element={<Navigate replace to="/auth/login" />} />
      </Route>

      <Route path="dashboard">
        <Route element={<AuthGuard />}>
          <Route element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
          </Route>
        </Route>
      </Route>
    </Route>
  </Route>
);

export const router = createBrowserRouter(routes);
