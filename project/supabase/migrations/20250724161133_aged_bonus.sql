/*
  # Create credits system tables

  1. New Tables
    - `staff_credits`
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to staff_members)
      - `credits` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `credit_transactions`
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to staff_members)
      - `stream_id` (uuid, foreign key to streams, nullable)
      - `amount` (integer)
      - `reason` (text)
      - `created_at` (timestamp)
    - `user_profiles`
      - `id` (uuid, primary key, foreign key to auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Functions
    - Create increment_credits function for atomic credit updates
*/

-- Create staff_credits table
CREATE TABLE IF NOT EXISTS staff_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  credits integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id)
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  stream_id uuid REFERENCES streams(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table for authentication
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_credits
CREATE POLICY "Anyone can view staff credits"
  ON staff_credits
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert staff credits"
  ON staff_credits
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update staff credits"
  ON staff_credits
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete staff credits"
  ON staff_credits
  FOR DELETE
  TO public
  USING (true);

-- Create policies for credit_transactions
CREATE POLICY "Anyone can view credit transactions"
  ON credit_transactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert credit transactions"
  ON credit_transactions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update credit transactions"
  ON credit_transactions
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete credit transactions"
  ON credit_transactions
  FOR DELETE
  TO public
  USING (true);

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_credits_staff_id ON staff_credits(staff_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_staff_id ON credit_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stream_id ON credit_transactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Create updated_at triggers
CREATE TRIGGER update_staff_credits_updated_at
  BEFORE UPDATE ON staff_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create increment_credits function
CREATE OR REPLACE FUNCTION increment_credits(p_staff_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO staff_credits (staff_id, credits)
  VALUES (p_staff_id, p_amount)
  ON CONFLICT (staff_id)
  DO UPDATE SET 
    credits = staff_credits.credits + p_amount,
    updated_at = now();
END;
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();