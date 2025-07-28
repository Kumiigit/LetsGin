/*
  # Add stream links and status fields

  1. New Columns
    - `stream_link` (text, optional) - URL for Twitch/YouTube stream
    - `status` (enum) - Stream status: scheduled, live, completed, cancelled
    
  2. Changes
    - Add stream_link column to streams table
    - Add status column with default 'scheduled'
    - Create enum type for stream status
*/

-- Create enum for stream status
CREATE TYPE stream_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

-- Add new columns to streams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'streams' AND column_name = 'stream_link'
  ) THEN
    ALTER TABLE streams ADD COLUMN stream_link text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'streams' AND column_name = 'status'
  ) THEN
    ALTER TABLE streams ADD COLUMN status stream_status DEFAULT 'scheduled';
  END IF;
END $$;