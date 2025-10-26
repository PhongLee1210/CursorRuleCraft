import { t } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';

import { sortByDate } from '@frontend/lib/utils';
import { CreateRepositoryCard } from '@frontend/pages/dashboard/repositories/_layouts/grid/CreateCard';
import { RepositoryCard } from '@frontend/pages/dashboard/repositories/_layouts/grid/RepositoryCard';
import { RepositoryCardSkeleton } from '@frontend/pages/dashboard/repositories/_layouts/grid/RepositoryCardSkeleton';
import type { Repository } from '@frontend/types/repository';

interface GridViewProps {
  repositories: Repository[];
  isLoading: boolean;
}

export const GridView = ({ repositories, isLoading }: GridViewProps) => {
  const isEmpty = !isLoading && repositories.length === 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
        <CreateRepositoryCard />
      </motion.div>

      {isLoading &&
        Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-in fade-in duration-300"
            style={{ animationFillMode: 'backwards', animationDelay: `${i * 100}ms` }}
          >
            <RepositoryCardSkeleton />
          </div>
        ))}

      {isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-full flex flex-col items-center justify-center py-12 text-center text-opacity-80"
        >
          <p className="text-muted-foreground text-sm">
            {t`No repositories connected yet. Connect your first repository to get started.`}
          </p>
        </motion.div>
      )}

      {!isLoading && repositories.length > 0 && (
        <AnimatePresence>
          {repositories
            .sort((a, b) => sortByDate(a, b, 'updatedAt'))
            .map((repository, index) => (
              <motion.div
                key={repository.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { delay: (index + 1) * 0.1 },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  filter: 'blur(8px)',
                  transition: { duration: 0.5 },
                }}
              >
                <RepositoryCard repository={repository} />
              </motion.div>
            ))}
        </AnimatePresence>
      )}
    </div>
  );
};
