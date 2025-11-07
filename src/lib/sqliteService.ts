// SQLite-based database implementation using sql.js
import initSqlJs from 'sql.js';

// Database instance
let db: any = null;
let SQL: any = null;

// Initialize SQLite database
const initializeDatabase = async () => {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });
  }

  if (!db) {
    // Try to load existing database from localStorage
    const savedDbData = localStorage.getItem('tradejournal_sqlite_db');
    if (savedDbData) {
      const dbArray = new Uint8Array(JSON.parse(savedDbData));
      db = new SQL.Database(dbArray);
    } else {
      db = new SQL.Database();
      createTables();
      initializeSampleData();
    }
  }
};

// Create database tables
const createTables = () => {
  if (!db) return;

  // Create trades table with comprehensive fields
  db.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_number TEXT NOT NULL,
      position_id TEXT UNIQUE NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
      volume REAL NOT NULL,
      open_price REAL NOT NULL,
      close_price REAL,
      open_time TEXT NOT NULL,
      close_time TEXT,
      commission REAL DEFAULT 0,
      swap REAL DEFAULT 0,
      profit REAL,
      comment TEXT,
      -- Additional fields for comprehensive trading data
      asset TEXT,
      asset_type TEXT CHECK (asset_type IN ('FX', 'Futures', 'Stocks', 'Crypto', 'Commodities')),
      trade_type TEXT CHECK (trade_type IN ('long', 'short')),
      size REAL,
      session TEXT,
      duration TEXT,
      entry_price REAL,
      exit_price REAL,
      time TEXT,
      outcome TEXT CHECK (outcome IN ('win', 'loss', 'break_even')),
      pnl REAL,
      entry_tag TEXT,
      emotion TEXT,
      analysis REAL,
      execution REAL,
      trade_management REAL,
      risk_management REAL,
      mindset REAL,
      what_liked TEXT,
      what_didnt_like TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create accounts table
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      account_number TEXT UNIQUE NOT NULL,
      encrypted_investor_password TEXT,
      is_connected BOOLEAN DEFAULT 0,
      last_sync TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_number)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_trades_open_time ON trades(open_time)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number)`);
};

// Initialize with sample data
const initializeSampleData = () => {
  if (!db) return;

  // Check if we already have data
  const result = db.exec("SELECT COUNT(*) as count FROM accounts");
  if (result[0]?.values[0][0] > 0) return;

  // Add sample accounts
  db.run(`
    INSERT INTO accounts (name, account_number, is_connected)
    VALUES ('Main Trading Account', '12345678', 1)
  `);

  db.run(`
    INSERT INTO accounts (name, account_number, is_connected)
    VALUES ('Demo Account', '87654321', 0)
  `);

  // Add sample trades
  db.run(`
    INSERT INTO trades (account_number, position_id, symbol, side, volume, open_price, close_price, open_time, close_time, commission, swap, profit, comment)
    VALUES ('12345678', 'POS001', 'EURUSD', 'buy', 0.1, 1.0850, 1.0900, '2025-01-01T10:00:00Z', '2025-01-01T15:00:00Z', 0.5, 0, 5.0, 'Sample trade')
  `);

  db.run(`
    INSERT INTO trades (account_number, position_id, symbol, side, volume, open_price, close_price, open_time, close_time, commission, swap, profit, comment)
    VALUES ('12345678', 'POS002', 'GBPUSD', 'sell', 0.05, 1.2750, 1.2700, '2025-01-02T10:00:00Z', '2025-01-02T15:00:00Z', 0.25, 0, 2.5, 'Another sample trade')
  `);

  saveDatabase();
};

// Save database to localStorage
const saveDatabase = () => {
  if (!db) return;
  const data = db.export();
  const buffer = Array.from(data);
  localStorage.setItem('tradejournal_sqlite_db', JSON.stringify(buffer));
};

// Helper function to convert database row to Trade object
const rowToTrade = (row: any): Trade => ({
  id: row.id,
  account_number: row.account_number,
  position_id: row.position_id,
  symbol: row.symbol,
  side: row.side,
  volume: row.volume,
  open_price: row.open_price,
  close_price: row.close_price || undefined,
  open_time: row.open_time,
  close_time: row.close_time || undefined,
  commission: row.commission || undefined,
  swap: row.swap || undefined,
  profit: row.profit || undefined,
  comment: row.comment || undefined,
  created_at: row.created_at,
  updated_at: row.updated_at
});

// Helper function to convert database row to Account object
const rowToAccount = (row: any): Account => ({
  id: row.id,
  name: row.name,
  account_number: row.account_number,
  encrypted_investor_password: row.encrypted_investor_password || undefined,
  is_connected: Boolean(row.is_connected),
  last_sync: row.last_sync || undefined,
  created_at: row.created_at,
  updated_at: row.updated_at
});

// Trade interfaces
export interface Trade {
  id?: number;
  account_number: string;
  position_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  open_price: number;
  close_price?: number;
  open_time: string;
  close_time?: string;
  commission?: number;
  swap?: number;
  profit?: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Account {
  id?: number;
  name: string;
  account_number: string;
  encrypted_investor_password?: string;
  is_connected: boolean;
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TradeStats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_profit: number;
  avg_profit: number;
  max_profit: number;
  min_profit: number;
  total_volume: number;
}

// Trade operations
export const tradeOperations = {
  create: async (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    await initializeDatabase();
    const stmt = db.prepare(`
      INSERT INTO trades (
        account_number, position_id, symbol, side, volume, open_price,
        close_price, open_time, close_time, commission, swap, profit, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      trade.account_number,
      trade.position_id,
      trade.symbol,
      trade.side,
      trade.volume,
      trade.open_price,
      trade.close_price || null,
      trade.open_time,
      trade.close_time || null,
      trade.commission || 0,
      trade.swap || 0,
      trade.profit || null,
      trade.comment || null
    ]);

    stmt.free();
    saveDatabase();
    return db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  },

  update: async (id: number, updates: Partial<Trade>): Promise<void> => {
    await initializeDatabase();
    const fields = Object.keys(updates).filter(key => updates[key as keyof Trade] !== undefined);
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = updates[field as keyof Trade];
      if (value != null && typeof value === 'object' && (value as any).constructor === Date) {
        return (value as Date).toISOString();
      }
      return value;
    });

    values.push(new Date().toISOString()); // updated_at
    values.push(id); // WHERE id

    const stmt = db.prepare(`UPDATE trades SET ${setClause}, updated_at = ? WHERE id = ?`);
    stmt.run(values);
    stmt.free();
    saveDatabase();
  },

  getByPositionId: async (positionId: string): Promise<Trade | undefined> => {
    await initializeDatabase();
    const stmt = db.prepare("SELECT * FROM trades WHERE position_id = ?");
    const result = stmt.getAsObject([positionId]);
    stmt.free();
    return result ? rowToTrade(result) : undefined;
  },

  getByAccount: async (accountNumber: string): Promise<Trade[]> => {
    await initializeDatabase();
    const stmt = db.prepare("SELECT * FROM trades WHERE account_number = ? ORDER BY open_time DESC");
    const results = stmt.getAsObjectAll([accountNumber]);
    stmt.free();
    return results.map(rowToTrade);
  },

  getAll: async (): Promise<Trade[]> => {
    await initializeDatabase();
    const stmt = db.prepare("SELECT * FROM trades ORDER BY open_time DESC");
    const results = stmt.getAsObjectAll([]);
    stmt.free();
    return results.map(rowToTrade);
  },

  getById: async (id: number): Promise<Trade | undefined> => {
    await initializeDatabase();
    const stmt = db.prepare("SELECT * FROM trades WHERE id = ?");
    const result = stmt.getAsObject([id]);
    stmt.free();
    return result ? rowToTrade(result) : undefined;
  },

  delete: async (id: number): Promise<void> => {
    await initializeDatabase();
    const stmt = db.prepare("DELETE FROM trades WHERE id = ?");
    stmt.run([id]);
    stmt.free();
    saveDatabase();
  },

  getStats: async (accountNumber?: string): Promise<TradeStats> => {
    await initializeDatabase();

    let query = "SELECT * FROM trades";
    let params: any[] = [];

    if (accountNumber) {
      query += " WHERE account_number = ?";
      params = [accountNumber];
    }

    const stmt = db.prepare(query);
    const trades = stmt.getAsObjectAll(params).map(rowToTrade);
    stmt.free();

    const total_trades = trades.length;
    const winning_trades = trades.filter((t: Trade) => (t.profit || 0) > 0).length;
    const losing_trades = trades.filter((t: Trade) => (t.profit || 0) < 0).length;
    const profits = trades.map((t: Trade) => t.profit || 0);
    const total_profit = profits.reduce((sum, p) => sum + p, 0);
    const avg_profit = total_trades > 0 ? total_profit / total_trades : 0;
    const max_profit = profits.length > 0 ? Math.max(...profits) : 0;
    const min_profit = profits.length > 0 ? Math.min(...profits) : 0;
    const total_volume = trades.reduce((sum, t) => sum + (t.volume || 0), 0);

    return {
      total_trades,
      winning_trades,
      losing_trades,
      total_profit,
      avg_profit,
      max_profit,
      min_profit,
      total_volume
    };
  }
};

