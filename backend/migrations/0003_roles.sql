-- Migration: Add roles table
CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    name TEXT NOT NULL,
    permissions TEXT NOT NULL, -- JSON string or bitmask
    color TEXT,
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id)
);

-- Add role_id to members if not already handled correctly (it is in schema but let's ensure)
-- In SQLite we can't easily add foreign keys to existing tables without recreation
-- but we can just use it as a reference.
