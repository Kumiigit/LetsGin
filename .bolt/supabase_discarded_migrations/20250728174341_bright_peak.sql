/*
  # Add Space Branding and Discord Integration

  1. New Tables
    - `space_assets` - Store space logos and banners
    - `discord_webhooks` - Store Discord webhook configurations
    - `stream_discord_posts` - Track Discord posts for streams

  2. Storage
    - Create space-assets bucket for file uploads

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for space owners and members
*/

-- Create space_assets table for logos and banners
CREATE TABLE IF NOT EXISTS space_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('logo', 'banner')),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(space_id, asset_type)
);

-- Create discord_webhooks table
CREATE TABLE IF NOT EXISTS discord_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  webhook_name text,
  is_active boolean DEFAULT true,
  auto_post_streams boolean DEFAULT true,
  post_timing text DEFAULT 'on_creation' CHECK (post_timing IN ('on_creation', 'before_stream', 'both')),
  minutes_before integer DEFAULT 60,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stream_discord_posts table to track posts
CREATE TABLE IF NOT EXISTS stream_discord_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  webhook_id uuid NOT NULL REFERENCES discord_webhooks(id) ON DELETE CASCADE,
  discord_message_id text,
  post_type text NOT NULL CHECK (post_type IN ('creation', 'reminder')),
  posted_at timestamptz DEFAULT now(),
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_space_assets_space_id ON space_assets(space_id);
CREATE INDEX IF NOT EXISTS idx_space_assets_type ON space_assets(space_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_discord_webhooks_space_id ON discord_webhooks(space_id);
CREATE INDEX IF NOT EXISTS idx_stream_discord_posts_stream_id ON stream_discord_posts(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_discord_posts_webhook_id ON stream_discord_posts(webhook_id);

-- Enable RLS
ALTER TABLE space_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_discord_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for space_assets
CREATE POLICY "Users can view assets for accessible spaces"
  ON space_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces s
      WHERE s.id = space_assets.space_id
      AND (
        s.is_public = true OR
        s.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM space_memberships sm
          WHERE sm.space_id = s.id
          AND sm.user_id = auth.uid()
          AND sm.status = 'approved'
        )
      )
    )
  );

CREATE POLICY "Space owners can manage assets"
  ON space_assets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces s
      WHERE s.id = space_assets.space_id
      AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces s
      WHERE s.id = space_assets.space_id
      AND s.owner_id = auth.uid()
    )
  );

-- RLS Policies for discord_webhooks
CREATE POLICY "Space owners can manage webhooks"
  ON discord_webhooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces s
      WHERE s.id = discord_webhooks.space_id
      AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces s
      WHERE s.id = discord_webhooks.space_id
      AND s.owner_id = auth.uid()
    )
  );

-- RLS Policies for stream_discord_posts
CREATE POLICY "Users can view discord posts for accessible spaces"
  ON stream_discord_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM streams st
      JOIN spaces s ON s.id = st.space_id
      WHERE st.id = stream_discord_posts.stream_id
      AND (
        s.is_public = true OR
        s.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM space_memberships sm
          WHERE sm.space_id = s.id
          AND sm.user_id = auth.uid()
          AND sm.status = 'approved'
        )
      )
    )
  );

CREATE POLICY "System can manage discord posts"
  ON stream_discord_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_space_assets_updated_at
  BEFORE UPDATE ON space_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discord_webhooks_updated_at
  BEFORE UPDATE ON discord_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for space assets (this needs to be done via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('space-assets', 'space-assets', true);