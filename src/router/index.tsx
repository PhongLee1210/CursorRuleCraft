import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router';

import { AuthGuard } from '@/guards/AuthGuard';
import { GuestGuard } from '@/guards/GuestGuard';
import { AuthLayout } from '@/layouts/AuthLayout';
import { authLoader } from '@/loaders/authLoader';
import { DashboardPage } from '@/pages/DashboardPage';
import { ErrorPage } from '@/pages/ErrorPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { HomeLayout } from '@/pages/home/layout';
import { HomePage } from '@/pages/home/page';
import { Providers } from '@/providers';

export const routes = createRoutesFromElements(
  <Route element={<Providers />}>
    <Route errorElement={<ErrorPage />}>
      <Route element={<HomeLayout />}>
        <Route path="/" element={<HomePage />} />
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
          <Route path="callback" loader={authLoader} element={<div />} />
        </Route>

        <Route index element={<Navigate replace to="/auth/login" />} />
      </Route>

      <Route path="dashboard">
        <Route element={<AuthGuard />}>
          <Route index element={<DashboardPage />} />
        </Route>
      </Route>
    </Route>
  </Route>
);

export const router = createBrowserRouter(routes);
