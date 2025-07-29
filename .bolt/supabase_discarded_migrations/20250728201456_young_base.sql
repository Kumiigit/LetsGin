/*
  # Reset Database to Fresh State

  This migration will:
  1. Drop all existing tables and their dependencies
  2. Drop all custom types
  3. Drop all custom functions
  4. Recreate the entire database schema from scratch
  5. Set up all RLS policies
  6. Create necessary functions and triggers

  This provides a completely fresh database state.
*/

-- Drop all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS stream_discord_posts CASCADE;
DROP TABLE IF EXISTS discord_webhooks CASCADE;
DROP TABLE IF EXISTS space_assets CASCADE;
DROP TABLE IF EXISTS stream_rsvps CASCADE;
DROP TABLE IF EXISTS stream_assignments CASCADE;
DROP TABLE IF EXISTS streams CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS staff_credits CASCADE;
DROP TABLE IF EXISTS availability_slots CASCADE;
DROP TABLE IF EXISTS staff_members CASCADE;
DROP TABLE IF EXISTS join_requests CASCADE;
DROP TABLE IF EXISTS space_memberships CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS stream_status CASCADE;
DROP TYPE IF EXISTS rsvp_status CASCADE;
DROP TYPE IF EXISTS membership_status CASCADE;
DROP TYPE IF EXISTS join_request_status CASCADE;
DROP TYPE IF EXISTS availability_status CASCADE;

-- Drop custom functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS increment_credits(uuid, integer) CASCADE;

-- Create custom types
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'off');
CREATE TYPE join_request_status AS ENUM ('approved', 'pending', 'rejected');
CREATE TYPE membership_status AS ENUM ('approved', 'pending', 'rejected');
CREATE TYPE rsvp_status AS ENUM ('attending', 'maybe', 'not_attending');
CREATE TYPE stream_status AS ENUM ('cancelled', 'completed', 'live', 'scheduled');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create user profile handling function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create increment credits function
CREATE OR REPLACE FUNCTION increment_credits(p_staff_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
  INSERT INTO staff_credits (staff_id, credits)
  VALUES (p_staff_id, p_amount)
  ON CONFLICT (staff_id)
  DO UPDATE SET 
    credits = staff_credits.credits + p_amount,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create spaces table
CREATE TABLE spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create space_memberships table
CREATE TABLE space_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'caster', 'observer')),
  status membership_status DEFAULT 'approved',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- Create join_requests table
CREATE TABLE join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status join_request_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- Create staff_members table
CREATE TABLE staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  avatar text,
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create availability_slots table
CREATE TABLE availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status availability_status DEFAULT 'available',
  notes text,
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create staff_credits table
CREATE TABLE staff_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid UNIQUE NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  credits integer DEFAULT 0,
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create credit_transactions table
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  stream_id uuid REFERENCES streams(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create streams table
CREATE TABLE streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  description text,
  created_by text NOT NULL,
  stream_link text,
  status stream_status DEFAULT 'scheduled',
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stream_assignments table
CREATE TABLE stream_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('caster', 'observer')),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(stream_id, staff_id, role)
);

-- Create stream_rsvps table
CREATE TABLE stream_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  status rsvp_status DEFAULT 'maybe',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(stream_id, staff_id)
);

