import { sortByDate } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

// import { useCursorRules } from '@/client/services/cursor-rules';

import { BaseListItem } from './BaseItem';
import { CreateCursorRuleListItem } from './CreateItem';
import { CursorRuleListItem } from './CursorRuleListItem';

export const ListView = () => {
  const { cursorRules, loading } = { cursorRules: [], loading: false };

  return (
    <div className="grid gap-y-2">
      <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }}>
        <CreateCursorRuleListItem />
      </motion.div>

      {loading &&
        Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="duration-300 animate-in fade-in"
            style={{ animationFillMode: 'backwards', animationDelay: `${i * 300}ms` }}
          >
            <BaseListItem className="bg-secondary/40" />
          </div>
        ))}

      {cursorRules && (
        <AnimatePresence>
          {cursorRules
            .sort((a, b) => sortByDate(a, b, 'updatedAt'))
            .map((cursorRule, index) => (
              <motion.div
                // @ts-ignore
                key={cursorRule.id}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0, transition: { delay: (index + 2) * 0.1 } }}
                exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.5 } }}
              >
                <CursorRuleListItem cursorRule={cursorRule} />
              </motion.div>
            ))}
        </AnimatePresence>
      )}
    </div>
  );
};
