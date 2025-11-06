import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, RefreshCw, Link as LinkIcon } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getAccounts, createAccount, updateAccount, deleteAccount, syncAccount } from '@/utils/api';
import toast from 'react-hot-toast';

interface Account {
  id: string;
  name: string;
  account_number: string;
  is_connected: boolean;
  last_sync: string | null;
  sync_status?: string;
  created_at: string;
}

export default function ConnectAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getAccounts(user.id);
      setAccounts(data);
    } catch (error: any) {
      console.error('Load accounts error:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.accountNumber || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user) return;

    setSubmitting(true);

    try {
      // Encrypt password using user ID as encryption key
      const encryptedPassword = CryptoJS.AES.encrypt(
        formData.password,
        user.id
      ).toString();

      // Create account
      const newAccount = await createAccount({
        user_id: user.id,
        name: formData.name,
        account_number: formData.accountNumber,
        encrypted_investor_password: encryptedPassword,
        is_connected: true,
        last_sync: new Date().toISOString()
      });

      setAccounts(prev => [newAccount, ...prev]);
      toast.success('Account connected successfully');
      resetForm();

      // Trigger initial sync
      handleSync(newAccount.id, newAccount.account_number);

    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async (accountId: string, accountNumber: string) => {
    setSyncing(accountId);
    
    try {
      toast.loading('Syncing trades...', { id: 'sync' });
      
      const result = await syncAccount(accountNumber);

      if (result.success) {
        toast.success(`Sync completed! Imported ${result.tradesImported} trades`, { id: 'sync' });
        // Update account sync status
        setAccounts(prev => prev.map(acc => 
          acc.id === accountId 
            ? { ...acc, last_sync: new Date().toISOString(), is_connected: true }
            : acc
        ));
      } else {
        throw new Error('Sync failed');
      }
      
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Sync failed: ${error.message}`, { id: 'sync' });
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await updateAccount(accountId, { is_connected: false });

      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, is_connected: false } : acc
      ));
      toast.success('Account disconnected');
      
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect account');
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteAccount(accountId);
      
      if (success) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        toast.success('Account deleted');
      } else {
        throw new Error('Delete failed');
      }
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete account');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', accountNumber: '', password: '' });
    setShowForm(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Form */}
      {showForm ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-normal text-gray-900 dark:text-white mb-4">
            Connect MT5 Account
          </h3>
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Trading Account"
                required
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="e.g., 12345678"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Investor Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Investor password (read-only access)"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your password is encrypted before storage. We use investor (read-only) password for security.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Connecting...' : 'Connect Account'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Account
        </Button>
      )}

      {/* Accounts Table */}
      {accounts.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-normal text-gray-900 dark:text-white">
              Connected Accounts ({accounts.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Account Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {account.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {account.account_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {account.is_connected ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Connected
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Disconnected
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(account.last_sync)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      {account.is_connected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(account.id, account.account_number)}
                          disabled={syncing === account.id}
                          className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${syncing === account.id ? 'animate-spin' : ''}`} />
                          {syncing === account.id ? 'Syncing...' : 'Sync'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={!account.is_connected}
                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Disconnect
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(account.id)}
                        className="border-red-300 dark:border-red-600 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-normal text-gray-900 dark:text-white">
            No accounts connected
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Connect your MT5 account to automatically sync trades
          </p>
        </div>
      )}
    </div>
  );
}
