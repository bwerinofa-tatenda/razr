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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Apply the migration using the REST API
        const migrationSQL = `
        -- Advanced Library Features Migration
        -- This migration adds versioning, collaboration, smart suggestions, and advanced features

        -- Create note_versions table for detailed version tracking
        CREATE TABLE IF NOT EXISTS library_note_versions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            note_id UUID NOT NULL,
            user_id UUID NOT NULL,
            version_number INTEGER NOT NULL,
            content_snapshot TEXT NOT NULL,
            content_data_snapshot JSONB DEFAULT '{}',
            metadata_snapshot JSONB DEFAULT '{}',
            change_summary TEXT,
            change_type VARCHAR(50) DEFAULT 'edit', -- 'create', 'edit', 'delete', 'restore'
            is_auto_save BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(note_id, version_number)
        );

        -- Create library_collaborations table for note sharing and collaboration
        CREATE TABLE IF NOT EXISTS library_collaborations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            note_id UUID NOT NULL,
            owner_id UUID NOT NULL,
            shared_with_id UUID NOT NULL,
            permission_level VARCHAR(20) DEFAULT 'read', -- 'read', 'comment', 'edit'
            status VARCHAR(20) DEFAULT 'active', -- 'active', 'revoked', 'expired'
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create library_comments table for collaborative annotations
        CREATE TABLE IF NOT EXISTS library_comments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            note_id UUID NOT NULL,
            collaboration_id UUID, -- Links to library_collaborations if from shared note
            author_id UUID NOT NULL,
            content TEXT NOT NULL,
            position_data JSONB DEFAULT '{}', -- For text selection positions
            is_resolved BOOLEAN DEFAULT false,
            parent_comment_id UUID, -- For comment threads
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create library_note_links table for cross-references
        CREATE TABLE IF NOT EXISTS library_note_links (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            source_note_id UUID NOT NULL,
            target_note_id UUID NOT NULL,
            link_type VARCHAR(50) DEFAULT 'reference', -- 'reference', 'citation', 'trades', 'pattern'
            context_data JSONB DEFAULT '{}', -- Additional context for the link
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(source_note_id, target_note_id, link_type)
        );

        -- Create library_smart_tags table for automated tagging
        CREATE TABLE IF NOT EXISTS library_smart_tags (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            note_id UUID NOT NULL,
            tag_name VARCHAR(100) NOT NULL,
            tag_type VARCHAR(50) DEFAULT 'auto', -- 'auto', 'user', 'ai'
            confidence_score DECIMAL(3,2) DEFAULT 0.5,
            auto_generated BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(note_id, tag_name)
        );

        -- Create library_suggestions table for smart suggestions
        CREATE TABLE IF NOT EXISTS library_suggestions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            note_id UUID,
            user_id UUID NOT NULL,
            suggestion_type VARCHAR(50) NOT NULL, -- 'content', 'template', 'tag', 'reference', 'completion'
            suggestion_data JSONB NOT NULL,
            context_data JSONB DEFAULT '{}',
            status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'applied', 'dismissed'
            confidence_score DECIMAL(3,2) DEFAULT 0.5,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            applied_at TIMESTAMP WITH TIME ZONE
        );

        -- Create library_reminders table for note follow-ups
        CREATE TABLE IF NOT EXISTS library_reminders (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            note_id UUID NOT NULL,
            user_id UUID NOT NULL,
            reminder_type VARCHAR(50) DEFAULT 'followup', -- 'deadline', 'followup', 'review', 'action'
            reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
            message TEXT NOT NULL,
            is_completed BOOLEAN DEFAULT false,
            priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
            repeat_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'none'
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE
        );

        -- Create library_voice_notes table for voice recording support
        CREATE TABLE IF NOT EXISTS library_voice_notes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            note_id UUID NOT NULL,
            user_id UUID NOT NULL,
            audio_url TEXT,
            transcript TEXT,
            duration_seconds INTEGER,
            language_code VARCHAR(10) DEFAULT 'en-US',
            transcription_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
            confidence_score DECIMAL(3,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create library_exports table for export tracking
        CREATE TABLE IF NOT EXISTS library_exports (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            note_id UUID,
            user_id UUID NOT NULL,
            export_type VARCHAR(20) NOT NULL, -- 'pdf', 'docx', 'md', 'html', 'json'
            export_settings JSONB DEFAULT '{}',
            file_url TEXT,
            file_name VARCHAR(255),
            file_size_bytes INTEGER,
            status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE
        );
        `;

        // Apply the migration
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: migrationSQL
            })
        });

        if (!response.ok) {
            // Try alternative approach - execute SQL directly
            const execResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sql: migrationSQL
                })
            });

            if (!execResponse.ok) {
                const errorText = await execResponse.text();
                throw new Error(`Migration failed: ${errorText}`);
            }
        }

        // Create indexes and RLS policies
        const indexesSQL = `
        -- Add indexes for performance
        CREATE INDEX IF NOT EXISTS idx_library_note_versions_note_id ON library_note_versions(note_id);
        CREATE INDEX IF NOT EXISTS idx_library_note_versions_user_id ON library_note_versions(user_id);
        CREATE INDEX IF NOT EXISTS idx_library_note_versions_created_at ON library_note_versions(created_at);

        CREATE INDEX IF NOT EXISTS idx_library_collaborations_note_id ON library_collaborations(note_id);
        CREATE INDEX IF NOT EXISTS idx_library_collaborations_owner_id ON library_collaborations(owner_id);
        CREATE INDEX IF NOT EXISTS idx_library_collaborations_shared_with_id ON library_collaborations(shared_with_id);

        CREATE INDEX IF NOT EXISTS idx_library_comments_note_id ON library_comments(note_id);
        CREATE INDEX IF NOT EXISTS idx_library_comments_collaboration_id ON library_comments(collaboration_id);
        CREATE INDEX IF NOT EXISTS idx_library_comments_author_id ON library_comments(author_id);

        CREATE INDEX IF NOT EXISTS idx_library_note_links_source_note_id ON library_note_links(source_note_id);
        CREATE INDEX IF NOT EXISTS idx_library_note_links_target_note_id ON library_note_links(target_note_id);

        CREATE INDEX IF NOT EXISTS idx_library_smart_tags_note_id ON library_smart_tags(note_id);
        CREATE INDEX IF NOT EXISTS idx_library_smart_tags_tag_name ON library_smart_tags(tag_name);

        CREATE INDEX IF NOT EXISTS idx_library_suggestions_user_id ON library_suggestions(user_id);
        CREATE INDEX IF NOT EXISTS idx_library_suggestions_status ON library_suggestions(status);

        CREATE INDEX IF NOT EXISTS idx_library_reminders_user_id ON library_reminders(user_id);
        CREATE INDEX IF NOT EXISTS idx_library_reminders_reminder_date ON library_reminders(reminder_date);
        CREATE INDEX IF NOT EXISTS idx_library_reminders_status ON library_reminders(is_completed);

        CREATE INDEX IF NOT EXISTS idx_library_voice_notes_note_id ON library_voice_notes(note_id);
        CREATE INDEX IF NOT EXISTS idx_library_voice_notes_user_id ON library_voice_notes(user_id);

        CREATE INDEX IF NOT EXISTS idx_library_exports_user_id ON library_exports(user_id);
        CREATE INDEX IF NOT EXISTS idx_library_exports_status ON library_exports(status);

        -- Enable Row Level Security
        ALTER TABLE library_note_versions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE library_collaborations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE library_comments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE library_note_links ENABLE ROW LEVEL SECURITY;
        ALTER TABLE library_smart_tags ENABLE ROW LEVEL SECURITY;
        ALTER TABLE library_suggestions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE library_reminders ENABLE ROW LEVEL SECURITY;
        ALTER TABLE library_voice_notes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE library_exports ENABLE ROW LEVEL SECURITY;
        `;

        // Apply indexes and RLS
        const indexesResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sql: indexesSQL
            })
        });

        if (!indexesResponse.ok) {
            const errorText = await indexesResponse.text();
            console.warn('Indexes/RLS setup failed:', errorText);
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: 'Advanced Library migration applied successfully',
                timestamp: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Migration error:', error);

        const errorResponse = {
            error: {
                code: 'MIGRATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});