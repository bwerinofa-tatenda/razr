# Manual Testing Guide - TradeJournal AI Standalone Mode

## Quick Start
**Deployment URL**: https://n77bw2hd7mi6.space.minimax.io

## Testing Overview

This guide provides step-by-step instructions to verify all features of the TradeJournal AI standalone mock data mode. All features should work without any backend services or API configuration.

---

## Pre-Testing Setup

### Browser Requirements
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- LocalStorage enabled
- No ad blockers interfering with localStorage

### Browser DevTools Recommended
Open DevTools (F12) to:
- Monitor console for initialization messages
- Check Network tab for file loading
- View localStorage keys (Application → Local Storage)

---

## Test Sequence

### TEST 1: Initial Page Load & Mock Mode Banner

**Steps**:
1. Open https://n77bw2hd7mi6.space.minimax.io
2. Wait for page to fully load

**Expected Results**:
✅ Page loads without errors  
✅ Purple gradient banner at top shows "DEMO MODE"  
✅ Banner text: "Using mock data with local storage persistence. All features fully functional."  
✅ Banner has X button to dismiss  
✅ Console shows: "Initializing mock data for first time..." (first load only)  
✅ User auto-logged in (header shows "Demo User" or similar)  
✅ Sidebar visible with navigation items  

**Pass Criteria**: All items above present and functional

---

### TEST 2: Dashboard - Basic Display

**Steps**:
1. Navigate to Dashboard (should be default page)
2. Observe all sections

**Expected Results**:
✅ Account selector dropdown visible in header area  
✅ Three accounts in dropdown:
   - Main Trading Account (12345678)
   - Swing Trading Account (87654321)
   - Scalping Account (11223344)
✅ Metric cards display:
   - Net P&L (with teal color for positive)
   - Profit Factor (with gauge)
   - Trade Win % (with donut chart)
✅ Calendar component shows current month  
✅ Calendar cells show dates, P&L values, trade counts  
✅ Fusion Score chart visible  
✅ Cumulative P&L chart visible  

**Pass Criteria**: All components render with data

---

### TEST 3: Dashboard - Account Filtering

**Steps**:
1. Click account selector dropdown
2. Select "Main Trading Account (12345678)"
3. Observe data changes
4. Select "Swing Trading Account (87654321)"
5. Observe data changes again
6. Select "All Accounts"

**Expected Results**:
✅ Dropdown shows all 3 accounts plus "All Accounts" option  
✅ Selecting account updates all metrics  
✅ Calendar data changes based on selected account  
✅ Charts update with account-specific data  
✅ Smooth transitions (no page reload)  
✅ "All Accounts" shows combined data  

**Pass Criteria**: Filtering works, data updates correctly

---

### TEST 4: Trades Page - Table Display

**Steps**:
1. Navigate to "Trades" page via sidebar
2. Wait for table to load

**Expected Results**:
✅ Trade table displays  
✅ Shows 60+ total trades  
✅ Table columns include:
   - Asset, Type, Size, Entry Price, Exit Price
   - Time, Duration, Outcome, P&L
   - Session, Emotion, Tags
✅ Account filter dropdown present  
✅ Trades have realistic data (not placeholders)  
✅ P&L values color-coded (green for wins, red for losses)  

**Pass Criteria**: Table loads with complete data

---

### TEST 5: Trades Page - Filtering & Sorting

**Steps**:
1. Click account filter dropdown
2. Select specific account (e.g., "12345678")
3. Verify filtered trades
4. Click column header to sort (e.g., "P&L")
5. Click again to reverse sort

**Expected Results**:
✅ Account filter reduces trade count  
✅ Only trades from selected account shown  
✅ Clicking column header sorts data  
✅ Second click reverses sort order  
✅ Sort indicator visible (arrow icon)  
✅ Filtering and sorting work together  

**Pass Criteria**: All table features functional

---

### TEST 6: Imports & Connections - Connect Accounts Tab

**Steps**:
1. Navigate to "Imports & Connections" page
2. Click "Connect Accounts" tab
3. Observe account table

**Expected Results**:
✅ Table shows 3 accounts  
✅ Account details visible:
   - Main Trading Account: Connected, recent sync
   - Swing Trading Account: Connected, syncing status
   - Scalping Account: Disconnected
