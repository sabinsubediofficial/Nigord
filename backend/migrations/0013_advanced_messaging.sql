-- Migration: Advanced Messaging (Pins, Replies, Reactions, Typing)

-- Add Columns to Server Messages
ALTER TABLE messages ADD COLUMN is_pinned INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN reply_to_id TEXT;

-- Add Columns to DM Messages
ALTER TABLE direct_messages ADD COLUMN is_pinned INTEGER DEFAULT 0;
ALTER TABLE direct_messages ADD COLUMN reply_to_id TEXT;

-- Create Reactions Table
CREATE TABLE reactions (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Create Typing Status Table
CREATE TABLE typing_status (
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    last_typed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (channel_id, user_id)
);
