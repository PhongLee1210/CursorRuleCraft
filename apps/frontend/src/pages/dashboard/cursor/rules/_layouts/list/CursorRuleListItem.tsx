import { Button } from '@/components/Button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ContextMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/DropdownMenu';
import { t } from '@lingui/macro';
import {
  CopySimpleIcon,
  DotsThreeVerticalIcon,
  FolderOpenIcon,
  LockIcon,
  LockOpenIcon,
  PencilSimpleIcon,
  TrashSimpleIcon,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router';

import { BaseListItem } from './BaseItem';

type Props = {
  cursorRule: any;
};

export const CursorRuleListItem = ({ cursorRule }: Props) => {
  const navigate = useNavigate();
  //   const { open } = useDialog<ResumeDto>('resume');
  //   const { open: lockOpen } = useDialog<ResumeDto>('lock');

  const lastUpdated = dayjs(cursorRule.updatedAt).format('DD/MM/YYYY HH:mm');

  const onOpen = () => {
    void navigate(`/dashboard/cursor/rules/${cursorRule.id}`);
  };

  const onUpdate = () => {
    // open('update', { id: 'cursorRule', item: cursorRule });
  };

  const onDuplicate = () => {
    // open('duplicate', { id: 'cursorRule', item: cursorRule });
  };

  const onLockChange = () => {
    // lockOpen(cursorRule.locked ? 'update' : 'create', { id: 'lock', item: cursorRule });
  };

  const onDelete = () => {
    // open('delete', { id: 'resume', item: resume });
  };

  const dropdownMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="aspect-square">
        <Button size="icon" variant="ghost">
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          <FolderOpenIcon size={14} className="mr-2" />
          {t`Open`}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            onUpdate();
          }}
        >
          <PencilSimpleIcon size={14} className="mr-2" />
          {t`Rename`}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            onDuplicate();
          }}
        >
          <CopySimpleIcon size={14} className="mr-2" />
          {t`Duplicate`}
        </DropdownMenuItem>
        {cursorRule.locked ? (
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              onLockChange();
            }}
          >
            <LockOpenIcon size={14} className="mr-2" />
            {t`Unlock`}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              onLockChange();
            }}
          >
            <LockIcon size={14} className="mr-2" />
            {t`Lock`}
          </DropdownMenuItem>
        )}
        <ContextMenuSeparator />
        <DropdownMenuItem
          className="text-error"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <TrashSimpleIcon size={14} className="mr-2" />
          {t`Delete`}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger className="even:bg-secondary/20">
        <BaseListItem
          className="group"
          title={cursorRule.title}
          description={t`Last updated ${lastUpdated}`}
          end={dropdownMenu}
          onClick={onOpen}
        />
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={onOpen}>
          <FolderOpenIcon size={14} className="mr-2" />
          {t`Open`}
        </ContextMenuItem>
        <ContextMenuItem onClick={onUpdate}>
          <PencilSimpleIcon size={14} className="mr-2" />
          {t`Rename`}
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate}>
          <CopySimpleIcon size={14} className="mr-2" />
          {t`Duplicate`}
        </ContextMenuItem>
        {cursorRule.locked ? (
          <ContextMenuItem onClick={onLockChange}>
            <LockOpenIcon size={14} className="mr-2" />
            {t`Unlock`}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={onLockChange}>
            <LockIcon size={14} className="mr-2" />
            {t`Lock`}
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem className="text-error" onClick={onDelete}>
          <TrashSimpleIcon size={14} className="mr-2" />
          {t`Delete`}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
