import { cn } from '@/lib/utils';
import { t } from '@lingui/macro';
import {
  BrainIcon,
  CloudIcon,
  CloudSunIcon,
  CurrencyDollarSimpleIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  FileIcon,
  FilesIcon,
  FolderIcon,
  GitBranchIcon,
  GithubLogoIcon,
  GoogleChromeLogoIcon,
  GoogleLogoIcon,
  IconContext,
  LayoutIcon,
  LockIcon,
  NoteIcon,
  ProhibitIcon,
  ScalesIcon,
  StarIcon,
  SwatchesIcon,
  TextAaIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';

type Feature = {
  icon: React.ReactNode;
  title: string;
  className?: string;
};

const featureLabel = cn(
  'flex cursor-default items-center justify-center gap-x-2 rounded bg-secondary px-4 py-3 text-sm font-medium leading-none text-primary transition-colors hover:bg-primary hover:text-background'
);

export const FeaturesSection = () => {
  const features: Feature[] = [
    { icon: <CurrencyDollarSimpleIcon />, title: t`Free, forever` },
    { icon: <GitBranchIcon />, title: t`Open Source` },
    { icon: <ScalesIcon />, title: t`MIT License` },
    { icon: <ProhibitIcon />, title: t`No user tracking or advertising` },
    { icon: <BrainIcon />, title: t`AI-Powered Rule Generation` },
    { icon: <StarIcon />, title: t`Pre-built Rule Templates` },
    { icon: <FilesIcon />, title: t`Create Custom Rules` },
    { icon: <FolderIcon />, title: t`Organize Rules by Categories` },
    { icon: <FileIcon />, title: t`Export & Import Rules` },
    { icon: <GithubLogoIcon />, title: t`Version Control Ready` },
    { icon: <TextAaIcon />, title: t`Syntax Highlighting` },
    { icon: <EyeIcon />, title: t`Real-time Preview` },
    { icon: <LayoutIcon />, title: t`Multiple Rule Formats` },
    { icon: <SwatchesIcon />, title: t`Customizable Templates` },
    { icon: <NoteIcon />, title: t`Add Documentation Notes` },
    { icon: <LockIcon />, title: t`Secure Authentication` },
    { icon: <CloudIcon />, title: t`Cloud Sync` },
    { icon: <GoogleLogoIcon />, title: t`Sign in with Google` },
    { icon: <EnvelopeSimpleIcon />, title: t`Sign in with Email` },
    { icon: <GoogleChromeLogoIcon />, title: t`Share Rules Publicly` },
    { icon: <CloudSunIcon />, title: t`Light or dark theme` },
    {
      icon: (
        <div className="flex items-center space-x-1">
          <img src="https://cdn.simpleicons.org/react" alt="React" width={14} height={14} />
          <img src="https://cdn.simpleicons.org/vite" alt="Vite" width={14} height={14} />
          <img
            src="https://cdn.simpleicons.org/tailwindcss"
            alt="TailwindCSS"
            width={14}
            height={14}
          />
          <img
            src="https://cdn.simpleicons.org/typescript"
            alt="TypeScript"
            width={14}
            height={14}
          />
          <img src="https://cdn.simpleicons.org/supabase" alt="Supabase" width={14} height={14} />
        </div>
      ),
      title: t`Powered by`,
      className: 'flex-row-reverse',
    },
  ];

  return (
    <section id="features" className="bg-secondary-accent relative py-24 sm:py-32">
      <div className="container">
        <div className="space-y-6 leading-loose">
          <h2 className="text-4xl font-bold">{t`Powerful Cursor Rules Generation, Made Simple.`}</h2>
          <p className="max-w-4xl text-base leading-relaxed">
            {t`CursorRulesCraft by Phong Lee - A powerful tool to create, manage, and share Cursor IDE rules. Built by a Software Engineer passionate about AI Engineering, this tool helps developers craft perfect AI prompts and coding rules for enhanced productivity.`}
          </p>

          <IconContext.Provider value={{ size: 14, weight: 'bold' }}>
            <div className="!mt-12 flex flex-wrap items-center gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  viewport={{ once: true }}
                  initial={{ opacity: 0, x: -50 }}
                  className={cn(featureLabel, feature.className)}
                  whileInView={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}
                >
                  {feature.icon}
                  <h3>{feature.title}</h3>
                </motion.div>
              ))}

              <motion.p
                viewport={{ once: true }}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                  transition: { delay: (features.length + 1) * 0.1 },
                }}
              >
                {t`and many more...`}
              </motion.p>
            </div>
          </IconContext.Provider>
        </div>
      </div>
    </section>
  );
};
