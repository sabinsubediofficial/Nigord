-- Migration: Performance Indices
-- Create indexes for performance-critical columns to optimize polling and reduce D1 Read Units

CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_channel_created ON direct_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_members_server ON members(server_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_channel ON voice_sessions(channel_id);
CREATE INDEX IF NOT EXISTS idx_voice_user ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_to ON signals(to_id);
CREATE INDEX IF NOT EXISTS idx_friends_user2 ON friends(user2_id);
CREATE INDEX IF NOT EXISTS idx_dc_user1 ON direct_channels(user1_id);
CREATE INDEX IF NOT EXISTS idx_dc_user2 ON direct_channels(user2_id);
CREATE INDEX IF NOT EXISTS idx_channel_reads_user ON channel_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_reads_user ON dm_reads(user_id);
