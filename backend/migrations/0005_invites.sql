-- Migration: Server Invites
CREATE TABLE invites (
    code TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    inviter_id TEXT NOT NULL,
    max_uses INTEGER DEFAULT 0,
    uses INTEGER DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id),
    FOREIGN KEY (inviter_id) REFERENCES users(id)
);
