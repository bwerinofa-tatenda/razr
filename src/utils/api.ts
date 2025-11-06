// API Layer - Using Mock Services for Standalone Mode
import { 
  mockTradesService, 
  mockStrategiesService, 
  mockNotesService, 
  mockChatService,
  mockAccountsService,
  mockFileParsingService
} from '../lib/mockServices';

// ========== TRADES API ==========

export const getTrades = async (userId: string, accountNumber?: string) => {
  return await mockTradesService.getTrades(userId, accountNumber);
};

export const getTradeById = async (id: string) => {
  return await mockTradesService.getTradeById(id);
};

export const createTrade = async (trade: any) => {
  return await mockTradesService.createTrade(trade);
};

export const updateTrade = async (id: string, updates: any) => {
  return await mockTradesService.updateTrade(id, updates);
};

export const deleteTrade = async (id: string) => {
  return await mockTradesService.deleteTrade(id);
};

export const importTrades = async (trades: any[]) => {
  return await mockTradesService.importTrades(trades);
};

// ========== STRATEGIES API ==========

export const getStrategies = async (userId: string) => {
  return await mockStrategiesService.getStrategies(userId);
};

export const createStrategy = async (strategy: any) => {
  return await mockStrategiesService.createStrategy(strategy);
};

// ========== NOTES API ==========

export const getNotes = async (userId: string, strategyId?: string) => {
  return await mockNotesService.getNotes(userId, strategyId);
};

export const createNote = async (note: any) => {
  return await mockNotesService.createNote(note);
};

export const updateNote = async (id: string, updates: any) => {
  return await mockNotesService.updateNote(id, updates);
};

export const searchNotes = async (userId: string, searchTerms: string) => {
  return await mockNotesService.searchNotes(userId, searchTerms);
};

// ========== CHAT API ==========

export const getChatMessages = async (userId: string) => {
  return await mockChatService.getMessages(userId);
};

export const createChatMessage = async (message: any) => {
  return await mockChatService.createMessage(message);
};

export const invokeAIChat = async (message: string, mode: string, userId: string) => {
  return await mockChatService.invokeAI(message, mode, userId);
};

// ========== ACCOUNTS API ==========

export const getAccounts = async (userId: string) => {
  return await mockAccountsService.getAccounts(userId);
};

export const createAccount = async (account: any) => {
  return await mockAccountsService.createAccount(account);
};

export const updateAccount = async (id: string, updates: any) => {
  return await mockAccountsService.updateAccount(id, updates);
};

export const deleteAccount = async (id: string) => {
  return await mockAccountsService.deleteAccount(id);
};

export const syncAccount = async (accountNumber: string) => {
  return await mockAccountsService.syncAccount(accountNumber);
};

// ========== FILE PARSING API ==========

export const parseCSVFile = async (file: File) => {
  return await mockFileParsingService.parseCSV(file);
};

export const parseExcelFile = async (file: File) => {
  return await mockFileParsingService.parseExcel(file);
};

// Legacy mock data loaders (keep for backwards compatibility)
export const loadMockTrades = async () => {
  return await mockTradesService.getTrades('demo-user-123');
};

export const loadMockStrategies = async () => {
  return await mockStrategiesService.getStrategies('demo-user-123');
};

export const loadMockNotes = async () => {
  return await mockNotesService.getNotes('demo-user-123');
};
