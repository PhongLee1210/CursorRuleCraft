import { t } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';

import { sortByDate } from '@frontend/lib/utils';
import type { Repository } from '@frontend/types/repository';

import { BaseListItem } from './BaseItem';
import { CreateRepositoryListItem } from './CreateItem';
import { RepositoryListItem } from './RepositoryListItem';

interface ListViewProps {
  repositories: Repository[];
  isLoading: boolean;
}

export const ListView = ({ repositories, isLoading }: ListViewProps) => {
  const isEmpty = !isLoading && repositories.length === 0;

  return (
    <div className="grid gap-y-2">
      <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }}>
        <CreateRepositoryListItem />
      </motion.div>

      {isLoading &&
        Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-in fade-in duration-300"
            style={{ animationFillMode: 'backwards', animationDelay: `${i * 300}ms` }}
          >
            <BaseListItem className="bg-secondary/40" />
          </div>
        ))}

      {isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 text-center text-opacity-80"
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
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0, transition: { delay: (index + 2) * 0.1 } }}
                exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.5 } }}
              >
                <RepositoryListItem repository={repository} />
              </motion.div>
            ))}
        </AnimatePresence>
      )}
    </div>
  );
};
