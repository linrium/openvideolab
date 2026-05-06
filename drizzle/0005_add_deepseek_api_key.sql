ALTER TABLE "user_settings"
  ADD COLUMN IF NOT EXISTS "deepseek_api_key" text;
