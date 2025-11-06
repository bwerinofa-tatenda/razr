import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Account {
  id: string;
  name: string;
  account_number: string;
}

interface AccountSelectorProps {
  value: string;
  onChange: (accountNumber: string) => void;
}

export default function AccountSelector({ value, onChange }: AccountSelectorProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      // Mock accounts for development
      setAccounts([
        { id: '1', name: 'Main Trading Account', account_number: '12345678' },
        { id: '2', name: 'Demo Account', account_number: '87654321' }
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, account_number')
        .eq('user_id', user?.id)
        .eq('is_connected', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
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
