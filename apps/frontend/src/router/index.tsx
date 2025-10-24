import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router';

import { GitHubCallbackPage } from "@frontend/pages/auth/callback/github/page";
import { AuthLayout } from "@frontend/pages/auth/layout";
import { LoginPage } from "@frontend/pages/auth/login/page";
import { RegisterPage } from "@frontend/pages/auth/register/page";
import { SSOCallbackPage } from "@frontend/pages/auth/sso/page";
import { VerifyEmailPage } from "@frontend/pages/auth/verify-email/page";
import { CursorRuleDetailPage } from "@frontend/pages/cursor/rules/page";
import { DashboardLayout } from "@frontend/pages/dashboard/layout";
import { RepositoryDetailPage } from "@frontend/pages/dashboard/repositories/detail/page";
import { RepositoriesPage } from "@frontend/pages/dashboard/repositories/page";
import { SettingsPage } from "@frontend/pages/dashboard/settings/page";
import { ErrorPage } from "@frontend/pages/error/page";
import { HomeLayout } from "@frontend/pages/home/layout";
import { HomePage } from "@frontend/pages/home/page";
import { Providers } from "@frontend/providers";
import { AuthGuard } from "@frontend/router/guards/AuthGuard";
import { GuestGuard } from "@frontend/router/guards/GuestGuard";

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
          {/* Repository detail page - no layout for more space */}
          <Route path="repositories/:id" element={<RepositoryDetailPage />} />
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
