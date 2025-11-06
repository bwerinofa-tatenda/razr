// Mock Services - Complete replacement for Supabase operations
import { storage, sleep, generateId, type MockAccount, type MockTrade, type MockStrategy, type MockNote, type MockChatMessage, calculateSystemQualityNumber } from './mockStorage';
import { generateMockAccounts, generateMockTrades, generateMockStrategies, generateMockNotes, generateMockChatMessages } from './mockData';

const MOCK_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// Initialize mock data if not present
export function initializeMockData() {
  const initialized = storage.get<boolean>('initialized');
  
  if (!initialized) {
    console.log('Initializing mock data...');
    
    storage.set('accounts', generateMockAccounts());
    storage.set('trades', generateMockTrades());
    storage.set('strategies', generateMockStrategies());
    storage.set('notes', generateMockNotes());
    storage.set('chatMessages', generateMockChatMessages());
    storage.set('initialized', true);
    storage.set('lastUpdate', new Date().toISOString());
    
    console.log('Mock data initialized successfully');
  }
}

// ========== ACCOUNTS SERVICE ==========

export const mockAccountsService = {
  async getAccounts(userId: string = MOCK_USER_ID): Promise<MockAccount[]> {
    await sleep(300);
    const accounts = storage.get<MockAccount[]>('accounts') || generateMockAccounts();
    return accounts.filter(acc => acc.user_id === userId);
  },

  async createAccount(account: Partial<MockAccount>): Promise<MockAccount> {
    await sleep(800);
    const accounts = storage.get<MockAccount[]>('accounts') || [];
    
    const newAccount: MockAccount = {
      id: generateId(),
      user_id: account.user_id || MOCK_USER_ID,
      name: account.name || '',
      account_number: account.account_number || '',
      encrypted_investor_password: account.encrypted_investor_password || '',
      is_connected: account.is_connected || false,
      last_sync: null,
      sync_status: 'disconnected',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    accounts.push(newAccount);
    storage.set('accounts', accounts);
    return newAccount;
  },

  async updateAccount(id: string, updates: Partial<MockAccount>): Promise<MockAccount | null> {
    await sleep(500);
    const accounts = storage.get<MockAccount[]>('accounts') || [];
    const index = accounts.findIndex(acc => acc.id === id);
    
    if (index === -1) return null;
    
    accounts[index] = {
      ...accounts[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    storage.set('accounts', accounts);
    return accounts[index];
  },

  async deleteAccount(id: string): Promise<boolean> {
    await sleep(400);
    const accounts = storage.get<MockAccount[]>('accounts') || [];
    const filtered = accounts.filter(acc => acc.id !== id);
    
    if (filtered.length === accounts.length) return false;
    
    storage.set('accounts', filtered);
    return true;
  },

  async syncAccount(accountNumber: string): Promise<{ success: boolean; tradesImported: number }> {
    await sleep(2000); // Simulate sync process
    
    // Update account sync status
    const accounts = storage.get<MockAccount[]>('accounts') || [];
    const account = accounts.find(acc => acc.account_number === accountNumber);
    
    if (account) {
      account.sync_status = 'success';
      account.last_sync = new Date().toISOString();
      account.is_connected = true;
      storage.set('accounts', accounts);
    }
    
    // Simulate importing some trades
    const randomTradesCount = Math.floor(Math.random() * 5) + 1;
    
    return {
      success: true,
      tradesImported: randomTradesCount
    };
  }
};

// ========== TRADES SERVICE ==========

export const mockTradesService = {
  async getTrades(userId: string = MOCK_USER_ID, accountNumber?: string): Promise<MockTrade[]> {
    await sleep(400);
    let trades = storage.get<MockTrade[]>('trades') || generateMockTrades();
    
    trades = trades.filter(t => t.user_id === userId);
    
    if (accountNumber && accountNumber !== 'all') {
      trades = trades.filter(t => t.account_number === accountNumber);
    }
    
    return trades.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  },

  async createTrade(trade: Partial<MockTrade>): Promise<MockTrade> {
    await sleep(500);
    const trades = storage.get<MockTrade[]>('trades') || [];
    
    // Calculate system quality number from the 5 scoring fields
    const systemQualityNumber = calculateSystemQualityNumber(
      trade.analysis || 3,
      trade.execution || 3,
      trade.trade_management || 3,
      trade.risk_management || 3,
      trade.mindset || 3
    );

    const newTrade: MockTrade = {
      id: generateId(),
      user_id: trade.user_id || MOCK_USER_ID,
      account_number: trade.account_number || '12345678',
      position_id: trade.position_id || `POS-${generateId()}`,
      asset: trade.asset || '',
      asset_type: trade.asset_type || 'FX',
      trade_type: trade.trade_type || '',
      size: trade.size || 0,
      entry_price: trade.entry_price || 0,
      exit_price: trade.exit_price || 0,
      time: trade.time || new Date().toISOString(),
      duration: trade.duration || '',
      outcome: trade.outcome || 'win',
      pnl: trade.pnl || 0,
      entry_tag: trade.entry_tag,
      system_quality_number: systemQualityNumber,
      session: trade.session,
      emotion: trade.emotion,
      what_liked: trade.what_liked,
      what_didnt_like: trade.what_didnt_like,
      comment: trade.comment,
      // New scoring fields
      analysis: trade.analysis || 3,
      execution: trade.execution || 3,
      trade_management: trade.trade_management || 3,
      risk_management: trade.risk_management || 3,
      mindset: trade.mindset || 3,
      created_at: new Date().toISOString()
    };
    
    trades.push(newTrade);
    storage.set('trades', trades);
    return newTrade;
  },

  async updateTrade(id: string, updates: Partial<MockTrade>): Promise<MockTrade | null> {
    await sleep(400);
    const trades = storage.get<MockTrade[]>('trades') || [];
    const index = trades.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    // If any scoring fields are being updated, recalculate system quality number
    const currentTrade = trades[index];
    const updatedTrade = { ...currentTrade, ...updates };
    
    if (updates.analysis !== undefined || updates.execution !== undefined || 
        updates.trade_management !== undefined || updates.risk_management !== undefined || 
        updates.mindset !== undefined) {
      updatedTrade.system_quality_number = calculateSystemQualityNumber(
        updates.analysis || currentTrade.analysis || 3,
        updates.execution || currentTrade.execution || 3,
        updates.trade_management || currentTrade.trade_management || 3,
        updates.risk_management || currentTrade.risk_management || 3,
        updates.mindset || currentTrade.mindset || 3
      );
    }
    
    trades[index] = updatedTrade;
    storage.set('trades', trades);
    return trades[index];
  },

  async deleteTrade(id: string): Promise<boolean> {
    await sleep(300);
    const trades = storage.get<MockTrade[]>('trades') || [];
    const filtered = trades.filter(t => t.id !== id);
    
    if (filtered.length === trades.length) return false;
    
    storage.set('trades', filtered);
    return true;
  },

  async getTradeById(id: string): Promise<MockTrade | null> {
    await sleep(200);
    const trades = storage.get<MockTrade[]>('trades') || [];
    return trades.find(t => t.id === id) || null;
  },

  async importTrades(importedTrades: Partial<MockTrade>[]): Promise<{ success: boolean; count: number; duplicates: number }> {
    await sleep(1500); // Simulate processing time
    const existingTrades = storage.get<MockTrade[]>('trades') || [];
    
    let newCount = 0;
    let duplicateCount = 0;
    
    for (const trade of importedTrades) {
      // Check for duplicates by position_id
      const isDuplicate = existingTrades.some(t => t.position_id === trade.position_id);
      
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }
      
      // Calculate system quality number from the 5 scoring fields for imported trades
      const systemQualityNumber = calculateSystemQualityNumber(
        trade.analysis || 3,
        trade.execution || 3,
        trade.trade_management || 3,
        trade.risk_management || 3,
        trade.mindset || 3
      );

      const newTrade: MockTrade = {
        id: generateId(),
        user_id: trade.user_id || MOCK_USER_ID,
        account_number: trade.account_number || '12345678',
        position_id: trade.position_id || `POS-${generateId()}`,
        asset: trade.asset || '',
        asset_type: trade.asset_type || 'FX',
        trade_type: trade.trade_type || 'Long',
        size: trade.size || 0,
        entry_price: trade.entry_price || 0,
        exit_price: trade.exit_price || 0,
        time: trade.time || new Date().toISOString(),
        duration: trade.duration || '0 minutes',
        outcome: trade.outcome || 'win',
        pnl: trade.pnl || 0,
        entry_tag: trade.entry_tag,
        system_quality_number: systemQualityNumber,
        session: trade.session,
        emotion: trade.emotion,
        what_liked: trade.what_liked,
        what_didnt_like: trade.what_didnt_like,
        comment: trade.comment,
        // New scoring fields
        analysis: trade.analysis || 3,
        execution: trade.execution || 3,
        trade_management: trade.trade_management || 3,
        risk_management: trade.risk_management || 3,
        mindset: trade.mindset || 3,
        created_at: new Date().toISOString()
      };
      
      existingTrades.push(newTrade);
      newCount++;
    }
    
    storage.set('trades', existingTrades);
    
    return {
      success: true,
      count: newCount,
      duplicates: duplicateCount
    };
  }
};

// ========== STRATEGIES SERVICE ==========

export const mockStrategiesService = {
  async getStrategies(userId: string = MOCK_USER_ID): Promise<MockStrategy[]> {
    await sleep(300);
    const strategies = storage.get<MockStrategy[]>('strategies') || generateMockStrategies();
    return strategies.filter(s => s.user_id === userId);
  },

  async createStrategy(strategy: Partial<MockStrategy>): Promise<MockStrategy> {
    await sleep(500);
    const strategies = storage.get<MockStrategy[]>('strategies') || [];
    
    const newStrategy: MockStrategy = {
      id: generateId(),
      user_id: strategy.user_id || MOCK_USER_ID,
      name: strategy.name || '',
      category: strategy.category || '',
      description: strategy.description,
      created_at: new Date().toISOString()
    };
    
    strategies.push(newStrategy);
    storage.set('strategies', strategies);
    return newStrategy;
  }
};

// ========== NOTES SERVICE ==========

export const mockNotesService = {
  async getNotes(userId: string = MOCK_USER_ID, strategyId?: string): Promise<MockNote[]> {
    await sleep(300);
    let notes = storage.get<MockNote[]>('notes') || generateMockNotes();
    
    notes = notes.filter(n => n.user_id === userId);
    
    if (strategyId) {
      notes = notes.filter(n => n.strategy_id === strategyId);
    }
    
    // Ensure notes have the structure expected by Library.tsx component
    const libraryNotes = notes.map(note => ({
      ...note,
      title: note.title || `Note ${note.id}`,
      category: note.category || 'Uncategorized',
      tab: note.tab || 'notes'
    }));
    
    return libraryNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createNote(note: Partial<MockNote>): Promise<MockNote> {
    await sleep(400);
    const notes = storage.get<MockNote[]>('notes') || [];
    
    const newNote: MockNote = {
      id: generateId(),
      user_id: note.user_id || MOCK_USER_ID,
      strategy_id: note.strategy_id,
      text: note.text || '',
      content_type: note.content_type || 'plain-text',
      title: note.title || '',
      category: note.category || 'Uncategorized',
      tab: note.tab || 'notes',
      created_at: new Date().toISOString()
    };
    
    notes.push(newNote);
    storage.set('notes', notes);
    return newNote;
  },

  async updateNote(id: string, updates: Partial<MockNote>): Promise<MockNote | null> {
    await sleep(400);
    const notes = storage.get<MockNote[]>('notes') || [];
    const index = notes.findIndex(n => n.id === id);
    
    if (index === -1) return null;
    
    notes[index] = { 
      ...notes[index], 
      ...updates,
      updated_at: new Date().toISOString()
    };
    storage.set('notes', notes);
    return notes[index];
  },

  async searchNotes(userId: string = MOCK_USER_ID, searchTerms: string): Promise<MockNote[]> {
    await sleep(300);
    const notes = await this.getNotes(userId);
    
    const terms = searchTerms.toLowerCase().split(' ');
    return notes.filter(note => {
      const noteText = (note.text || '').toLowerCase();
      return terms.some(term => noteText.includes(term));
    });
  }
};

// ========== CHAT SERVICE ==========

export const mockChatService = {
  async getMessages(userId: string = MOCK_USER_ID): Promise<MockChatMessage[]> {
    await sleep(300);
    const messages = storage.get<MockChatMessage[]>('chatMessages') || generateMockChatMessages();
    return messages
      .filter(m => m.user_id === userId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async createMessage(message: Partial<MockChatMessage>): Promise<MockChatMessage> {
    await sleep(200);
    const messages = storage.get<MockChatMessage[]>('chatMessages') || [];
    
    const newMessage: MockChatMessage = {
      id: generateId(),
      user_id: message.user_id || MOCK_USER_ID,
      role: message.role || 'user',
      content: message.content || '',
      created_at: new Date().toISOString(),
      metadata: message.metadata
    };
    
    messages.push(newMessage);
    storage.set('chatMessages', messages);
    return newMessage;
  },

  async invokeAI(userMessage: string, mode: string, userId: string = MOCK_USER_ID): Promise<{
    response: string;
    usedNotes?: any[];
    hasKnowledgeBase?: boolean;
  }> {
    await sleep(1500); // Simulate AI processing time
    
    // Get relevant notes for knowledge base
    const notes = await mockNotesService.getNotes(userId);
    const relevantNotes = notes.slice(0, 2); // Simulate finding 2 relevant notes
    const hasKnowledgeBase = relevantNotes.length > 0;
    
    // Generate contextual response based on mode
    const responses = {
      coach: `Based on your trading performance, I can see you're maintaining discipline with a solid win rate. Your risk management approach shows maturity. To continue improving, focus on:\n\n1. Consistency in position sizing\n2. Emotional awareness before entering trades\n3. Pre-trade checklist adherence\n\nYour notes show strong understanding of market structure. Keep documenting your observations!`,
      
      pre_session: `Let's prepare for today's trading session:\n\n**Mental Check**: How are you feeling? Rate your focus 1-10.\n\n**Market Review**: Check the economic calendar for high-impact news.\n\n**Strategy Selection**: Based on current market conditions, which of your strategies fits best?\n\n**Risk Parameters**: Max risk today is 3% of account. Plan your position sizes accordingly.\n\nRemember: Perfect execution beats perfect prediction.`,
      
      post_session: `Great session! Let's review:\n\n**Wins**: Your disciplined stop-loss execution prevented larger losses. Entry timing on your winning trades showed patience.\n\n**Improvements**: Consider waiting for additional confirmation on reversal setups. Your notes mention this is a recurring theme.\n\n**Key Lesson**: Document what worked today. Your pullback strategy showed consistency.\n\nWhat's the main takeaway you want to remember for tomorrow?`,
      
      psychology: `Mental game is crucial for trading success. Let me analyze your emotional patterns:\n\n**Observation**: You've logged 'Anxious' emotions on several trades. This often precedes rushed decisions.\n\n**Strategy**: Implement the 30-minute rule after losses (from your notes). Use this time to journal and reset.\n\n**Strength**: Your awareness of emotional states is excellent. Most traders ignore this.\n\n**Practice**: Before each trade, take 3 deep breaths and visualize the complete trade cycle - entry, management, exit.\n\nConfidence comes from preparation and process, not outcomes.`,
      
      orderflow: `Let's dive into order flow concepts:\n\n**Market Structure**: Price moves in waves - impulse and correction. Identify the current phase.\n\n**Volume Analysis**: High volume at key levels indicates institutional activity. Your London Breakout strategy leverages this.\n\n**Support/Resistance**: These aren't lines but zones where orders cluster. Your supply/demand notes reflect this understanding.\n\n**Key Principle**: Price seeks liquidity. Look for areas where stops accumulate (recent highs/lows).\n\nYour trading shows understanding of these concepts. Keep studying institutional behavior.`
    };
    
    const response = responses[mode as keyof typeof responses] || responses.coach;
    
    return {
      response,
      hasKnowledgeBase,
      usedNotes: relevantNotes.length > 0 ? relevantNotes : undefined
    };
  }
};

// ========== FILE PARSING SERVICE (for imports) ==========

export const mockFileParsingService = {
  async parseCSV(file: File): Promise<Partial<MockTrade>[]> {
    await sleep(1000);
    
    // Simulate parsing - return some sample trades
    return [
      {
        position_id: `POS-IMPORT-${Date.now()}-1`,
        asset: 'EURUSD',
        asset_type: 'FX',
        trade_type: 'Long',
        size: 1.0,
        entry_price: 1.0850,
        exit_price: 1.0875,
        time: new Date().toISOString(),
        duration: '45 minutes',
        outcome: 'win',
        pnl: 250,
        account_number: '12345678'
      },
      {
        position_id: `POS-IMPORT-${Date.now()}-2`,
        asset: 'GBPUSD',
        asset_type: 'FX',
        trade_type: 'Short',
        size: 0.5,
        entry_price: 1.2650,
        exit_price: 1.2670,
        time: new Date().toISOString(),
        duration: '30 minutes',
        outcome: 'loss',
        pnl: -100,
        account_number: '12345678'
      }
    ];
  },

  async parseExcel(file: File): Promise<Partial<MockTrade>[]> {
    // Same as CSV for mock purposes
    return this.parseCSV(file);
  }
};

// Initialize data on module load
if (typeof window !== 'undefined') {
  initializeMockData();
}
