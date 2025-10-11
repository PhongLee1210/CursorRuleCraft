import { t } from '@lingui/macro';
import { motion } from 'framer-motion';
import { Link } from 'react-router';

import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@clerk/clerk-react';

export const Header = () => {
  const { isSignedIn } = useAuth();

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-20"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.3 } }}
    >
      <div className="border-border/40 bg-background/70 border-b py-3 shadow-sm backdrop-blur-md">
        <div className="container flex items-center justify-between">
          <Link to="/">
            <Logo size={24} />
          </Link>

          {!isSignedIn && (
            <Button asChild>
              <Link to="/auth/login">{t`Get Started`}</Link>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
};