✅ Status indicators (green checkmark / gray X)  
✅ Last sync timestamps shown  
✅ Action buttons present: Sync, Disconnect, Delete  

**Pass Criteria**: All 3 accounts displayed correctly

---

### TEST 7: Imports & Connections - Add Account

**Steps**:
1. Click "Add New Account" button
2. Fill form:
   - Name: "Test Account"
   - Account Number: "99887766"
   - Password: "test123"
3. Click "Connect Account"
4. Wait for processing

**Expected Results**:
✅ Form appears when button clicked  
✅ All fields accept input  
✅ Submit button shows "Connecting..." during process  
✅ Toast notification: "Account connected successfully"  
✅ New account appears in table  
✅ Form closes after submission  
✅ Processing takes ~800ms (simulated delay)  

**Pass Criteria**: Account creation works, appears in table

---

### TEST 8: Imports & Connections - Sync Account

**Steps**:
1. Find connected account in table
2. Click "Sync" button
3. Wait for completion

**Expected Results**:
✅ Button shows "Syncing..." with spinner  
✅ Toast: "Syncing trades..." (loading state)  
✅ Process takes ~2 seconds  
✅ Toast updates: "Sync completed! Imported X trades"  
✅ Last sync timestamp updates  
✅ Button returns to "Sync" state  

**Pass Criteria**: Sync simulation works with proper feedback

---

### TEST 9: Imports & Connections - Import Reports Tab

**Steps**:
1. Click "Import Reports" tab
2. Observe upload area and sample downloads

**Expected Results**:
✅ Blue info box with sample file links  
✅ "Download CSV Sample" and "Download Excel Sample" buttons  
✅ Drag-drop upload area with instructions  
✅ Area shows "Drop files here or click to browse"  
✅ Click download buttons → files download  

**Pass Criteria**: All UI elements present and functional

---

### TEST 10: Imports & Connections - File Upload (Optional)

**Note**: This requires downloading the sample file first.

**Steps**:
1. Click "Download CSV Sample"
2. Drag downloaded file to upload area
3. Observe parsing

**Expected Results**:
✅ File appears in file list  
✅ Status shows "Parsing..."  
✅ Status changes to "Ready to import" with trade count  
✅ "Import" button becomes enabled  
✅ Click Import → shows "Importing..."  
✅ Toast shows import results  
✅ New trades appear in Trades page  

**Pass Criteria**: File upload and import simulation works

---

### TEST 11: AI Chat - Existing Conversations

**Steps**:
1. Navigate to "Chat" page
2. Scroll through existing messages

**Expected Results**:
✅ Chat interface loads  
✅ 4 existing messages visible (2 user, 2 assistant)  
✅ Messages show realistic content  
✅ Assistant messages reference trading data  
✅ Mode selector shows current mode (Coach)  
✅ Message timestamps visible  

**Pass Criteria**: Chat history displays correctly

---

### TEST 12: AI Chat - Send New Message

**Steps**:
1. Select chat mode (try "Pre-Session")
2. Type message: "What should I focus on today?"
3. Click Send or press Enter
4. Wait for response

**Expected Results**:
✅ Message added to chat immediately  
✅ Loading indicator appears  
✅ Wait ~1.5 seconds  
✅ AI response appears  
✅ Response is contextual (mentions trading, strategies)  
✅ Response may reference notes or trade data  
✅ New messages added to bottom of chat  
✅ Chat scrolls to show latest message  

**Pass Criteria**: Message sending and AI response works

---

### TEST 13: AI Chat - Mode Switching

**Steps**:
1. Click mode selector dropdown
2. Try each mode:
   - Coach
   - Pre-Session
   - Post-Session
   - Psychology
   - Order Flow
3. Send same question in different modes

**Expected Results**:
✅ All 5 modes available in dropdown  
✅ Current mode highlighted  
✅ Mode changes immediately when selected  
✅ Different modes produce different response styles  
✅ Mode persists when sending messages  

**Pass Criteria**: All modes accessible and produce appropriate responses

---

### TEST 14: Strategy Library

**Steps**:
1. Navigate to "Strategies" or "Strategy Library" page
2. Browse strategies and notes

**Expected Results**:
✅ 6 strategies displayed  
✅ Strategy names visible:
   - London Breakout
   - Pullback to EMA
   - Range Scalping
   - News Fade
   - Supply/Demand Zones
   - Asian Range Breakout
