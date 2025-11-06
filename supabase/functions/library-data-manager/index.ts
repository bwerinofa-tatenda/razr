// Library Data Management Edge Function
// Handles complex operations for the Library/Notes system

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { action, data } = await req.json();

        // Get service role key for database operations
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        let result;

        switch (action) {
            case 'migrate_from_local_storage':
                result = await migrateFromLocalStorage(supabaseUrl, serviceRoleKey, userId, data);
                break;

            case 'calculate_trading_stats':
                result = await calculateTradingStats(supabaseUrl, serviceRoleKey, userId, data);
                break;

            case 'extract_trading_metrics':
                result = await extractTradingMetrics(data.content);
                break;

            case 'bulk_operations':
                result = await performBulkOperations(supabaseUrl, serviceRoleKey, userId, data);
                break;

            case 'sync_with_trades':
                result = await syncWithTradesData(supabaseUrl, serviceRoleKey, userId, data);
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Library operations error:', error);

        const errorResponse = {
            error: {
                code: 'LIBRARY_OPERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Migrate data from localStorage to Supabase
async function migrateFromLocalStorage(supabaseUrl, serviceRoleKey, userId, data) {
    const { notes, folders, templates } = data;

    const results = {
        notes: 0,
        folders: 0,
        templates: 0,
        errors: []
    };

    // Migrate folders first
    if (folders && Array.isArray(folders)) {
        for (const folder of folders) {
            try {
                const folderData = {
                    user_id: userId,
                    name: folder.name,
                    type: folder.type,
                    parent_id: folder.parentId,
                    expanded: folder.expanded,
                    sort_order: 0
                };

                await fetch(`${supabaseUrl}/rest/v1/library_folders`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(folderData)
                });

                results.folders++;
            } catch (error) {
                results.errors.push(`Folder migration error: ${error.message}`);
            }
        }
    }

    // Migrate notes
    if (notes && Array.isArray(notes)) {
        for (const note of notes) {
            try {
                const noteData = {
                    user_id: userId,
                    title: note.title,
                    text: note.text,
                    content_type: note.content_type || 'plain-text',
                    category: note.category,
                    tab: note.tab,
                    trading_data: note.tradingData || {},
                    content_data: note.contentData || {},
                    metadata: note.metadata || {},
                    versions: note.versions || [],
                    current_version: note.currentVersion,
                    created_at: note.created_at,
                    updated_at: note.updated_at
                };

                await fetch(`${supabaseUrl}/rest/v1/library_notes`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(noteData)
                });

                results.notes++;
            } catch (error) {
                results.errors.push(`Note migration error: ${error.message}`);
            }
        }
    }

    // Migrate templates
    if (templates && Array.isArray(templates)) {
        for (const template of templates) {
            try {
                const templateData = {
                    user_id: userId,
                    name: template.name,
                    description: template.description,
                    category: template.category,
                    content: template.content,
                    tags: template.tags || [],
                    is_favorite: template.isFavorite || false,
                    usage_count: template.usageCount || 0,
                    last_used_at: template.lastUsed,
                    is_system: template.isSystem || false
                };

                await fetch(`${supabaseUrl}/rest/v1/library_templates`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(templateData)
                });

                results.templates++;
            } catch (error) {
                results.errors.push(`Template migration error: ${error.message}`);
            }
        }
    }

    return {
        migration_complete: true,
        migrated_items: results,
        message: `Migration completed. Notes: ${results.notes}, Folders: ${results.folders}, Templates: ${results.templates}`
    };
}

// Calculate trading statistics from trades data
async function calculateTradingStats(supabaseUrl, serviceRoleKey, userId, data) {
    const { trades } = data;

    if (!trades || !Array.isArray(trades)) {
        throw new Error('Trades data is required for statistics calculation');
    }

    const winningTrades = trades.filter(trade => trade.outcome === 'win');
    const losingTrades = trades.filter(trade => trade.outcome === 'loss');

    const totalWins = winningTrades.length;
    const totalLosses = losingTrades.length;
    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

    const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const avgWin = totalWins > 0 ? winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / totalWins : 0;
    const avgLoss = totalLosses > 0 ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / totalLosses) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Calculate consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    trades.forEach(trade => {
        if (trade.outcome === 'win') {
            currentWins++;
            currentLosses = 0;
            maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
        } else if (trade.outcome === 'loss') {
            currentLosses++;
            currentWins = 0;
            maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
        }
    });

    // Calculate maximum drawdown
    let runningBalance = 0;
    let peakBalance = 0;
    let maxDrawdown = 0;

    trades.forEach(trade => {
        runningBalance += (trade.pnl || 0);
        peakBalance = Math.max(peakBalance, runningBalance);
        const drawdown = peakBalance - runningBalance;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    // Simplified Sharpe ratio calculation
    const returns = trades.map(trade => trade.pnl || 0);
    const avgReturn = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;
    const returnStdDev = returns.length > 1 ? Math.sqrt(
        returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1)
    ) : 0;
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

    return {
        totalPnl,
        winRate: Number(winRate.toFixed(2)),
        totalTrades,
        winners: totalWins,
        losers: totalLosses,
        avgWin: Number(avgWin.toFixed(2)),
        avgLoss: Number(avgLoss.toFixed(2)),
        profitFactor: Number(profitFactor.toFixed(2)),
        maxDrawdown: Number(maxDrawdown.toFixed(2)),
        consecutiveWins: maxConsecutiveWins,
        consecutiveLosses: maxConsecutiveLosses,
        sharpeRatio: Number(sharpeRatio.toFixed(3)),
        lastUpdated: new Date().toISOString()
    };
}