// Account operations
export const accountOperations = {
  create: async (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    await initializeDatabase();
    const stmt = db.prepare(`
      INSERT INTO accounts (name, account_number, encrypted_investor_password, is_connected, last_sync)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run([
      account.name,
      account.account_number,
      account.encrypted_investor_password || null,
      account.is_connected ? 1 : 0,
      account.last_sync || null
    ]);

    stmt.free();
    saveDatabase();
    return db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  },

  update: async (accountNumber: string, updates: Partial<Account>): Promise<void> => {
    await initializeDatabase();
    const fields = Object.keys(updates).filter(key => updates[key as keyof Account] !== undefined);
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = updates[field as keyof Account];
      if (field === 'is_connected') return value ? 1 : 0;
      return value;
    });

    values.push(new Date().toISOString()); // updated_at
    values.push(accountNumber); // WHERE account_number

    const stmt = db.prepare(`UPDATE accounts SET ${setClause}, updated_at = ? WHERE account_number = ?`);
    stmt.run(values);
    stmt.free();
    saveDatabase();
  },

  getAll: async (): Promise<Account[]> => {
    await initializeDatabase();
    const stmt = db.prepare("SELECT * FROM accounts ORDER BY name");
    const results = stmt.getAsObjectAll([]);
    stmt.free();
    return results.map(rowToAccount);
  },

  getByNumber: async (accountNumber: string): Promise<Account | undefined> => {
    await initializeDatabase();
    const stmt = db.prepare("SELECT * FROM accounts WHERE account_number = ?");
    const result = stmt.getAsObject([accountNumber]);
    stmt.free();
    return result ? rowToAccount(result) : undefined;
  },

  delete: async (accountNumber: string): Promise<void> => {
    await initializeDatabase();
    const stmt = db.prepare("DELETE FROM accounts WHERE account_number = ?");
    stmt.run([accountNumber]);
    stmt.free();
    saveDatabase();
  }
};

// Utility functions
export const dbUtils = {
  backup: async (): Promise<void> => {
    await initializeDatabase();
    const data = db.export();
    const buffer = Array.from(data);
    const blob = new Blob([JSON.stringify(buffer)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradejournal_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  close: (): void => {
    if (db) {
      saveDatabase();
      db.close();
      db = null;
    }
  },

  getStats: async (): Promise<{ trades: number; accounts: number }> => {
    await initializeDatabase();
    const tradeResult = db.exec("SELECT COUNT(*) as count FROM trades");
    const accountResult = db.exec("SELECT COUNT(*) as count FROM accounts");

    return {
      trades: tradeResult[0]?.values[0][0] || 0,
      accounts: accountResult[0]?.values[0][0] || 0
    };
  }
};
