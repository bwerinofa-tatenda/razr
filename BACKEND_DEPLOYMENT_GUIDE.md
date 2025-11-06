# TradeJournal AI - MT5 Integration Backend Deployment Guide

## Overview
This guide will help you deploy the MT5 accounts and imports functionality backend components to your Supabase project.

## Prerequisites
- Supabase project: `jtxuxessjppnlhpvjuah`
- Supabase URL: `https://jtxuxessjppnlhpvjuah.supabase.co`
- Service Role Key (available in project settings)

## Deployment Status

### ✅ Frontend (100% Complete)
- Imports & Connections page with 2 tabs
- CSV/Excel file upload and parsing
- MT5 account connection form
- Account filtering on Dashboard and Trades pages
- Sample MT5 files for testing
- All UI components and interactions working
- **Currently running in MOCK MODE** (displays demo data)

### ⏳ Backend (Ready for Deployment)
- Database migration file created
- Edge functions created (mock implementations)
- RLS policies defined
- **Needs manual deployment** (see instructions below)

---

## Step 1: Apply Database Migration

The migration creates the `accounts` table and adds columns to the `trades` table.

### Option A: Via Supabase Dashboard (Recommended)

1. **Open SQL Editor**
   - Go to: https://supabase.com/dashboard/project/jtxuxessjppnlhpvjuah/sql
   - Click "New Query"

2. **Copy Migration SQL**
   - Open file: `tradejournal-ai/supabase/migrations/003_add_accounts_and_imports.sql`
   - Copy all contents

3. **Execute Migration**
   - Paste the SQL into the editor
   - Click "Run" button
   - Wait for "Success" message

4. **Verify**
   - Go to Table Editor
   - Check that `accounts` table exists
   - Open `trades` table and verify new columns: `account_number`, `position_id`

### Option B: Via Supabase CLI

```bash
# Install CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
cd tradejournal-ai
supabase link --project-ref jtxuxessjppnlhpvjuah

# Apply all pending migrations
supabase db push
```

### Migration Contents

The migration creates:

**New Table: `accounts`**
- `id` (UUID, primary key)
- `user_id` (UUID, references auth.users)
- `name` (TEXT) - User-friendly account name
- `account_number` (TEXT) - MT5 account number
- `encrypted_investor_password` (TEXT) - AES encrypted password
- `is_connected` (BOOLEAN) - Connection status
- `last_sync` (TIMESTAMP) - Last successful sync time
- `created_at`, `updated_at` (TIMESTAMP)

**Updates to `trades` Table:**
- Adds `account_number` (TEXT) column
- Adds `position_id` (TEXT) column
- Creates unique index on `position_id` to prevent duplicate imports

**Security (RLS Policies):**
- Users can only view/modify their own accounts
- Full CRUD policies for `accounts` table

---

## Step 2: Deploy Edge Functions

Two edge functions need to be deployed:

### Functions Overview

1. **`sync-mt5-trades`**
   - Purpose: Fetches trades from MT5 API and imports to database
   - Input: `account_id`
   - Output: Number of trades synced, sync status
   - **Current status: MOCK implementation** (simulates MT5 API)

2. **`validate-mt5-account`**
   - Purpose: Validates MT5 credentials before saving
   - Input: `account_number`, `encrypted_password`
   - Output: Validation result, account details
   - **Current status: MOCK implementation** (basic format validation)

### Deployment via Supabase CLI

```bash
# Navigate to project directory
cd tradejournal-ai

# Deploy both functions
supabase functions deploy sync-mt5-trades
supabase functions deploy validate-mt5-account

# Verify deployment
supabase functions list
```

### Manual Deployment via Dashboard

1. Go to: https://supabase.com/dashboard/project/jtxuxessjppnlhpvjuah/functions
2. Click "Create Function"
3. For each function:
   - Name: `sync-mt5-trades` or `validate-mt5-account`
   - Copy code from: `supabase/functions/[function-name]/index.ts`
   - Paste and deploy

---

## Step 3: Test the Deployment

### Test Database Schema

```sql
-- Check accounts table
SELECT * FROM accounts LIMIT 5;

-- Check trades table for new columns
SELECT id, account_number, position_id FROM trades LIMIT 5;

-- Verify RLS policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'accounts';
```

### Test Edge Functions (via Dashboard)

1. Go to Functions page in Supabase Dashboard
2. Select `validate-mt5-account`
3. Test with payload:
```json
{
  "account_number": "12345678",
  "encrypted_password": "test_encrypted_password"
}
```
4. Should return validation success (mock response)

### Test in Application

