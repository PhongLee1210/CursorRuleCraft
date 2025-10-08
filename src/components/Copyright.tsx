import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

export const Copyright = ({ className }: Props) => (
  <div
    className={cn(
      'prose prose-sm prose-zinc flex max-w-none flex-col gap-y-1 text-xs opacity-40 dark:prose-invert',
      className
    )}
  >
    <span>
      A passion project by <a href="https://www.phonghub.com/">Phong Lee</a>
    </span>
    <span className="italic">Software Engineer on the way to becoming AI Engineering</span>

    <span className="mt-4">
      {`CursorRulesCraft`} {'v' + appVersion}
    </span>
  </div>
);
