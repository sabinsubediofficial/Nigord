-- Migration: Add email verification columns
ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_code TEXT;
