-- Add metadata column to chat_messages table for storing AI context
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata ON chat_messages USING GIN (metadata);

-- Add comment
COMMENT ON COLUMN chat_messages.metadata IS 'Stores AI context including used notes, knowledge base status, and chat mode';
