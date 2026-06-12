-- Migration: Add Mute/Deafen to Voice Sessions
ALTER TABLE voice_sessions ADD COLUMN is_muted BOOLEAN DEFAULT 0;
ALTER TABLE voice_sessions ADD COLUMN is_deafened BOOLEAN DEFAULT 0;
