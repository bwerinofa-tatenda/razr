import React, { useState, useEffect } from 'react';
import { accountOperations, Account } from '@/lib/sqliteService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AccountSelectorProps {
  value: string;
  onChange: (accountNumber: string) => void;
}

export default function AccountSelector({ value, onChange }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await accountOperations.getAll();
      // Filter to only connected accounts
      const connectedAccounts = data.filter(account => account.is_connected);
      setAccounts(connectedAccounts);
    } catch (error) {
      console.error('Load accounts error:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading accounts...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Filter by Account:
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Accounts</SelectItem>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.account_number}>
              {account.name} ({account.account_number})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