1. **Visit Application**
   - URL: https://wkv4iq3ts1a2.space.minimax.io
   - Login/Sign up

2. **Test File Import**
   - Go to: Imports & Connections > Import Reports tab
   - Download sample file (CSV or Excel)
   - Drag-drop the file into upload zone
   - Click "Import XX Trades"
   - Verify success toast notification
   - Go to Trades page and check for imported trades

3. **Test Account Connection**
   - Go to: Imports & Connections > Connect Accounts tab
   - Fill form:
     - Account Name: "Test MT5 Account"
     - Account Number: "12345678"
     - Investor Password: "test123"
   - Click "Connect Account"
   - Verify account appears in table below

4. **Test Account Filtering**
   - Go to Dashboard page
   - Use account dropdown (top-right area)
   - Select specific account
   - Verify data filters correctly
   - Repeat on Trades page

---

## Step 4: Configure Real MT5 Integration (Optional)

The current edge functions are **mock implementations**. To connect to real MT5 accounts:

### Requirements

1. MT5 broker must provide API access
2. Obtain MT5 API credentials from your broker
3. Review broker's API documentation

### Implementation Steps

1. **Update `validate-mt5-account` function:**
   - Replace mock validation with real MT5 API call
   - Implement actual credential validation
   - Verify investor (read-only) password
   
2. **Update `sync-mt5-trades` function:**
   - Implement MT5 API client
   - Decrypt stored password using service role key
   - Fetch trades from MT5 account
   - Transform MT5 trade format to app schema
   - Handle pagination for large trade histories

3. **Add Environment Variables:**
   ```bash
   # In Supabase Dashboard > Settings > Edge Functions
   MT5_API_ENDPOINT=https://your-broker-api.com
   MT5_API_KEY=your_api_key
   ```

4. **Update Frontend:**
   - Remove mock mode checks in `ConnectAccounts.tsx`
   - Enable real-time sync scheduling
   - Add proper error handling for API failures

### Security Notes

- Passwords are encrypted client-side using AES (CryptoJS)
- Encryption key is derived from user ID
- Edge functions decrypt using service role context
- Always use **investor (read-only) passwords**, never trading passwords
- Implement rate limiting to prevent API abuse

---

## Troubleshooting

### Migration Fails

**Error: "relation already exists"**
- Solution: Migration was already applied, skip to next step

**Error: "permission denied"**
- Solution: Ensure you're using service role key or logged in with owner account

### Edge Function Deployment Fails

**Error: "not logged in"**
- Solution: Run `supabase login` and try again

**Error: "project not linked"**
- Solution: Run `supabase link --project-ref jtxuxessjppnlhpvjuah`

### Application Not Showing Real Data

**Problem: Still showing mock accounts**
- Check: Migration applied successfully?
- Check: Edge functions deployed?
- Check: Browser console for errors
- Solution: Hard refresh (Ctrl+Shift+R) to clear cache

**Problem: Import fails with error**
- Check: `position_id` unique constraint error means trade already imported
- Check: Network tab for API errors
- Solution: Review Supabase logs in Dashboard

---

## File Locations

```
tradejournal-ai/
├── supabase/
│   ├── migrations/
│   │   └── 003_add_accounts_and_imports.sql  ← Database migration
│   └── functions/
│       ├── sync-mt5-trades/
│       │   └── index.ts                       ← Edge function
│       └── validate-mt5-account/
│           └── index.ts                       ← Edge function
├── src/
│   ├── pages/
│   │   └── ImportsConnections.tsx             ← Main page
│   ├── components/
│   │   ├── imports/
│   │   │   ├── ImportReports.tsx              ← File upload tab
│   │   │   └── ConnectAccounts.tsx            ← Account connection tab
│   │   └── common/
│   │       └── AccountSelector.tsx            ← Dropdown filter
│   └── ...
└── public/
    └── samples/
        ├── mt5-sample-trades.csv              ← Test data
        └── mt5-sample-trades.xlsx             ← Test data
```

---

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard > Logs
2. Check browser console for frontend errors
3. Verify environment variables are set
4. Review the IMPLEMENTATION_SUMMARY.md for technical details

---

## Summary Checklist

- [ ] Database migration applied
- [ ] `accounts` table created
- [ ] `trades` table updated with new columns
- [ ] RLS policies active
- [ ] Edge functions deployed
- [ ] Application tested end-to-end
- [ ] File import working
- [ ] Account connection working
- [ ] Account filtering working
- [ ] (Optional) Real MT5 integration configured

**Current Status:** Frontend deployed and ready, backend awaiting manual deployment.
