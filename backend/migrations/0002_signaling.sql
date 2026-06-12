-- Migration: Add signaling table
CREATE TABLE signals (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate'
    data TEXT NOT NULL, -- JSON string of the signal
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_id) REFERENCES users(id),
    FOREIGN KEY (to_id) REFERENCES users(id)
);

-- Migration: Add voice_sessions table
CREATE TABLE voice_sessions (
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, channel_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channel_id) REFERENCES channels(id)
);
