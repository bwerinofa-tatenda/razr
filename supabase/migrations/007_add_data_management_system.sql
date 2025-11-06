-- Data Management & Storage System Migration
-- This migration adds comprehensive data management features including backup, encryption, sync, and optimization

-- Create backup_history table for tracking all backups
CREATE TABLE library_backup_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    backup_type VARCHAR(20) NOT NULL, -- 'full', 'incremental', 'differential'
    backup_format VARCHAR(20) NOT NULL, -- 'json', 'encrypted', 'compressed'
    backup_size_bytes BIGINT,
    notes_count INTEGER,
    templates_count INTEGER,
    files_included TEXT[], -- ['notes', 'templates', 'attachments', 'metadata']
    compression_ratio DECIMAL(5,2),
    encryption_enabled BOOLEAN DEFAULT false,
    cloud_storage_url TEXT,
    local_file_path TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Create encrypted_content table for sensitive note data
CREATE TABLE library_encrypted_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID NOT NULL,
    user_id UUID NOT NULL,
    encrypted_content TEXT NOT NULL, -- Base64 encoded encrypted content
    encryption_method VARCHAR(50) DEFAULT 'AES-256-GCM',
    key_derivation_method VARCHAR(50) DEFAULT 'PBKDF2',
    salt BYTEA, -- For key derivation
    iv BYTEA, -- Initialization vector
    encryption_metadata JSONB DEFAULT '{}', -- Additional encryption metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(note_id)
);

-- Create sync_queue table for real-time synchronization
CREATE TABLE library_sync_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    operation_type VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete', 'restore'
    entity_type VARCHAR(20) NOT NULL, -- 'note', 'template', 'folder', 'tag'
    entity_id UUID NOT NULL,
    operation_data JSONB NOT NULL,
    priority INTEGER DEFAULT 5, -- 1-10, higher = more important
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    device_id VARCHAR(100), -- For device-specific sync
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create data_migrations table for tracking data format changes
CREATE TABLE library_data_migrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    migration_type VARCHAR(50) NOT NULL, -- 'format_conversion', 'schema_update', 'data_cleanup'
    source_version VARCHAR(20) NOT NULL,
    target_version VARCHAR(20) NOT NULL,
    migration_data JSONB NOT NULL, -- Data involved in migration
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'rolled_back'
    backup_created BOOLEAN DEFAULT false,
    rollback_data JSONB, -- Data needed to rollback if migration fails
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create storage_optimization table for tracking storage usage and optimization
CREATE TABLE library_storage_optimization (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    total_storage_bytes BIGINT,
    used_storage_bytes BIGINT,
    optimization_type VARCHAR(30), -- 'compression', 'deduplication', 'cleanup', 'archival'
    files_processed INTEGER,
    bytes_saved BIGINT,
    optimization_ratio DECIMAL(5,2),
    optimization_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create import_sessions table for tracking import operations
CREATE TABLE library_import_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    import_type VARCHAR(30) NOT NULL, -- 'csv', 'pdf', 'docx', 'evernote', 'notion', 'onenote'
    source_format VARCHAR(20) NOT NULL,
    target_format VARCHAR(20) NOT NULL,
    total_items INTEGER,
    processed_items INTEGER DEFAULT 0,
    successful_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    file_size_bytes BIGINT,
    source_file_path TEXT,
    validation_errors JSONB DEFAULT '[]',
    import_mapping JSONB DEFAULT '{}', -- Field mapping configuration
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'validating', 'importing', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create data_validation_logs table for tracking validation results
CREATE TABLE library_data_validation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- 'note', 'template', 'import', 'backup'
    entity_id UUID,
    validation_type VARCHAR(30) NOT NULL, -- 'integrity', 'format', 'content', 'security'
    validation_result VARCHAR(20) NOT NULL, -- 'pass', 'warning', 'fail'
    validation_score DECIMAL(3,2), -- 0.0 to 1.0
    issues_found JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data_audit_trail table for comprehensive change tracking
CREATE TABLE library_data_audit_trail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'create', 'read', 'update', 'delete', 'export', 'import', 'backup', 'restore'
    operation_data JSONB,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    device_id VARCHAR(100),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_library_backup_history_user_id ON library_backup_history(user_id);
CREATE INDEX idx_library_backup_history_status ON library_backup_history(status);
CREATE INDEX idx_library_backup_history_created_at ON library_backup_history(created_at);

CREATE INDEX idx_library_encrypted_content_user_id ON library_encrypted_content(user_id);
CREATE INDEX idx_library_encrypted_content_note_id ON library_encrypted_content(note_id);

CREATE INDEX idx_library_sync_queue_user_id ON library_sync_queue(user_id);
CREATE INDEX idx_library_sync_queue_status ON library_sync_queue(status);
CREATE INDEX idx_library_sync_queue_priority ON library_sync_queue(priority DESC);
CREATE INDEX idx_library_sync_queue_created_at ON library_sync_queue(created_at);

CREATE INDEX idx_library_data_migrations_user_id ON library_data_migrations(user_id);
CREATE INDEX idx_library_data_migrations_status ON library_data_migrations(status);
CREATE INDEX idx_library_data_migrations_type ON library_data_migrations(migration_type);

CREATE INDEX idx_library_storage_optimization_user_id ON library_storage_optimization(user_id);
CREATE INDEX idx_library_storage_optimization_created_at ON library_storage_optimization(created_at);

CREATE INDEX idx_library_import_sessions_user_id ON library_import_sessions(user_id);
CREATE INDEX idx_library_import_sessions_status ON library_import_sessions(status);
CREATE INDEX idx_library_import_sessions_type ON library_import_sessions(import_type);

CREATE INDEX idx_library_data_validation_logs_user_id ON library_data_validation_logs(user_id);
CREATE INDEX idx_library_data_validation_logs_entity_type ON library_data_validation_logs(entity_type);
CREATE INDEX idx_library_data_validation_logs_result ON library_data_validation_logs(validation_result);

CREATE INDEX idx_library_data_audit_trail_user_id ON library_data_audit_trail(user_id);
CREATE INDEX idx_library_data_audit_trail_entity_type ON library_data_audit_trail(entity_type);
CREATE INDEX idx_library_data_audit_trail_operation ON library_data_audit_trail(operation);
CREATE INDEX idx_library_data_audit_trail_created_at ON library_data_audit_trail(created_at);

-- Add updated_at triggers
CREATE TRIGGER update_library_encrypted_content_updated_at 
    BEFORE UPDATE ON library_encrypted_content 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE library_backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_encrypted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_data_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_storage_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_data_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_data_audit_trail ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for library_backup_history
CREATE POLICY "Users can manage their own backups" ON library_backup_history
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for library_encrypted_content
CREATE POLICY "Users can manage encrypted content for their notes" ON library_encrypted_content
    FOR ALL USING (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM library_notes WHERE id = note_id AND user_id = auth.uid())
    );

