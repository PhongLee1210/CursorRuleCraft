import { Badge } from '@/components/Badge';
import { Button, buttonVariants } from '@/components/Button';
import { cn } from '@/lib/utils';
import { t } from '@lingui/macro';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

import { useLogout } from '@/hooks/useLogout';
import { useAuthStore } from '@/stores/auth';
import { BookIcon, SignOutIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';

export const HeroCTA = () => {
  const { logout } = useLogout();

  const isLoggedIn = useAuthStore((state) => !!state.user);

  if (isLoggedIn) {
    return (
      <>
        <Button asChild size="lg">
          <Link to="/dashboard">{t`Go to Dashboard`}</Link>
        </Button>

        <Button size="lg" variant="link" onClick={() => logout()}>
          <SignOutIcon className="mr-3" />
          {t`Logout`}
        </Button>
      </>
    );
  }

  return (
    <>
      <Button asChild size="lg">
        <Link to="/auth/login">{t`Get Started`}</Link>
      </Button>

      <Button asChild size="lg" variant="link">
        <a
          href="https://github.com/cursorrulecraft"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <BookIcon className="mr-3" />
          {t`Learn more`}
        </a>
      </Button>
    </>
  );
};

export const Decoration = {
  Grid: () => (
    <svg
      aria-hidden="true"
      className="absolute inset-0 -z-10 size-full stroke-foreground/10 opacity-60 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)] dark:opacity-40"
    >
      <defs>
        <pattern
          id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
          width={200}
          height={200}
          x="50%"
          y={-1}
          patternUnits="userSpaceOnUse"
        >
          <path d="M.5 200V.5H200" fill="none" />
        </pattern>
      </defs>
      <svg x="50%" y={-1} className="overflow-visible fill-border/20">
        <path
          d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
          strokeWidth={0}
        />
      </svg>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
      />
    </svg>
  ),
  Gradient: () => (
    <div
      aria-hidden="true"
      className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
    >
      <div
        className="aspect-[1108/632] h-96 w-[69.25rem] bg-gradient-to-r from-[#6f8cbb] to-[#c93b37] opacity-40 dark:opacity-20"
        style={{
          clipPath:
            'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
        }}
      />
    </div>
  ),
};

export const HeroSection = () => (
  <section id="hero" className="relative">
    <Decoration.Grid />
    <Decoration.Gradient />

    <div className="mx-auto max-w-7xl px-6 lg:flex lg:h-screen lg:items-center lg:px-12">
      <motion.div
        className="mx-auto mt-32 max-w-3xl shrink-0 lg:mx-0 lg:mt-0 lg:max-w-xl lg:pt-8"
        viewport={{ once: true }}
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
      >
        <div className="hidden items-center gap-x-4 sm:flex">
          <Badge>{t`Beta Version`}</Badge>

          <a
            href="https://github.com/cursorrulecraft"
            className={cn(buttonVariants({ variant: 'link' }), 'space-x-2 text-left')}
          >
            <p>{t`What's new in the latest version`}</p>
            <ArrowRightIcon />
          </a>
        </div>

        <div className="mt-10 space-y-2">
          <h6 className="text-base font-bold tracking-wide">{t`Finally,`}</h6>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            {t`A free and open-source cursor rules project builder`}
          </h1>
        </div>

        <p className="prose prose-base prose-zinc mt-6 text-lg leading-8 dark:prose-invert">
          {t`CursorRulesCraft simplifies the process of creating, managing, and sharing custom cursor rules for your AI coding assistant. Craft the perfect context for your projects.`}
        </p>

        <div className="mt-10 flex items-center gap-x-8">
          <HeroCTA />
        </div>
      </motion.div>

      <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-20">
        <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
          <motion.div
            viewport={{ once: true }}
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <Tilt
              scale={1.05}
              tiltMaxAngleX={8}
              tiltMaxAngleY={8}
              perspective={1400}
              glareEnable={true}
              glareMaxOpacity={0.1}
              glareColor="#fafafa"
            >
              <img
                width={3600}
                height={2078}
                src="/screenshots/builder.jpg"
                alt="CursorRulesCraft - Screenshot - Rules Builder Screen"
                className="w-[76rem] rounded-lg bg-background/5 shadow-2xl ring-1 ring-foreground/10"
              />
            </Tilt>
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);
