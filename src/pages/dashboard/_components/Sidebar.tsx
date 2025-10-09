import { Button } from '@/components/Button';
import { KeyboardShortcut } from '@/components/KeyboardShortcut';
import { Separator } from '@/components/Separator';
import { cn } from '@/lib/utils';
import { SignedIn, UserButton } from '@clerk/clerk-react';
import { t } from '@lingui/macro';
import { FadersHorizontalIcon, ReadCvLogoIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router';
import useKeyboardShortcut from 'use-keyboard-shortcut';

import { Copyright } from '@/components/Copyright';

type Props = {
  className?: string;
};

const ActiveIndicator = ({ className }: Props) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className={cn(
      'size-1.5 animate-pulse rounded-full bg-info shadow-[0_0_12px] shadow-info',
      className
    )}
  />
);

type SidebarItem = {
  path: string;
  name: string;
  shortcut?: string;
  icon: React.ReactNode;
};

type SidebarItemProps = SidebarItem & {
  onClick?: () => void;
};

const SidebarItem = ({ path, name, shortcut, icon, onClick }: SidebarItemProps) => {
  const isActive = useLocation().pathname === path;

  return (
    <Button
      asChild
      size="lg"
      variant="ghost"
      className={cn(
        'h-auto justify-start px-4 py-3',
        isActive && 'pointer-events-none bg-secondary/50 text-secondary-foreground'
      )}
      onClick={onClick}
    >
      <Link to={path}>
        <div className="mr-3">{icon}</div>
        <span>{name}</span>
        {!isActive && <KeyboardShortcut className="ml-auto">{shortcut}</KeyboardShortcut>}
        {isActive && <ActiveIndicator className="ml-auto" />}
      </Link>
    </Button>
  );
};

type SidebarProps = {
  setOpen?: (open: boolean) => void;
};

export const Sidebar = ({ setOpen }: SidebarProps) => {
  const navigate = useNavigate();

  useKeyboardShortcut(['shift', 'r'], () => {
    void navigate('/dashboard/resumes');
    setOpen?.(false);
  });

  useKeyboardShortcut(['shift', 's'], () => {
    void navigate('/dashboard/settings');
    setOpen?.(false);
  });

  const sidebarItems: SidebarItem[] = [
    {
      path: '/dashboard/cursor/rules',
      name: t`Cursor Rules`,
      shortcut: '⇧R',
      icon: <ReadCvLogoIcon />,
    },
    {
      path: '/dashboard/settings',
      name: t`Settings`,
      shortcut: '⇧S',
      icon: <FadersHorizontalIcon />,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-y-4">
      <div className="ml-12 flex justify-center lg:ml-0">
        {/* <Button asChild size="icon" variant="ghost" className="p-0">
          <Link to="/">
            <Icon size={24} className="mx-auto hidden lg:block" />
          </Link>
        </Button> */}
      </div>

      <Separator className="opacity-50" />

      <div className="grid gap-y-2">
        {sidebarItems.map((item) => (
          <SidebarItem {...item} key={item.path} onClick={() => setOpen?.(false)} />
        ))}
      </div>

      <div className="flex-1" />

      <Separator className="opacity-50" />

      <SignedIn>
        <div className="px-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
                userButtonPopoverCard: 'shadow-xl',
              },
            }}
            showName
          />
        </div>
      </SignedIn>

      <Copyright className="ml-2" />
    </div>
  );
};
