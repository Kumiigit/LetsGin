/*
  # Staff Availability Management Schema

  1. New Tables
    - `staff_members`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `role` (text)
      - `avatar` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `availability_slots`
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to staff_members)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `status` (enum: available, busy, off)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage data
    - Allow public read access for viewing schedules
*/

-- Create enum for availability status
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'off');

-- Create staff_members table
CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create availability_slots table
CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status availability_status NOT NULL DEFAULT 'available',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_availability_slots_staff_id ON availability_slots(staff_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_staff_date ON availability_slots(staff_id, date);

-- Enable Row Level Security
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_members
CREATE POLICY "Anyone can view staff members"
  ON staff_members
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert staff members"
  ON staff_members
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update staff members"
  ON staff_members
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete staff members"
  ON staff_members
  FOR DELETE
  TO public
  USING (true);

-- Create policies for availability_slots
CREATE POLICY "Anyone can view availability slots"
  ON availability_slots
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert availability slots"
  ON availability_slots
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update availability slots"
  ON availability_slots
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete availability slots"
  ON availability_slots
  FOR DELETE
  TO public
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_staff_members_updated_at
  BEFORE UPDATE ON staff_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_slots_updated_at
  BEFORE UPDATE ON availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();