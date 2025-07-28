/*
  # Create Spaces System

  1. New Tables
    - `spaces`
      - `id` (uuid, primary key)
      - `name` (text, space name)
      - `description` (text, space description)
      - `owner_id` (uuid, references auth.users)
      - `is_public` (boolean, visibility setting)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `space_memberships`
      - `id` (uuid, primary key)
      - `space_id` (uuid, references spaces)
      - `user_id` (uuid, references auth.users)
      - `role` (enum: owner, caster, observer)
      - `status` (enum: pending, approved, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `join_requests`
      - `id` (uuid, primary key)
      - `space_id` (uuid, references spaces)
      - `user_id` (uuid, references auth.users)
      - `message` (text, optional join message)
      - `status` (enum: pending, approved, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Updated Tables
    - Add `space_id` to existing tables: staff_members, streams, availability_slots, staff_credits, credit_transactions

  3. Security
    - Enable RLS on all new tables
    - Add policies for space-based access control
    - Update existing table policies to include space filtering

  4. Enums
    - Create membership_status enum
    - Create join_request_status enum
*/

-- Create enums
CREATE TYPE membership_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE join_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- Create space_memberships table
CREATE TABLE IF NOT EXISTS space_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'caster', 'observer')),
  status membership_status DEFAULT 'approved',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(space_id, user_id)
);

ALTER TABLE space_memberships ENABLE ROW LEVEL SECURITY;

-- Create join_requests table
CREATE TABLE IF NOT EXISTS join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status join_request_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(space_id, user_id)
);

ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- Add space_id to existing tables
DO $$
BEGIN
  -- Add space_id to staff_members
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff_members' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE staff_members ADD COLUMN space_id uuid REFERENCES spaces(id) ON DELETE CASCADE;
  END IF;

  -- Add space_id to streams
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'streams' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE streams ADD COLUMN space_id uuid REFERENCES spaces(id) ON DELETE CASCADE;
  END IF;

  -- Add space_id to availability_slots
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'availability_slots' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE availability_slots ADD COLUMN space_id uuid REFERENCES spaces(id) ON DELETE CASCADE;
  END IF;

  -- Add space_id to staff_credits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff_credits' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE staff_credits ADD COLUMN space_id uuid REFERENCES spaces(id) ON DELETE CASCADE;
  END IF;

  -- Add space_id to credit_transactions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_transactions' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE credit_transactions ADD COLUMN space_id uuid REFERENCES spaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spaces_owner_id ON spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_spaces_is_public ON spaces(is_public);
CREATE INDEX IF NOT EXISTS idx_space_memberships_space_id ON space_memberships(space_id);
CREATE INDEX IF NOT EXISTS idx_space_memberships_user_id ON space_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_space_id ON join_requests(space_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);

-- Add space_id indexes to existing tables
CREATE INDEX IF NOT EXISTS idx_staff_members_space_id ON staff_members(space_id);
CREATE INDEX IF NOT EXISTS idx_streams_space_id ON streams(space_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_space_id ON availability_slots(space_id);
CREATE INDEX IF NOT EXISTS idx_staff_credits_space_id ON staff_credits(space_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_space_id ON credit_transactions(space_id);

-- RLS Policies for spaces
CREATE POLICY "Users can view public spaces or spaces they're members of"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (
    is_public = true OR 
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM space_memberships 
      WHERE space_id = spaces.id 
      AND user_id = auth.uid() 
      AND status = 'approved'
    )
  );

CREATE POLICY "Users can create their own spaces"
  ON spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Space owners can update their spaces"
  ON spaces
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Space owners can delete their spaces"
  ON spaces
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for space_memberships
CREATE POLICY "Users can view memberships for spaces they have access to"
  ON space_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = space_id 
      AND (owner_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Space owners can manage memberships"
  ON space_memberships
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = space_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own membership requests"
  ON space_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for join_requests
CREATE POLICY "Users can view their own join requests"
  ON join_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Space owners can view join requests for their spaces"
  ON join_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = space_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create join requests"
  ON join_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Space owners can update join requests for their spaces"
  ON join_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = space_id 
      AND owner_id = auth.uid()
    )
  );

-- Update existing table policies to include space filtering
-- Note: We'll need to update the application code to handle space_id filtering

-- Add triggers for updated_at
CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_space_memberships_updated_at
  BEFORE UPDATE ON space_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_join_requests_updated_at
  BEFORE UPDATE ON join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();