-- Migration: Add claude_api_key to profiles for BYOK (Bring Your Own Key)
-- Existing profiles (Arnaud, Naïdie) will have NULL = use server key
-- New profiles must provide their own key

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS claude_api_key TEXT;
