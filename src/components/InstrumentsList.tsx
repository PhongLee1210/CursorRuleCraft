import { useState } from 'react';
import { useInstruments, useCreateInstrument, useDeleteInstrument } from '@/hooks/useInstruments';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/Dialog';

export function InstrumentsList() {
  const { data: instruments, isLoading, error } = useInstruments();
  const createInstrument = useCreateInstrument();
  const deleteInstrument = useDeleteInstrument();
  const [newInstrumentName, setNewInstrumentName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = async () => {
    if (!newInstrumentName.trim()) return;

    await createInstrument.mutateAsync({ name: newInstrumentName });
    setNewInstrumentName('');
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this instrument?')) {
      await deleteInstrument.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading instruments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-destructive bg-destructive/10 rounded-lg border p-4">
        <p className="text-destructive font-medium">Error loading instruments</p>
        <p className="text-destructive/80 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Instruments from Supabase</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add Instrument</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Instrument</DialogTitle>
              <DialogDescription>
                Enter the name of the instrument you want to add to the database.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <input
                type="text"
                placeholder="Instrument name"
                value={newInstrumentName}
                onChange={(e) => setNewInstrumentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewInstrumentName('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newInstrumentName.trim()}>
                {createInstrument.isPending ? 'Adding...' : 'Add Instrument'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!instruments || instruments.length === 0 ? (
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No instruments found. Add your first instrument to get started!
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {instruments.map((instrument) => (
            <li
              key={instrument.id}
              className="bg-card text-card-foreground flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{instrument.name}</p>
                <p className="text-muted-foreground text-xs">ID: {instrument.id}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(instrument.id)}
                disabled={deleteInstrument.isPending}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
