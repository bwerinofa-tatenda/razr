-- Advanced Library Features Migration
-- This migration adds versioning, collaboration, smart suggestions, and advanced features

-- Create note_versions table for detailed version tracking
CREATE TABLE library_note_versions (
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
CREATE TABLE library_collaborations (
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
CREATE TABLE library_comments (
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
CREATE TABLE library_note_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_note_id UUID NOT NULL,
    target_note_id UUID NOT NULL,
    link_type VARCHAR(50) DEFAULT 'reference', -- 'reference', 'citation', 'trades', 'pattern'
    context_data JSONB DEFAULT '{}', -- Additional context for the link
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_note_id, target_note_id, link_type)
);

-- Create library_smart_tags table for automated tagging
CREATE TABLE library_smart_tags (
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
CREATE TABLE library_suggestions (
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
CREATE TABLE library_reminders (
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
CREATE TABLE library_voice_notes (
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
CREATE TABLE library_exports (
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

-- Add indexes for performance
CREATE INDEX idx_library_note_versions_note_id ON library_note_versions(note_id);
CREATE INDEX idx_library_note_versions_user_id ON library_note_versions(user_id);
CREATE INDEX idx_library_note_versions_created_at ON library_note_versions(created_at);

CREATE INDEX idx_library_collaborations_note_id ON library_collaborations(note_id);
CREATE INDEX idx_library_collaborations_owner_id ON library_collaborations(owner_id);
CREATE INDEX idx_library_collaborations_shared_with_id ON library_collaborations(shared_with_id);

CREATE INDEX idx_library_comments_note_id ON library_comments(note_id);
CREATE INDEX idx_library_comments_collaboration_id ON library_comments(collaboration_id);
CREATE INDEX idx_library_comments_author_id ON library_comments(author_id);

CREATE INDEX idx_library_note_links_source_note_id ON library_note_links(source_note_id);
CREATE INDEX idx_library_note_links_target_note_id ON library_note_links(target_note_id);

CREATE INDEX idx_library_smart_tags_note_id ON library_smart_tags(note_id);
CREATE INDEX idx_library_smart_tags_tag_name ON library_smart_tags(tag_name);

CREATE INDEX idx_library_suggestions_user_id ON library_suggestions(user_id);
CREATE INDEX idx_library_suggestions_status ON library_suggestions(status);

CREATE INDEX idx_library_reminders_user_id ON library_reminders(user_id);
CREATE INDEX idx_library_reminders_reminder_date ON library_reminders(reminder_date);
CREATE INDEX idx_library_reminders_status ON library_reminders(is_completed);

CREATE INDEX idx_library_voice_notes_note_id ON library_voice_notes(note_id);
CREATE INDEX idx_library_voice_notes_user_id ON library_voice_notes(user_id);

CREATE INDEX idx_library_exports_user_id ON library_exports(user_id);
CREATE INDEX idx_library_exports_status ON library_exports(status);

-- Add updated_at triggers
CREATE TRIGGER update_library_collaborations_updated_at 
    BEFORE UPDATE ON library_collaborations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_comments_updated_at 
    BEFORE UPDATE ON library_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create RLS policies for library_note_versions
CREATE POLICY "Users can view versions of their own notes" ON library_note_versions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM library_notes WHERE id = note_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create versions of their own notes" ON library_note_versions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM library_notes WHERE id = note_id AND user_id = auth.uid())
    );

-- Create RLS policies for library_collaborations
CREATE POLICY "Users can manage collaborations for their notes" ON library_collaborations
    FOR ALL USING (
        auth.uid() = owner_id OR 
        (auth.uid() = shared_with_id AND status = 'active')
    );

-- Create RLS policies for library_comments
CREATE POLICY "Users can manage comments on accessible notes" ON library_comments
    FOR ALL USING (
        auth.uid() = author_id OR 
        EXISTS (
            SELECT 1 FROM library_notes 
            WHERE id = note_id AND user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM library_collaborations 
            WHERE id = collaboration_id AND shared_with_id = auth.uid() AND status = 'active'
        )
    );

-- Create RLS policies for library_note_links
CREATE POLICY "Users can manage links on their notes" ON library_note_links
    FOR ALL USING (
        EXISTS (SELECT 1 FROM library_notes WHERE id = source_note_id AND user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM library_notes WHERE id = target_note_id AND user_id = auth.uid())
    );

-- Create RLS policies for library_smart_tags
CREATE POLICY "Users can manage tags on their notes" ON library_smart_tags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM library_notes WHERE id = note_id AND user_id = auth.uid())
    );

-- Create RLS policies for library_suggestions
CREATE POLICY "Users can manage their own suggestions" ON library_suggestions
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for library_reminders
CREATE POLICY "Users can manage their own reminders" ON library_reminders
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for library_voice_notes
CREATE POLICY "Users can manage voice notes for their notes" ON library_voice_notes
    FOR ALL USING (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM library_notes WHERE id = note_id AND user_id = auth.uid())
    );

-- Create RLS policies for library_exports
CREATE POLICY "Users can manage their own exports" ON library_exports
    FOR ALL USING (auth.uid() = user_id);

-- Create functions for advanced features
CREATE OR REPLACE FUNCTION create_note_version(
    note_uuid UUID,
    user_uuid UUID,
    content_text TEXT,
    content_data_json JSONB DEFAULT '{}',
    metadata_json JSONB DEFAULT '{}',
    change_summary_text TEXT DEFAULT NULL,
    change_type_text TEXT DEFAULT 'edit'
) RETURNS UUID AS $$
DECLARE
    version_num INTEGER;
    version_uuid UUID;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO version_num
    FROM library_note_versions 
    WHERE note_id = note_uuid;
    
    -- Insert the version
    INSERT INTO library_note_versions (
        note_id, user_id, version_number, content_snapshot, 
        content_data_snapshot, metadata_snapshot, 
        change_summary, change_type
    ) VALUES (
        note_uuid, user_uuid, version_num, content_text,
        content_data_json, metadata_json,
        change_summary_text, change_type_text
    ) RETURNING id INTO version_uuid;
    
    RETURN version_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function for auto-tagging based on content analysis
CREATE OR REPLACE FUNCTION auto_generate_tags(
    note_uuid UUID,
    content_text TEXT,
    current_tags TEXT[]
) RETURNS TEXT[] AS $$
DECLARE
    suggested_tags TEXT[] := ARRAY[]::TEXT[];
    keyword TEXT;
BEGIN
    -- Extract keywords and generate tags based on content
    -- This is a simplified version - in production, you'd use more sophisticated NLP
    -- Trading-related keywords
    IF content_text ILIKE '%trading%' OR content_text ILIKE '%trade%' THEN
        suggested_tags := array_append(suggested_tags, 'trading');
    END IF;
    
    IF content_text ILIKE '%analysis%' THEN
        suggested_tags := array_append(suggested_tags, 'analysis');
    END IF;
    
    IF content_text ILIKE '%strategy%' THEN
        suggested_tags := array_append(suggested_tags, 'strategy');
    END IF;
    
    IF content_text ILIKE '%psychology%' OR content_text ILIKE '%emotion%' THEN
        suggested_tags := array_append(suggested_tags, 'psychology');
    END IF;
    
    -- Remove duplicates and existing tags
    SELECT DISTINCT unnest(suggested_tags) 
    FROM unnest(suggested_tags)
    WHERE unnest IS NOT NULL
    AND unnest NOT IN (SELECT unnest(current_tags));
    
    RETURN suggested_tags;
END;
$$ LANGUAGE plpgsql;

-- Function for link detection between notes
CREATE OR REPLACE FUNCTION detect_note_links(
    content_text TEXT,
    user_uuid UUID
) RETURNS TABLE(note_id UUID, suggested_link_type VARCHAR(50)) AS $$
BEGIN
    -- This function would analyze content and suggest links
    -- For now, it's a placeholder that could be enhanced with NLP
    RETURN QUERY
    SELECT n.id, 'reference'::VARCHAR(50)
    FROM library_notes n
    WHERE n.user_id = user_uuid
    AND n.text ILIKE '%' || SUBSTRING(content_text, 1, 50) || '%'
    AND n.text != content_text
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;