-- Create space_assets table
CREATE TABLE space_assets (
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
CREATE TABLE discord_webhooks (
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

-- Create stream_discord_posts table
CREATE TABLE stream_discord_posts (
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

-- Create indexes for better performance
CREATE INDEX idx_spaces_owner_id ON spaces(owner_id);
CREATE INDEX idx_spaces_is_public ON spaces(is_public);
CREATE INDEX idx_space_memberships_space_id ON space_memberships(space_id);
CREATE INDEX idx_space_memberships_user_id ON space_memberships(user_id);
CREATE INDEX idx_join_requests_space_id ON join_requests(space_id);
CREATE INDEX idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);
CREATE INDEX idx_staff_members_space_id ON staff_members(space_id);
CREATE INDEX idx_availability_slots_staff_id ON availability_slots(staff_id);
CREATE INDEX idx_availability_slots_date ON availability_slots(date);
CREATE INDEX idx_availability_slots_staff_date ON availability_slots(staff_id, date);
CREATE INDEX idx_availability_slots_space_id ON availability_slots(space_id);
CREATE INDEX idx_staff_credits_staff_id ON staff_credits(staff_id);
CREATE INDEX idx_staff_credits_space_id ON staff_credits(space_id);
CREATE INDEX idx_credit_transactions_staff_id ON credit_transactions(staff_id);
CREATE INDEX idx_credit_transactions_stream_id ON credit_transactions(stream_id);
CREATE INDEX idx_credit_transactions_space_id ON credit_transactions(space_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_streams_space_id ON streams(space_id);
CREATE INDEX idx_streams_date ON streams(date);
CREATE INDEX idx_stream_assignments_stream_id ON stream_assignments(stream_id);
CREATE INDEX idx_stream_assignments_staff_id ON stream_assignments(staff_id);
CREATE INDEX idx_stream_rsvps_stream_id ON stream_rsvps(stream_id);
CREATE INDEX idx_stream_rsvps_staff_id ON stream_rsvps(staff_id);
CREATE INDEX idx_space_assets_space_id ON space_assets(space_id);
CREATE INDEX idx_space_assets_type ON space_assets(space_id, asset_type);
CREATE INDEX idx_discord_webhooks_space_id ON discord_webhooks(space_id);
CREATE INDEX idx_stream_discord_posts_stream_id ON stream_discord_posts(stream_id);
CREATE INDEX idx_stream_discord_posts_webhook_id ON stream_discord_posts(webhook_id);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_discord_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Create RLS policies for spaces
CREATE POLICY "Users can view public spaces and owned spaces" ON spaces FOR SELECT TO authenticated USING (is_public = true OR owner_id = auth.uid());
CREATE POLICY "Users can create their own spaces" ON spaces FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Space owners can update their spaces" ON spaces FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Space owners can delete their spaces" ON spaces FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Create RLS policies for space_memberships
CREATE POLICY "Users can view own memberships" ON space_memberships FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Space owners can view all memberships" ON space_memberships FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM spaces WHERE spaces.id = space_memberships.space_id AND spaces.owner_id = auth.uid()));
CREATE POLICY "Anyone can view public space memberships" ON space_memberships FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM spaces WHERE spaces.id = space_memberships.space_id AND spaces.is_public = true));
CREATE POLICY "Users can create own membership" ON space_memberships FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own membership" ON space_memberships FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Space owners can manage memberships" ON space_memberships FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM spaces WHERE spaces.id = space_memberships.space_id AND spaces.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM spaces WHERE spaces.id = space_memberships.space_id AND spaces.owner_id = auth.uid()));

-- Create RLS policies for join_requests
CREATE POLICY "Users can view their own join requests" ON join_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Space owners can view join requests for their spaces" ON join_requests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM spaces WHERE spaces.id = join_requests.space_id AND spaces.owner_id = auth.uid()));
CREATE POLICY "Users can create join requests" ON join_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Space owners can update join requests for their spaces" ON join_requests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM spaces WHERE spaces.id = join_requests.space_id AND spaces.owner_id = auth.uid()));

-- Create RLS policies for staff_members
CREATE POLICY "Anyone can view staff members" ON staff_members FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert staff members" ON staff_members FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update staff members" ON staff_members FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete staff members" ON staff_members FOR DELETE TO public USING (true);

-- Create RLS policies for availability_slots
CREATE POLICY "Anyone can view availability slots" ON availability_slots FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert availability slots" ON availability_slots FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update availability slots" ON availability_slots FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete availability slots" ON availability_slots FOR DELETE TO public USING (true);

