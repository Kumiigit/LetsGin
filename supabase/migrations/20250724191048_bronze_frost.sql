/*
  # Fix foreign key relationship for space memberships

  1. Foreign Key Fix
    - Add missing foreign key constraint between space_memberships.user_id and user_profiles.id
    - This will enable proper joins in queries

  2. Data Integrity
    - Ensure referential integrity between space memberships and user profiles
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'space_memberships_user_id_fkey' 
    AND table_name = 'space_memberships'
  ) THEN
    ALTER TABLE space_memberships 
    ADD CONSTRAINT space_memberships_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;