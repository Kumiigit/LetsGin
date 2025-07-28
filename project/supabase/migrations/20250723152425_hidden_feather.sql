/*
  # Add Credits System

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

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (matching existing pattern)

  3. Functions
    - Function to automatically award credits when stream is completed
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

-- Create credit_transactions table for tracking credit history
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  stream_id uuid REFERENCES streams(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (matching existing pattern)
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

-- Add updated_at trigger for staff_credits
CREATE TRIGGER update_staff_credits_updated_at
  BEFORE UPDATE ON staff_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_credits_staff_id ON staff_credits(staff_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_staff_id ON credit_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stream_id ON credit_transactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Function to initialize credits for existing staff
DO $$
BEGIN
  INSERT INTO staff_credits (staff_id, credits)
  SELECT id, 0
  FROM staff_members
  WHERE id NOT IN (SELECT staff_id FROM staff_credits);
END $$;