-- Create RLS policies for staff_credits
CREATE POLICY "Anyone can view staff credits" ON staff_credits FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert staff credits" ON staff_credits FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete staff credits" ON staff_credits FOR DELETE TO public USING (true);
CREATE POLICY "Space owners and admins can update staff credits" ON staff_credits FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM space_memberships sm WHERE sm.space_id = staff_credits.space_id AND sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin') AND sm.status = 'approved'));

-- Create RLS policies for credit_transactions
CREATE POLICY "Anyone can view credit transactions" ON credit_transactions FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update credit transactions" ON credit_transactions FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete credit transactions" ON credit_transactions FOR DELETE TO public USING (true);
CREATE POLICY "Space owners and admins can insert credit transactions" ON credit_transactions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM space_memberships sm WHERE sm.space_id = credit_transactions.space_id AND sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin') AND sm.status = 'approved'));

-- Create RLS policies for streams
CREATE POLICY "Anyone can view streams" ON streams FOR SELECT TO public USING (true);
CREATE POLICY "Space owners and admins can insert streams" ON streams FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM space_memberships sm WHERE sm.space_id = streams.space_id AND sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin') AND sm.status = 'approved'));
CREATE POLICY "Space owners and admins can update streams" ON streams FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM space_memberships sm WHERE sm.space_id = streams.space_id AND sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin') AND sm.status = 'approved'));
CREATE POLICY "Space owners and admins can delete streams" ON streams FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM space_memberships sm WHERE sm.space_id = streams.space_id AND sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin') AND sm.status = 'approved'));

-- Create RLS policies for stream_assignments
CREATE POLICY "Anyone can view stream assignments" ON stream_assignments FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert stream assignments" ON stream_assignments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update stream assignments" ON stream_assignments FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete stream assignments" ON stream_assignments FOR DELETE TO public USING (true);

-- Create RLS policies for stream_rsvps
CREATE POLICY "Anyone can view stream RSVPs" ON stream_rsvps FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert stream RSVPs" ON stream_rsvps FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update stream RSVPs" ON stream_rsvps FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete stream RSVPs" ON stream_rsvps FOR DELETE TO public USING (true);

-- Create RLS policies for space_assets
CREATE POLICY "Users can view assets for accessible spaces" ON space_assets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM spaces s WHERE s.id = space_assets.space_id AND (s.is_public = true OR s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM space_memberships sm WHERE sm.space_id = s.id AND sm.user_id = auth.uid() AND sm.status = 'approved'))));
CREATE POLICY "Space owners can manage assets" ON space_assets FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM spaces s WHERE s.id = space_assets.space_id AND s.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM spaces s WHERE s.id = space_assets.space_id AND s.owner_id = auth.uid()));

-- Create RLS policies for discord_webhooks
CREATE POLICY "Space owners can manage webhooks" ON discord_webhooks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM spaces s WHERE s.id = discord_webhooks.space_id AND s.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM spaces s WHERE s.id = discord_webhooks.space_id AND s.owner_id = auth.uid()));

-- Create RLS policies for stream_discord_posts
CREATE POLICY "System can manage discord posts" ON stream_discord_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can view discord posts for accessible spaces" ON stream_discord_posts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM streams st JOIN spaces s ON s.id = st.space_id WHERE st.id = stream_discord_posts.stream_id AND (s.is_public = true OR s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM space_memberships sm WHERE sm.space_id = s.id AND sm.user_id = auth.uid() AND sm.status = 'approved'))));

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_space_memberships_updated_at BEFORE UPDATE ON space_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_join_requests_updated_at BEFORE UPDATE ON join_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_credits_updated_at BEFORE UPDATE ON staff_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stream_rsvps_updated_at BEFORE UPDATE ON stream_rsvps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_space_assets_updated_at BEFORE UPDATE ON space_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discord_webhooks_updated_at BEFORE UPDATE ON discord_webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new user handling
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();