/*
  # Fix spaces RLS policy infinite recursion

  1. Problem
    - The current RLS policy for spaces has an infinite recursion
    - It's trying to check space_memberships while querying spaces
    - This creates a circular dependency

  2. Solution
    - Simplify the RLS policy to avoid recursion
    - Use direct ownership check and public space check
    - Remove the complex membership subquery that causes recursion

  3. Security
    - Users can view public spaces
    - Users can view spaces they own
    - Keep it simple to avoid recursion
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view public spaces or spaces they're members of" ON spaces;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Users can view public spaces and owned spaces"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (
    is_public = true OR owner_id = auth.uid()
  );

-- Keep the other policies as they are working fine
-- The membership check will be handled at the application level