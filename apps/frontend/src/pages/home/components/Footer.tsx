import { Separator } from '@/components/Separator';
import { Link } from 'react-router';

import { Copyright } from '@/components/Copyright';
import { Logo } from '@/components/Logo';
import { ThemeSwitch } from '@/components/ThemeSwitch';

export const Footer = () => (
  <footer className="bg-background">
    <Separator />

    <div className="container grid py-12 sm:grid-cols-3 lg:grid-cols-4">
      <div className="flex flex-col gap-y-2">
        <Logo size={24} className="-ml-2" />

        <p className="prose prose-sm leading-relaxed opacity-60 dark:prose-invert">
          {`A free and open-source cursor rules builder that helps you craft, customize, and optimize your project cursor rules configuration for better AI-assisted coding.`}
        </p>

        <Copyright className="mt-6" />
      </div>

      <div className="relative col-start-4 flex flex-col items-end justify-end">
        <div className="mb-14 space-y-6 text-right">
          <Link
            to="/meta/privacy-policy"
            className="block text-sm font-medium"
          >{`Privacy Policy`}</Link>
        </div>

        <div className="absolute bottom-0 right-0 lg:space-x-2">
          <ThemeSwitch className="size-8" />
        </div>
      </div>
    </div>
  </footer>
);
