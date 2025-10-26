import { GithubLogoIcon } from '@phosphor-icons/react';
import { StarFilledIcon } from '@radix-ui/react-icons';

import { Separator } from '@frontend/components/Separator';
import { cn } from '@frontend/lib/utils';

const REPO_URL = 'https://github.com/PhongLee1210/CursorRuleCraft';

interface RepoBannerProps {
  className?: string;
}

export function RepoBanner({ className }: RepoBannerProps) {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View CursorRuleCraft repository on GitHub"
      className={cn(
        'bg-background overflow-hidden rounded-t-2xl border border-b-0 px-3 py-1',
        'transform-y-1 group relative flex items-center gap-2',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-t-2xl dark:before:bg-[radial-gradient(circle_at_10%_-50%,rgba(255,255,255,0.1),transparent_10%)]',
        'hover:border-primary/50 transition-colors',
        className
      )}
    >
      <GithubLogoIcon className="h-4 w-4" aria-hidden="true" weight="fill" />
      <Separator
        orientation="vertical"
        className="h-6 bg-[hsl(var(--border))]"
        aria-hidden="true"
      />
      <p className="text-foreground text-sm font-medium tracking-wide">Star on GitHub</p>
      <div className="text-foreground/80 flex items-center gap-1" role="status" aria-live="polite">
        <StarFilledIcon
          className="h-4 w-4 transition-transform duration-200 ease-in-out group-hover:text-[#e4b340]"
          aria-label="GitHub stars"
        />
      </div>
    </a>
  );
}