✅ Each strategy shows category  
✅ Descriptions visible  
✅ Notes section shows 8 notes  
✅ Notes have timestamps  

**Pass Criteria**: All strategies and notes display

---

### TEST 15: Data Persistence Test

**Steps**:
1. Open Browser DevTools (F12)
2. Go to Application → Storage → Local Storage → https://n77bw2hd7mi6.space.minimax.io
3. Look for keys starting with "tradejournal_mock_"
4. Refresh the page (F5)
5. Navigate to different pages
6. Refresh again

**Expected Results**:
✅ localStorage contains keys with "tradejournal_mock_" prefix  
✅ Keys include: accounts, trades, strategies, notes, chatMessages, initialized  
✅ After refresh, all data still present  
✅ Navigation between pages preserves state  
✅ Multiple refreshes don't lose data  
✅ New data persists across refreshes  

**Pass Criteria**: All data persists in localStorage

---

### TEST 16: Responsive Design - Mobile View

**Steps**:
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select mobile device (iPhone/Android)
4. Navigate through pages

**Expected Results**:
✅ Sidebar collapses on mobile  
✅ Hamburger menu icon appears  
✅ Clicking hamburger opens sidebar  
✅ All pages accessible on mobile  
✅ Charts resize appropriately  
✅ Tables scroll horizontally  
✅ Buttons and forms usable on touch  
✅ No horizontal scroll on pages  

**Pass Criteria**: App fully functional on mobile viewports

---

### TEST 17: Theme/Dark Mode (If Implemented)

**Steps**:
1. Look for theme toggle in header
2. Click to switch themes
3. Observe changes

**Expected Results**:
✅ Theme toggle present (sun/moon icon)  
✅ Clicking toggles between light/dark mode  
✅ All pages respect theme choice  
✅ Theme persists after refresh  
✅ Charts update colors for theme  
✅ Text remains readable in both modes  

**Pass Criteria**: Theme switching works across all pages

---

## Verification Checklist Summary

After completing all tests, verify:

- [  ] Mock Mode Banner present and dismissible
- [  ] Dashboard displays all data correctly
- [  ] Account filtering works on Dashboard and Trades
- [  ] Trades table shows 60+ trades
- [  ] 3 MT5 accounts displayed in Imports & Connections
- [  ] Account sync simulation works
- [  ] File upload and import simulation works
- [  ] AI Chat has existing messages and responds to new ones
- [  ] All 5 chat modes work
- [  ] 6 strategies displayed in library
- [  ] 8 notes displayed
- [  ] All data persists in localStorage after refresh
- [  ] Responsive design works on mobile
- [  ] No console errors
- [  ] No broken images or missing data

---

## Troubleshooting

### If Page Doesn't Load:
- Check internet connection
- Try different browser
- Clear browser cache
- Disable browser extensions
- Check browser console for errors

### If Data Doesn't Appear:
- Check console for "Initializing mock data" message
- Verify localStorage is enabled
- Clear localStorage and refresh
- Check browser DevTools → Application → Local Storage

### If localStorage Gets Corrupted:
1. Open DevTools → Application → Local Storage
2. Find https://n77bw2hd7mi6.space.minimax.io
3. Delete all "tradejournal_mock_" keys
4. Refresh page
5. Data will re-initialize

---

## Expected Performance

- **Initial Load**: 2-4 seconds
- **Page Navigation**: Instant
- **Account Filtering**: <300ms
- **Table Sorting**: Instant
- **Account Sync**: ~2 seconds (simulated)
- **File Import**: ~1-1.5 seconds (simulated)
- **AI Chat Response**: ~1.5 seconds (simulated)
- **Data Persistence**: Instant

---

## Success Criteria

**Application is working correctly if**:
- All 17 tests pass
- No console errors
- All data displays correctly
- All interactions work smoothly
- Data persists across refreshes
- Responsive design works

---

## Reporting Issues

If you encounter any issues during testing, please note:
1. Which test number failed
2. Browser and version
3. Console error messages (if any)
4. Screenshots of the issue
5. Steps to reproduce

---

## Conclusion

This standalone mock data mode demonstrates the full functionality of TradeJournal AI without requiring any backend services, Supabase configuration, or API keys. All features use local browser storage and simulated data processing to provide a complete, realistic user experience.
