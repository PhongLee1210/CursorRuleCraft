import { Button } from "@frontend/components/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@frontend/components/Dialog";
import { t } from '@lingui/macro';
import { SpinnerGapIcon } from '@phosphor-icons/react';
import { useCallback, useState } from 'react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmDialog = ({ open, onClose, onConfirm }: DeleteConfirmDialogProps) => {
  // State
  const [isDeleting, setIsDeleting] = useState(false);

  // Event Handlers
  const handleConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [onConfirm, onClose]);

  // Render
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t`Delete Cursor Rule`}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-muted-foreground text-sm">
            {t`Are you sure you want to delete this rule? This action cannot be undone.`}
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isDeleting}>
            {t`Cancel`}
          </Button>
          <Button onClick={handleConfirm} variant="destructive" disabled={isDeleting}>
            {isDeleting ? <SpinnerGapIcon size={16} className="animate-spin" /> : t`Delete`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
