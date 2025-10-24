import { useUser } from '@clerk/clerk-react';
import { i18n } from '@lingui/core';
import { detect, fromStorage, fromUrl } from '@lingui/detect-locale';
import { I18nProvider } from '@lingui/react';
import { useEffect } from 'react';

import { defaultLocale, dynamicActivate } from "@frontend/lib/lingui";

// Languages
export type LanguageType = {
  id: string;
  name: string;
  locale: string;
  editorCode: string;
  progress?: number;
};

export const languages: LanguageType[] = [
  { id: 'en-US', name: 'English', editorCode: 'en', locale: 'en-US' },
];

type Props = {
  children: React.ReactNode;
};

export const LocaleProvider = ({ children }: Props) => {
  const { user } = useUser();
  // Get locale from Clerk user metadata or fallback to default
  const userLocale = (user?.publicMetadata?.locale as string) ?? defaultLocale;

  useEffect(() => {
    const detectedLocale =
      detect(fromUrl('locale'), fromStorage('locale'), userLocale, defaultLocale) ?? defaultLocale;

    // Activate the locale only if it's supported
    if (languages.some((lang) => lang.locale === detectedLocale)) {
      void dynamicActivate(detectedLocale);
    } else {
      void dynamicActivate(defaultLocale);
    }
  }, [userLocale]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};

export const changeLanguage = async (locale: string) => {
  // Update locale in local storage
  window.localStorage.setItem('locale', locale);

  // TODO: Update locale in Clerk user metadata if needed
  // You can use Clerk's user.update({ publicMetadata: { locale } }) if you want to persist locale

  // Reload the page for language switch to take effect
  window.location.reload();
};
