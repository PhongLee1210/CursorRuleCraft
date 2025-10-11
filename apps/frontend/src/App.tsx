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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Tabs';
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">CursorRulesCraft</h1>
          <p className="text-muted-foreground">
            React + TypeScript + Vite + TailwindCSS + Radix UI + Tanstack Query + Supabase
          </p>
        </div>

        {/* Example: Counter with Buttons */}
        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">Counter Example</h2>
          <div className="flex items-center gap-4">
            <Button onClick={() => setCount((count) => count - 1)} variant="outline">
              Decrement
            </Button>
            <span className="text-xl font-medium">Count: {count}</span>
            <Button onClick={() => setCount((count) => count + 1)}>Increment</Button>
          </div>
        </div>

        {/* Example: Tabs Component */}
        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">Tabs Example</h2>
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Account Settings</h3>
                <p className="text-muted-foreground text-sm">
                  Make changes to your account here. Click save when you're done.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="password" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Password Settings</h3>
                <p className="text-muted-foreground text-sm">
                  Change your password here. After saving, you'll be logged out.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Example: Dialog Component */}
        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">Dialog Example</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove
                  your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="submit">Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default App;
