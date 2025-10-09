import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

type Props = {
  size?: number;
  className?: string;
};

export const Logo = ({ size = 24, className }: Props) => {
  const { isDarkMode } = useTheme();

  let src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  switch (isDarkMode) {
    case false: {
      src = '/logo/cursorrulescraft-light.svg';
      break;
    }
    case true: {
      src = '/logo/cursorrulescraft-dark.svg';
      break;
    }
  }

  return (
    <img
      src={src}
      height={size}
      alt="CursorRulesCraft"
      className={cn('h-auto rounded-sm', className)}
      style={{ height: size }}
    />
  );
};
