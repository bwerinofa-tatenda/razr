// API Layer - Using SQLite Services for Standalone Mode
import {
  getTrades as getTradesFromDB,
  createTrade as createTradeInDB,
  updateTrade as updateTradeInDB,
  deleteTrade as deleteTradeFromDB,
  getTradeStats as getTradeStatsFromDB,
  getAccounts as getAccountsFromDB,
  createAccount as createAccountInDB,
  updateAccount as updateAccountInDB,
  deleteAccount as deleteAccountFromDB,
  initializeMockData as initMockData
} from '../lib/mockServices';

// Initialize database on module load
initMockData();

// ========== TRADES API ==========

export const getTrades = async (userId: string, accountNumber?: string) => {
  return await getTradesFromDB(accountNumber);
};

export const getTradeById = async (id: string) => {
  const tradeId = parseInt(id);
  if (isNaN(tradeId)) return null;
  return await getTradesFromDB().then(trades => trades.find(t => t.id === tradeId) || null);
};

export const createTrade = async (trade: any) => {
  return await createTradeInDB(trade);
};

export const updateTrade = async (id: string, updates: any) => {
  const tradeId = parseInt(id);
  if (isNaN(tradeId)) throw new Error('Invalid trade ID');
  await updateTradeInDB(tradeId, updates);
  return { success: true };
};

export const deleteTrade = async (id: string) => {
  const tradeId = parseInt(id);
  if (isNaN(tradeId)) throw new Error('Invalid trade ID');
  await deleteTradeFromDB(tradeId);
  return { success: true };
};

export const importTrades = async (trades: any[]) => {
  const results = [];
  for (const trade of trades) {
    try {
      const id = await createTradeInDB(trade);
      results.push({ success: true, id });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  return results;
};

// ========== STRATEGIES API ==========

export const getStrategies = async (userId: string) => {
  // Mock strategies for now - could be extended to use SQLite
  return [
    {
      id: 'strategy_1',
      name: 'Breakout Strategy',
      description: 'Trade breakouts from key levels',
      performance: { winRate: 65, totalTrades: 45 }
    }
  ];
};

export const createStrategy = async (strategy: any) => {
  // Mock implementation - could be extended to use SQLite
  return { id: `strategy_${Date.now()}`, ...strategy };
};

// ========== NOTES API ==========

export const getNotes = async (userId: string, strategyId?: string) => {
  // Mock notes for now - could be extended to use SQLite
  return [
    {
      id: 'note_1',
      title: 'Trading Notes',
      content: 'Sample trading notes',
      created_at: new Date().toISOString()
    }
  ];
};

export const createNote = async (note: any) => {
  // Mock implementation - could be extended to use SQLite
  return { id: `note_${Date.now()}`, ...note };
};

export const updateNote = async (id: string, updates: any) => {
  // Mock implementation - could be extended to use SQLite
  return { success: true };
};

export const searchNotes = async (userId: string, searchTerms: string) => {
  // Mock implementation - could be extended to use SQLite
  return [];
};

// ========== CHAT API ==========

export const getChatMessages = async (userId: string) => {
  // Chat functionality removed - return empty array
  return [];
};

export const createChatMessage = async (message: any) => {
  // Chat functionality removed - return success
  return { success: true };
};

export const invokeAIChat = async (message: string, mode: string, userId: string) => {
  // Chat functionality removed - return mock response
  return { response: 'Chat functionality has been removed from this standalone version.' };
};

// ========== ACCOUNTS API ==========

export const getAccounts = async (userId: string) => {
  return await getAccountsFromDB();
};

export const createAccount = async (account: any) => {
  return await createAccountInDB(account);
};

export const updateAccount = async (id: string, updates: any) => {
  await updateAccountInDB(id, updates);
  return { success: true };
};

export const deleteAccount = async (id: string) => {
  await deleteAccountFromDB(id);
  return { success: true };
};

export const syncAccount = async (accountNumber: string) => {
  // Mock sync - could be extended for real MT5 integration
  return { success: true, message: 'Account sync completed' };
};

// ========== FILE PARSING API ==========

export const parseCSVFile = async (file: File) => {
  // Basic CSV parsing - could be enhanced
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim();
        });
        return obj;
      });
      resolve(data);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const parseExcelFile = async (file: File) => {
  // Basic Excel parsing placeholder - would need xlsx library
  return parseCSVFile(file); // Fallback to CSV parsing
};

// ========== TRADE STATISTICS API ==========

export const getTradeStatistics = async (userId: string, accountNumber?: string) => {
  return await getTradeStatsFromDB(accountNumber);
};

// Legacy mock data loaders (keep for backwards compatibility)
export const loadMockTrades = async () => {
  return await getTradesFromDB();
};

export const loadMockStrategies = async () => {
  return await getStrategies('demo-user-123');
};

export const loadMockNotes = async () => {
  return await getNotes('demo-user-123');
};
