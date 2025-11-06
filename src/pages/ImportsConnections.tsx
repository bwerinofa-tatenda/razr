import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImportReports from '@/components/imports/ImportReports';
import ConnectAccounts from '@/components/imports/ConnectAccounts';

export default function ImportsConnections() {
  const [activeTab, setActiveTab] = useState('import');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-normal text-gray-900 dark:text-white">
          Imports & Connections
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Import trade reports or connect your MT5 accounts for automatic synchronization
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="import">Import Reports</TabsTrigger>
          <TabsTrigger value="connect">Connect Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          <ImportReports />
        </TabsContent>

        <TabsContent value="connect" className="mt-6">
          <ConnectAccounts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
