-- Migration: Notifications and Read States
CREATE TABLE channel_reads (
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, channel_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channel_id) REFERENCES channels(id)
);
