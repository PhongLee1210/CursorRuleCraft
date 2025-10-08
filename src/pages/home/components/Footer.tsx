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
        <Logo size={96} className="-ml-2" />

        <h2 className="text-xl font-medium">{`CursorRulesCraft`}</h2>

        <p className="prose prose-sm prose-zinc leading-relaxed opacity-60 dark:prose-invert">
          {`A free and open-source Cursor rules builder that helps you craft, customize, and optimize your project cursor rules configuration for better AI-assisted coding.`}
        </p>

        <Copyright className="mt-6" />
      </div>

      <div className="relative col-start-4 flex flex-col items-end justify-end">
        <div className="mb-14 space-y-6 text-right">
          <a className="block" href="https://m.do.co/c/ceae1fff245e">
            <img
              src="https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/PoweredByDO/DO_Powered_by_Badge_black.svg"
              alt="Powered by DigitalOcean"
              className="block dark:hidden"
              width="150px"
            />
            <img
              src="https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/PoweredByDO/DO_Powered_by_Badge_white.svg"
              alt="Powered by DigitalOcean"
              className="hidden dark:block"
              width="150px"
            />
          </a>

          <Link
            to="/meta/privacy-policy"
            className="block text-sm font-medium"
          >{`Privacy Policy`}</Link>
        </div>

        <div className="absolute bottom-0 right-0 lg:space-x-2">
          <ThemeSwitch />
        </div>
      </div>
    </div>
  </footer>
);
