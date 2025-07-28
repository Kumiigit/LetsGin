/*
  # Add streams and RSVP functionality

  1. New Tables
    - `streams`
      - `id` (uuid, primary key)
      - `title` (text)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `description` (text, optional)
      - `created_by` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `stream_assignments`
      - `id` (uuid, primary key)
      - `stream_id` (uuid, foreign key)
      - `staff_id` (uuid, foreign key)
      - `role` (enum: caster, observer)
      - `is_primary` (boolean)
      - `created_at` (timestamp)
    
    - `stream_rsvps`
      - `id` (uuid, primary key)
      - `stream_id` (uuid, foreign key)
      - `staff_id` (uuid, foreign key)
      - `status` (enum: attending, not_attending, maybe)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for public access (matching existing pattern)

  3. Indexes
    - Add indexes for efficient querying
</*/

-- Create enum for RSVP status
CREATE TYPE rsvp_status AS ENUM ('attending', 'not_attending', 'maybe');

-- Create streams table
CREATE TABLE IF NOT EXISTS streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  description text,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stream assignments table
CREATE TABLE IF NOT EXISTS stream_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('caster', 'observer')),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(stream_id, staff_id, role)
);

-- Create stream RSVPs table
CREATE TABLE IF NOT EXISTS stream_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'maybe',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(stream_id, staff_id)
);

-- Enable RLS
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_rsvps ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Anyone can view streams"
  ON streams FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert streams"
  ON streams FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update streams"
  ON streams FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete streams"
  ON streams FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Anyone can view stream assignments"
  ON stream_assignments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert stream assignments"
  ON stream_assignments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update stream assignments"
  ON stream_assignments FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete stream assignments"
  ON stream_assignments FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Anyone can view stream RSVPs"
  ON stream_rsvps FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert stream RSVPs"
  ON stream_rsvps FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update stream RSVPs"
  ON stream_rsvps FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete stream RSVPs"
  ON stream_rsvps FOR DELETE
  TO public
  USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_streams_date ON streams(date);
CREATE INDEX IF NOT EXISTS idx_stream_assignments_stream_id ON stream_assignments(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_assignments_staff_id ON stream_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_stream_rsvps_stream_id ON stream_rsvps(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_rsvps_staff_id ON stream_rsvps(staff_id);

-- Add update triggers
CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON streams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stream_rsvps_updated_at
  BEFORE UPDATE ON stream_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();