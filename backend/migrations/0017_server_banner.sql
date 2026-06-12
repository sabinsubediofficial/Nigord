-- Migration: Server Banner
-- Add banner column to servers table
ALTER TABLE servers ADD COLUMN banner TEXT;
