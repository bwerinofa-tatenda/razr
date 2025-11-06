# TradeJournal AI - Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the TradeJournal AI application with a fully configured Supabase backend for the Library/Notes section.

## Prerequisites
- Node.js 18+ and pnpm
- Supabase account
- Git repository

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 1.2 Database Schema Setup
Run the following SQL migrations in your Supabase SQL editor:

```sql
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

-- Create function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE library_templates 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE 
        id = template_id AND 
        (user_id = increment_template_usage.user_id OR user_id IS NULL);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

### 1.3 Edge Function Deployment
Deploy the library-data-manager edge function:

```bash
# Using the batch_deploy_edge_functions tool
# (Run this from the project root)
```

Note: You'll need to manually deploy the edge function using the provided file `supabase/functions/library-data-manager/index.ts`.

## Step 2: Environment Configuration

### 2.1 Create Environment File
Create a `.env` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Google Maps API Key (if using mapping features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 2.2 Update Supabase Client Configuration
Edit `src/lib/libraryService.ts` and replace the placeholder values:

```typescript
// Replace these lines with your actual credentials:
const supabaseUrl = "your_actual_supabase_url_here";
const supabaseAnonKey = "your_actual_supabase_anon_key_here";
```

## Step 3: Application Configuration

### 3.1 Update Library Component
Replace the import in `src/App.tsx` to use the production version:

```typescript
// Change this line:
import Library from './pages/Library';

// To this:
import Library from './pages/LibraryProduction';
```

### 3.2 Install Dependencies
```bash
pnpm install
```

### 3.3 Build for Production
```bash
pnpm run build
```

## Step 4: Deployment Options

### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables in Vercel dashboard
4. Deploy

### Option 2: Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `pnpm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy

### Option 3: Self-hosted
1. Build the application: `pnpm run build`
2. Copy `dist` folder to your web server
3. Configure your web server to serve the application

## Step 5: Data Migration (Optional)

### 5.1 Migrate from LocalStorage
If users have existing data in localStorage, provide a migration option:

1. Access the Library section
2. Click "Migrate Data" button (appears when data exists in localStorage)
3. Data will be automatically migrated to Supabase

## Step 6: Testing

### 6.1 Functional Testing
- [ ] User registration/login works
- [ ] Create/edit/delete notes works
- [ ] Folder and tag management works
- [ ] Template system works
- [ ] Trading data integration works
- [ ] Real-time sync works across sessions

### 6.2 Performance Testing
- [ ] Page load times under 3 seconds
- [ ] Note operations respond under 1 second
- [ ] Search functionality works smoothly
- [ ] Large datasets load efficiently

### 6.3 Security Testing
- [ ] User data is properly isolated
- [ ] Authentication required for all operations
- [ ] No data leakage between users
- [ ] Proper input validation

## Step 7: Monitoring and Maintenance

### 7.1 Setup Monitoring
- Monitor Supabase usage and costs
- Set up error tracking (e.g., Sentry)
- Monitor application performance
- Track user engagement

### 7.2 Backup Strategy
- Supabase provides automatic backups
- Consider additional backup strategies for critical data
- Test restoration procedures

### 7.3 Updates and Maintenance
- Regular dependency updates
- Security patches
- Feature updates based on user feedback
- Database schema updates (if needed)

## Troubleshooting

### Common Issues

1. **CKEditor License Warning**
   - Solution: The application is configured to use GPL license
   - For commercial use, obtain a commercial CKEditor license

2. **Supabase Connection Errors**
   - Verify environment variables are correctly set
   - Check Supabase project status
   - Verify RLS policies are correctly configured

3. **Authentication Issues**
   - Ensure Supabase auth is properly configured
   - Check authentication settings in Supabase dashboard

4. **Data Migration Failures**
   - Check browser console for error messages
   - Verify user has proper permissions
   - Ensure enough storage space in Supabase

### Getting Help
- Check Supabase documentation: https://supabase.com/docs
- Review application logs for specific errors
- Test with minimal data to isolate issues

## Production Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Edge functions deployed
- [ ] Environment variables configured
- [ ] Application built successfully
- [ ] Deployed to production environment
- [ ] SSL certificates configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Security testing completed
- [ ] Performance testing completed
- [ ] User acceptance testing completed

## Next Steps

After successful deployment:

1. **User Onboarding**: Create user guides and tutorials
2. **Feature Enhancements**: Based on user feedback
3. **Performance Optimization**: Continuous monitoring and improvements
4. **Mobile Optimization**: Consider mobile app development
5. **Advanced Features**: AI-powered suggestions, collaboration features, etc.

---

**Deployment Support**: For technical assistance with deployment, please refer to the application logs and error messages. The codebase is well-documented with comprehensive error handling and logging.

**Production Readiness**: Once deployed following this guide, the TradeJournal AI Library section will be fully production-ready with:
- Robust data persistence via Supabase
- Real-time synchronization
- Professional-grade user interface
- Comprehensive error handling
- Security best practices
- Performance optimizations