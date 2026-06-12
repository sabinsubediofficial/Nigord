-- Migration: Add recovery_code_hash column to users table
ALTER TABLE users ADD COLUMN recovery_code_hash TEXT;
