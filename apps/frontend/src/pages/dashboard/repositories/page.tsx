import { ScrollArea } from '@/components/ScrollArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Tabs';
import { useRepositories } from '@/hooks/useRepositories';
import { useWorkspaceStore } from '@/stores/workspace';

import { useLocalStorage } from '@/lib/useLocalStorage';
import { t } from '@lingui/macro';
import { ListIcon, SquaresFourIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

import { GridView } from './_layouts/grid';
import { ListView } from './_layouts/list';

type Layout = 'grid' | 'list';

export const RepositoriesPage = () => {
  const [layout, setLayout] = useLocalStorage<Layout>('repositories-layout', 'grid');

  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const { repositories, isLoading } = useRepositories();

  // Show message if no workspace is available yet
  if (!currentWorkspace && workspaces.length === 0) {
    return (
      <>
        <Helmet>
          <title>
            {t`Repositories`} - {t`CursorRulesCraft`}
          </title>
        </Helmet>

        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-warning mb-4 inline-flex"
            >
              <WarningCircleIcon size={48} weight="duotone" />
            </motion.div>
            <h2 className="text-2xl font-semibold">{t`No Workspace Available`}</h2>
            <p className="text-muted-foreground mt-2">
              {t`Your workspace is being initialized. Please wait a moment...`}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {t`Repositories`} - {t`CursorRulesCraft`}
        </title>
      </Helmet>

      <Tabs
        value={layout}
        className="space-y-4"
        onValueChange={(value) => {
          setLayout(value as Layout);
        }}
      >
        <div className="flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold tracking-tight"
          >
            {t`Repositories`}
          </motion.h1>

          <TabsList>
            <TabsTrigger value="grid" className="size-8 p-0 sm:h-8 sm:w-auto sm:px-4">
              <SquaresFourIcon />
              <span className="ml-2 hidden sm:block">{t`Grid`}</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="size-8 p-0 sm:h-8 sm:w-auto sm:px-4">
              <ListIcon />
              <span className="ml-2 hidden sm:block">{t`List`}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea
          allowOverflow
          className="bg-background h-[calc(100vh-140px)] overflow-visible lg:h-[calc(100vh-88px)]"
        >
          <TabsContent value="grid">
            <GridView repositories={repositories} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="list">
            <ListView repositories={repositories} isLoading={isLoading} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </>
  );
};
