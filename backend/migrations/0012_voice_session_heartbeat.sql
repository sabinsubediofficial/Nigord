-- Migration: Add last_active_at to voice_sessions
ALTER TABLE voice_sessions ADD COLUMN last_active_at DATETIME;