// Extract trading metrics from note content using AI-like pattern matching
async function extractTradingMetrics(content) {
    if (!content || typeof content !== 'string') {
        return { pnl: null, winRate: null, detectedType: null };
    }

    const lowerContent = content.toLowerCase();
    const metrics = {};

    // Extract P&L values
    const pnlPatterns = [
        /(?:pnl|p&l|profit|loss)[:\s]*\$?([-+]?\d+(?:,?\d*)*\.?\d*)/gi,
        /\$([-+]?\d+(?:,?\d*)*\.?\d*)/g,
        /([-+]?\d+(?:,?\d*)*\.?\d*)\s*(?:dollars|\$|profit|loss|win|loss)/gi
    ];

    for (const pattern of pnlPatterns) {
        const matches = content.match(pattern);
        if (matches) {
            const value = parseFloat(matches[0].replace(/[$,\s]/g, '').match(/[-+]?\d+(?:,?\d*)*\.?\d*/)?.[0] || '0');
            if (!isNaN(value)) {
                metrics.pnl = value;
                break;
            }
        }
    }

    // Extract win rate
    const winRatePattern = /(?:win rate|winning|win[:\s]*)(\d+(?:\.\d+)?)\s*%/gi;
    const winRateMatch = content.match(winRatePattern);
    if (winRateMatch) {
        const value = parseFloat(winRateMatch[0].match(/(\d+(?:\.\d+)?)/)?.[1] || '0');
        if (!isNaN(value)) {
            metrics.winRate = value;
        }
    }

    // Detect note type
    const tradingKeywords = ['trade', 'pnl', 'entry', 'exit', 'stop loss', 'take profit', 'risk', 'position', 'currency', 'forex', 'analysis'];
    const planKeywords = ['plan', 'pre-market', 'post-session', 'daily', 'weekly', 'monthly', 'goals', 'strategy'];
    const psychologyKeywords = ['mindset', 'psychology', 'emotional', 'stress', 'confidence', 'fear', 'greed'];

    let detectedType = null;
    if (planKeywords.some(keyword => lowerContent.includes(keyword))) {
        detectedType = 'plan';
    } else if (psychologyKeywords.some(keyword => lowerContent.includes(keyword))) {
        detectedType = 'psychology';
    } else if (tradingKeywords.some(keyword => lowerContent.includes(keyword))) {
        detectedType = 'trading';
    } else {
        detectedType = 'general';
    }

    return {
        ...metrics,
        detectedType,
        hasTradingContent: tradingKeywords.some(keyword => lowerContent.includes(keyword)),
        contentLength: content.length,
        extractedAt: new Date().toISOString()
    };
}

// Perform bulk operations on notes
async function performBulkOperations(supabaseUrl, serviceRoleKey, userId, data) {
    const { operation, noteIds, updates } = data;

    if (!operation || !noteIds || !Array.isArray(noteIds)) {
        throw new Error('Operation and noteIds are required');
    }

    const results = {
        successful: [],
        failed: [],
        total: noteIds.length
    };

    for (const noteId of noteIds) {
        try {
            let updateData = {};

            switch (operation) {
                case 'delete':
                    updateData = { deleted_at: new Date().toISOString() };
                    break;
                case 'restore':
                    updateData = { deleted_at: null };
                    break;
                case 'update':
                    updateData = updates || {};
                    break;
                case 'move':
                    updateData = { folder_id: updates?.folderId };
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            updateData.updated_at = new Date().toISOString();

            const response = await fetch(`${supabaseUrl}/rest/v1/library_notes?id=eq.${noteId}&user_id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                results.successful.push(noteId);
            } else {
                results.failed.push({ id: noteId, error: await response.text() });
            }

        } catch (error) {
            results.failed.push({ id: noteId, error: error.message });
        }
    }

    return results;
}

// Sync note data with trades data
async function syncWithTradesData(supabaseUrl, serviceRoleKey, userId, data) {
    const { noteId, trades } = data;

    if (!noteId || !trades) {
        throw new Error('Note ID and trades data are required for synchronization');
    }

    // Extract trade references from note content (simplified)
    const noteResponse = await fetch(`${supabaseUrl}/rest/v1/library_notes?id=eq.${noteId}&user_id=eq.${userId}&select=*`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!noteResponse.ok) {
        throw new Error('Failed to fetch note');
    }

    const notes = await noteResponse.json();
    if (!notes || notes.length === 0) {
        throw new Error('Note not found');
    }

    const note = notes[0];

    // Find related trades based on content analysis
    const relatedTrades = trades.filter(trade => {
        const tradeId = trade.id || trade.position_id;
        return note.text?.toLowerCase().includes(tradeId?.toLowerCase()) ||
               note.text?.toLowerCase().includes(trade.symbol?.toLowerCase());
    });

    // Update note with trading data
    const updatedTradingData = {
        ...note.trading_data,
        relatedTrades: relatedTrades.map(t => t.id || t.position_id),
        lastSync: new Date().toISOString(),
        syncStats: {
            totalTrades: relatedTrades.length,
            avgPnl: relatedTrades.length > 0 
                ? relatedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / relatedTrades.length 
                : 0
        }
    };

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/library_notes?id=eq.${noteId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            trading_data: updatedTradingData,
            updated_at: new Date().toISOString()
        })
    });

    if (!updateResponse.ok) {
        throw new Error('Failed to update note with trading data');
    }

    return {
        noteId,
        relatedTrades: relatedTrades.length,
        syncCompleted: true,
        updatedData: updatedTradingData
    };
}