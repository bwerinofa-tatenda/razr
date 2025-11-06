-- Add accounts table and update trades table for account linking

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  encrypted_investor_password TEXT,
  is_connected BOOLEAN DEFAULT false,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT accounts_user_account_unique UNIQUE (user_id, account_number)
);

-- Add account_number and position_id to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS position_id TEXT;

-- Create unique constraint on position_id to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_trades_position_id ON trades(position_id) WHERE position_id IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_trades_account_number ON trades(account_number);

-- Enable Row Level Security on accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can view own accounts" ON accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on accounts
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE accounts IS 'MT5 trading accounts with encrypted credentials for auto-sync';
COMMENT ON COLUMN accounts.encrypted_investor_password IS 'AES encrypted investor password for read-only MT5 access';
COMMENT ON COLUMN trades.position_id IS 'Unique position ID from MT5 to prevent duplicate imports';
COMMENT ON COLUMN trades.account_number IS 'Links trade to a specific MT5 account';
