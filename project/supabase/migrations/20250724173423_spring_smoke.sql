/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - The space_memberships policies are causing infinite recursion
    - Policies are referencing the same table they're protecting

  2. Solution
    - Simplify policies to avoid self-referencing queries
    - Use direct ownership checks instead of membership lookups
    - Separate policies for different operations
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Space admins can view memberships" ON space_memberships;
DROP POLICY IF EXISTS "Space owners can manage all memberships" ON space_memberships;
DROP POLICY IF EXISTS "Users can create their own membership requests" ON space_memberships;
DROP POLICY IF EXISTS "Users can view memberships for spaces they have access to" ON space_memberships;

-- Create new simplified policies that avoid recursion

-- 1. Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON space_memberships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Users can view memberships for public spaces
CREATE POLICY "Anyone can view public space memberships"
  ON space_memberships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_memberships.space_id 
      AND spaces.is_public = true
    )
  );

-- 3. Space owners can view all memberships in their spaces
CREATE POLICY "Space owners can view all memberships"
  ON space_memberships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_memberships.space_id 
      AND spaces.owner_id = auth.uid()
    )
  );

-- 4. Space owners can manage all memberships in their spaces
CREATE POLICY "Space owners can manage memberships"
  ON space_memberships
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_memberships.space_id 
      AND spaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_memberships.space_id 
      AND spaces.owner_id = auth.uid()
    )
  );

-- 5. Users can insert their own membership (for join requests)
CREATE POLICY "Users can create own membership"
  ON space_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 6. Users can update their own membership status (for leaving)
CREATE POLICY "Users can update own membership"
  ON space_memberships
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());