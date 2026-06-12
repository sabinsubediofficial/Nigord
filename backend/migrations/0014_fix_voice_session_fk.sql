-- Rebuild voice_sessions table to remove the foreign key constraint on channel_id,
-- allowing both server channels and direct message channels.

CREATE TABLE voice_sessions_new (
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_muted BOOLEAN DEFAULT 0,
    is_deafened BOOLEAN DEFAULT 0,
    last_active_at DATETIME,
    PRIMARY KEY (user_id, channel_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO voice_sessions_new (user_id, channel_id, joined_at, is_muted, is_deafened, last_active_at)
SELECT user_id, channel_id, joined_at, is_muted, is_deafened, last_active_at FROM voice_sessions;

DROP TABLE voice_sessions;

ALTER TABLE voice_sessions_new RENAME TO voice_sessions;
