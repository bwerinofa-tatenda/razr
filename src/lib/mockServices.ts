// SQLite Services - Complete replacement for Supabase operations
import { tradeOperations, accountOperations, Trade, Account, TradeStats } from './sqliteService';

export const getTrades = async (accountNumber?: string): Promise<Trade[]> => {
  try {
    if (accountNumber) {
      return await tradeOperations.getByAccount(accountNumber);
    }
    return await tradeOperations.getAll();
  } catch (error) {
    console.error('Error getting trades:', error);
    return [];
  }
};

export const createTrade = async (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  try {
    return await tradeOperations.create(trade);
  } catch (error) {
    console.error('Error creating trade:', error);
    throw error;
  }
};

export const updateTrade = async (id: number, updates: Partial<Trade>): Promise<void> => {
  try {
    await tradeOperations.update(id, updates);
  } catch (error) {
    console.error('Error updating trade:', error);
    throw error;
  }
};

export const deleteTrade = async (id: number): Promise<void> => {
  try {
    await tradeOperations.delete(id);
  } catch (error) {
    console.error('Error deleting trade:', error);
    throw error;
  }
};

export const getTradeStats = async (accountNumber?: string): Promise<TradeStats> => {
  try {
    return await tradeOperations.getStats(accountNumber);
  } catch (error) {
    console.error('Error getting trade stats:', error);
    return {
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      total_profit: 0,
      avg_profit: 0,
      max_profit: 0,
      min_profit: 0,
      total_volume: 0
    };
  }
};

export const getAccounts = async (): Promise<Account[]> => {
  try {
    return await accountOperations.getAll();
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
};

export const createAccount = async (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  try {
    return await accountOperations.create(account);
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

export const updateAccount = async (accountNumber: string, updates: Partial<Account>): Promise<void> => {
  try {
    await accountOperations.update(accountNumber, updates);
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

export const deleteAccount = async (accountNumber: string): Promise<void> => {
  try {
    await accountOperations.delete(accountNumber);
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

export const initializeMockData = async (): Promise<void> => {
  try {
    // Initialize with some sample data if database is empty
    const accounts = await accountOperations.getAll();
    if (accounts.length === 0) {
      // Add sample accounts
      await accountOperations.create({
        name: 'Main Trading Account',
        account_number: '12345678',
        is_connected: true
      });
      await accountOperations.create({
        name: 'Demo Account',
        account_number: '87654321',
        is_connected: false
      });
    }

    const trades = await tradeOperations.getAll();
    if (trades.length === 0) {
      // Add sample trades
      const sampleTrades: Omit<Trade, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          account_number: '12345678',
          position_id: 'POS001',
          symbol: 'EURUSD',
          side: 'buy' as const,
          volume: 0.1,
          open_price: 1.0850,
          close_price: 1.0900,
          open_time: '2025-01-01T10:00:00Z',
          close_time: '2025-01-01T15:00:00Z',
          commission: 0.5,
          swap: 0,
          profit: 5.0,
          comment: 'Sample trade'
        },
        {
          account_number: '12345678',
          position_id: 'POS002',
          symbol: 'GBPUSD',
          side: 'sell' as const,
          volume: 0.05,
          open_price: 1.2750,
          close_price: 1.2700,
          open_time: '2025-01-02T10:00:00Z',
          close_time: '2025-01-02T15:00:00Z',
          commission: 0.25,
          swap: 0,
          profit: 2.5,
          comment: 'Another sample trade'
        }
      ];

      for (const trade of sampleTrades) {
        await tradeOperations.create(trade);
      }
    }
  } catch (error) {
    console.error('Error initializing mock data:', error);
  }
};
