-- Migration: User Profile and Status fields
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN status_message TEXT;
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'online'; -- 'online', 'idle', 'dnd', 'invisible'
