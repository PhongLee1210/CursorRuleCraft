import { HelmetProvider } from 'react-helmet-async';
import { Outlet } from 'react-router';

import { ClerkProvider } from '@/providers/ClerkProvider';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

export const Providers = () => (
  <LocaleProvider>
    <HelmetProvider>
      <ClerkProvider>
        <QueryProvider>
          <ThemeProvider>
            <Outlet />
          </ThemeProvider>
        </QueryProvider>
      </ClerkProvider>
    </HelmetProvider>
  </LocaleProvider>
);
