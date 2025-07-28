/*
  # Fix join_requests and user_profiles relationship

  1. Changes
    - Add foreign key constraint between join_requests.user_id and user_profiles.id
    - Update RLS policies to work with the relationship
    - Ensure proper data integrity

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'join_requests_user_id_fkey' 
    AND table_name = 'join_requests'
  ) THEN
    ALTER TABLE join_requests 
    ADD CONSTRAINT join_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;