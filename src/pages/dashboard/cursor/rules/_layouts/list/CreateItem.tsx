import { t } from '@lingui/macro';
import { PlusIcon } from '@phosphor-icons/react';
// import type { CursorRuleDto } from '@/types/cursor-rules';
import { KeyboardShortcut } from '@/components/KeyboardShortcut';

// import { useDialog } from '@/client/stores/dialog';

import { BaseListItem } from './BaseItem';

export const CreateCursorRuleListItem = () => {
  //   const { open } = useDialog<CursorRuleDto>('resume');

  return (
    <BaseListItem
      start={<PlusIcon size={18} />}
      title={
        <>
          <span>{t`Create a new cursor rule`}</span>
          {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
          <KeyboardShortcut className="ml-2">^N</KeyboardShortcut>
        </>
      }
      description={t`Start building from scratch`}
      onClick={() => {
        open('create');
      }}
    />
  );
};
