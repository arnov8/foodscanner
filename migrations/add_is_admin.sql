-- Migration: Add is_admin column to profiles
-- Run this in the Supabase SQL Editor

-- Add the is_admin column (default false for all existing profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Set Arnaud's profile as admin (update the name if needed)
UPDATE profiles SET is_admin = true WHERE name ILIKE '%arnaud%';

-- Verify
SELECT id, name, is_admin FROM profiles;