-- Create RLS policies for library_sync_queue
CREATE POLICY "Users can manage their sync queue" ON library_sync_queue
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for library_data_migrations
CREATE POLICY "Users can manage their data migrations" ON library_data_migrations
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for library_storage_optimization
CREATE POLICY "Users can view their storage optimization data" ON library_storage_optimization
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for library_import_sessions
CREATE POLICY "Users can manage their import sessions" ON library_import_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for library_data_validation_logs
CREATE POLICY "Users can view their validation logs" ON library_data_validation_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for library_data_audit_trail
CREATE POLICY "Users can view their audit trail" ON library_data_audit_trail
    FOR SELECT USING (auth.uid() = user_id);

-- Create functions for data management operations
CREATE OR REPLACE FUNCTION create_backup(
    user_uuid UUID,
    backup_type_text VARCHAR(20),
    include_data TEXT[]
) RETURNS UUID AS $$
DECLARE
    backup_uuid UUID;
    notes_count INTEGER;
    templates_count INTEGER;
BEGIN
    -- Count items to be included
    SELECT COUNT(*) INTO notes_count 
    FROM library_notes 
    WHERE user_id = user_uuid;
    
    SELECT COUNT(*) INTO templates_count 
    FROM library_templates 
    WHERE user_id = user_uuid;
    
    -- Create backup record
    INSERT INTO library_backup_history (
        user_id, backup_type, backup_format, notes_count, templates_count, 
        files_included, status
    ) VALUES (
        user_uuid, backup_type_text, 'json', notes_count, templates_count, 
        include_data, 'pending'
    ) RETURNING id INTO backup_uuid;
    
    RETURN backup_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function for data validation
CREATE OR REPLACE FUNCTION validate_note_integrity(
    note_uuid UUID,
    user_uuid UUID
) RETURNS JSONB AS $$
DECLARE
    validation_result JSONB;
    note_data RECORD;
    issues JSONB := '[]'::JSONB;
