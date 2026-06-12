-- Migration: Add last_active_at to users
ALTER TABLE users ADD COLUMN last_active_at DATETIME;
