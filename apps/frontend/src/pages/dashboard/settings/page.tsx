import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Separator } from '@/components/Separator';
import {
  BellIcon,
  GearIcon,
  LockKeyIcon,
  PaintBrushIcon,
  UserCircleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router';

export const SettingsPage = () => {
  const navigate = useNavigate();

  const settingsCategories = [
    {
      icon: UserCircleIcon,
      title: 'Profile',
      description: 'Manage your personal information and account details',
    },
    {
      icon: LockKeyIcon,
      title: 'Security',
      description: 'Update your password and security preferences',
    },
    {
      icon: BellIcon,
      title: 'Notifications',
      description: 'Configure how you receive updates and alerts',
    },
    {
      icon: PaintBrushIcon,
      title: 'Appearance',
      description: 'Customize the look and feel of your workspace',
    },
    {
      icon: GearIcon,
      title: 'Preferences',
      description: 'Set your default behaviors and integrations',
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <Badge variant="warning" outline>
            Under Development
          </Badge>
        </div>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Separator className="mb-8" />

      {/* Under Development Notice */}
      <div className="border-warning bg-warning/10 mb-8 flex items-start gap-4 rounded-lg border p-6">
        <WarningCircleIcon className="text-warning h-6 w-6 flex-shrink-0" weight="fill" />
        <div className="flex-1">
          <h2 className="text-warning mb-2 text-lg font-semibold">
            Settings are currently under development
          </h2>
          <p className="text-muted-foreground text-sm">
            We're working hard to bring you a comprehensive settings experience. Check back soon to
            customize your account, notifications, security preferences, and more.
          </p>
        </div>
      </div>

      {/* Settings Categories Preview */}
      <div className="flex-1">
        <h2 className="mb-6 text-xl font-semibold">Coming Soon</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.title}
                className="bg-card hover:bg-accent/50 group relative overflow-hidden rounded-lg border p-6 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg transition-colors">
                    <Icon className="h-6 w-6" weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold">{category.title}</h3>
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  </div>
                </div>
                <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="from-primary/0 via-primary to-primary/0 absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <p className="text-muted-foreground text-sm">
          Have suggestions? We'd love to hear your feedback.
        </p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