BEGIN
    -- Get note data
    SELECT * INTO note_data FROM library_notes 
    WHERE id = note_uuid AND user_id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Note not found');
    END IF;
    
    -- Check required fields
    IF note_data.title IS NULL OR trim(note_data.title) = '' THEN
        issues := issues || jsonb_build_array('Missing title');
    END IF;
    
    IF note_data.text IS NULL THEN
        issues := issues || jsonb_build_array('Missing content');
    END IF;
    
    -- Check content length
    IF length(note_data.text) > 1000000 THEN
        issues := issues || jsonb_build_array('Content too long (>1MB)');
    END IF;
    
    -- Check encoding
    IF note_data.text !~ '^[\x20-\x7E\n\r\t]*$' THEN
        issues := issues || jsonb_build_array('Invalid character encoding');
    END IF;
    
    -- Create validation result
    validation_result := jsonb_build_object(
        'valid', jsonb_array_length(issues) = 0,
        'score', CASE WHEN jsonb_array_length(issues) = 0 THEN 1.0 
                     WHEN jsonb_array_length(issues) = 1 THEN 0.8 
                     ELSE 0.5 END,
        'issues', issues,
        'note_id', note_uuid,
        'validated_at', NOW()
    );
    
    -- Log validation result
    INSERT INTO library_data_validation_logs (
        user_id, entity_type, entity_id, validation_type, 
        validation_result, validation_score, issues_found
    ) VALUES (
        user_uuid, 'note', note_uuid, 'integrity',
        CASE WHEN jsonb_array_length(issues) = 0 THEN 'pass' ELSE 'warning' END,
        CASE WHEN jsonb_array_length(issues) = 0 THEN 1.0 
             WHEN jsonb_array_length(issues) = 1 THEN 0.8 
             ELSE 0.5 END,
        issues
    );
    
    RETURN validation_result;
END;
$$ LANGUAGE plpgsql;

-- Function for storage optimization analysis
CREATE OR REPLACE FUNCTION analyze_storage_usage(
    user_uuid UUID
) RETURNS JSONB AS $$
DECLARE
    analysis_result JSONB;
    total_notes INTEGER;
    total_size BIGINT;
    avg_note_size DECIMAL;
    largest_notes JSONB;
    storage_by_type JSONB;
BEGIN
    -- Calculate basic storage metrics
    SELECT 
        COUNT(*),
        COALESCE(SUM(length(text)), 0) + COALESCE(SUM(length(title)), 0),
        COALESCE(AVG(length(text) + length(title)), 0)
    INTO total_notes, total_size, avg_note_size
    FROM library_notes 
    WHERE user_id = user_uuid;
    
    -- Get largest notes
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'size_bytes', length(text) + length(title),
            'created_at', created_at
        )
    ) INTO largest_notes
    FROM (
        SELECT id, title, text, created_at,
               length(text) + length(title) as size_bytes
        FROM library_notes 
        WHERE user_id = user_uuid
        ORDER BY size_bytes DESC
        LIMIT 10
    ) largest;
    
    -- Storage by type analysis
    SELECT jsonb_object_agg(content_type, data) INTO storage_by_type
    FROM (
        SELECT 
            content_type,
            jsonb_build_object(
                'count', COUNT(*),
                'total_size', SUM(length(text) + length(title)),
                'avg_size', AVG(length(text) + length(title))
            ) as data
        FROM library_notes 
        WHERE user_id = user_uuid
        GROUP BY content_type
    ) type_analysis;
    
    analysis_result := jsonb_build_object(
        'total_notes', total_notes,
        'total_size_bytes', total_size,
        'avg_note_size_bytes', ROUND(avg_note_size),
        'storage_efficiency', CASE 
            WHEN total_size > 0 THEN ROUND((total_notes::DECIMAL / total_size * 1000), 2)
            ELSE 0 
        END,
        'largest_notes', largest_notes,
        'storage_by_type', storage_by_type,
        'recommendations', jsonb_build_array(
            'Consider compressing large notes',
            'Archive old notes to improve performance',
            'Use templates for repetitive content'
        ),
        'analyzed_at', NOW()
    );
    
    RETURN analysis_result;
END;
$$ LANGUAGE plpgsql;

-- Function for sync operation queuing
CREATE OR REPLACE FUNCTION queue_sync_operation(
    user_uuid UUID,
    operation_type_text VARCHAR(20),
    entity_type_text VARCHAR(20),
    entity_uuid UUID,
    operation_data_json JSONB,
    priority_int INTEGER DEFAULT 5
) RETURNS UUID AS $$
DECLARE
    queue_uuid UUID;
BEGIN
    INSERT INTO library_sync_queue (
        user_id, operation_type, entity_type, entity_id, 
        operation_data, priority, status
    ) VALUES (
        user_uuid, operation_type_text, entity_type_text, 
        entity_uuid, operation_data_json, priority_int, 'pending'
    ) RETURNING id INTO queue_uuid;
    
    -- Log the operation in audit trail
    INSERT INTO library_data_audit_trail (
        user_id, entity_type, entity_id, operation, operation_data
    ) VALUES (
        user_uuid, entity_type_text, entity_uuid, 
        'sync_queue', operation_data_json
    );
    
    RETURN queue_uuid;
END;
$$ LANGUAGE plpgsql;