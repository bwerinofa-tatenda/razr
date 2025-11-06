-- TradeJournal AI Library Database Schema
-- This migration creates the database tables for the Library/Notes section

-- Create library_folders table for folder management
CREATE TABLE library_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'folder', -- 'folder' or 'tag'
    parent_id UUID,
    sort_order INTEGER DEFAULT 0,
    expanded BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create library_notes table for notes with rich content support
CREATE TABLE library_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(500),
    text TEXT,
    content_type VARCHAR(50) NOT NULL DEFAULT 'plain-text',
    category VARCHAR(100),
    tab VARCHAR(50),
    folder_id UUID, -- Foreign key to library_folders
    trading_data JSONB DEFAULT '{}', -- Trading-related metadata
    content_data JSONB DEFAULT '{}', -- Rich content data (HTML, code, etc.)
    metadata JSONB DEFAULT '{}', -- Word count, tags, etc.
    versions JSONB DEFAULT '[]', -- Version history
    current_version VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create library_templates table for template management
CREATE TABLE library_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- NULL for system templates
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'custom',
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]',
    is_favorite BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_system BOOLEAN DEFAULT false -- True for built-in templates
);

-- Create library_relationships table for note relationships/connections
CREATE TABLE library_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    source_note_id UUID NOT NULL,
    target_note_id UUID NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'related',
    strength DECIMAL(3,2) DEFAULT 0.5, -- Relationship strength 0.0-1.0
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, source_note_id, target_note_id)
);

-- Create indexes for performance
CREATE INDEX idx_library_folders_user_id ON library_folders(user_id);
CREATE INDEX idx_library_folders_parent_id ON library_folders(parent_id);
CREATE INDEX idx_library_folders_type ON library_folders(type);
CREATE INDEX idx_library_notes_user_id ON library_notes(user_id);
CREATE INDEX idx_library_notes_tab ON library_notes(tab);
CREATE INDEX idx_library_notes_category ON library_notes(category);
CREATE INDEX idx_library_notes_folder_id ON library_notes(folder_id);
CREATE INDEX idx_library_notes_created_at ON library_notes(created_at);
CREATE INDEX idx_library_notes_updated_at ON library_notes(updated_at);
CREATE INDEX idx_library_templates_user_id ON library_templates(user_id);
CREATE INDEX idx_library_templates_category ON library_templates(category);
CREATE INDEX idx_library_templates_is_favorite ON library_templates(is_favorite);
CREATE INDEX idx_library_relationships_user_id ON library_relationships(user_id);
CREATE INDEX idx_library_relationships_source ON library_relationships(source_note_id);
CREATE INDEX idx_library_relationships_target ON library_relationships(target_note_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_library_folders_updated_at 
    BEFORE UPDATE ON library_folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_notes_updated_at 
    BEFORE UPDATE ON library_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_templates_updated_at 
    BEFORE UPDATE ON library_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE library_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_relationships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for library_folders
CREATE POLICY "Users can view their own folders" ON library_folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON library_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON library_folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON library_folders
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for library_notes
CREATE POLICY "Users can view their own notes" ON library_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON library_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON library_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON library_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for library_templates
CREATE POLICY "Users can view system and their own templates" ON library_templates
    FOR SELECT USING (
        is_system = true OR 
        auth.uid() = user_id OR 
        (user_id IS NULL AND is_system = true)
    );

CREATE POLICY "Users can insert their own templates" ON library_templates
    FOR INSERT WITH CHECK (
        (user_id IS NULL AND is_system = true) OR 
        auth.uid() = user_id
    );

CREATE POLICY "Users can update their own templates" ON library_templates
    FOR UPDATE USING (
        is_system = false AND auth.uid() = user_id OR 
        is_system = true AND user_id IS NULL
    );

CREATE POLICY "Users can delete their own templates" ON library_templates
    FOR DELETE USING (
        is_system = false AND auth.uid() = user_id
    );

-- Create RLS policies for library_relationships
CREATE POLICY "Users can manage their own relationships" ON library_relationships
    FOR ALL USING (auth.uid() = user_id);