/*
  # Add production role support

  1. Database Changes
    - Update staff_members role constraint to include 'production'
    - Update space_memberships role constraint to include 'production'
    - Update stream_assignments role constraint to include 'production'

  2. Security
    - No changes needed to RLS policies as they already handle role-based access

  3. Notes
    - Production role will have same permissions as casters and observers
    - Can be assigned to streams and manage availability like other roles
*/

-- Update staff_members table to allow 'production' role
ALTER TABLE staff_members DROP CONSTRAINT IF EXISTS staff_members_role_check;
ALTER TABLE staff_members ADD CONSTRAINT staff_members_role_check 
  CHECK (role IN ('caster', 'observer', 'production'));

-- Update space_memberships table to allow 'production' role  
ALTER TABLE space_memberships DROP CONSTRAINT IF EXISTS space_memberships_role_check;
ALTER TABLE space_memberships ADD CONSTRAINT space_memberships_role_check 
  CHECK (role IN ('owner', 'admin', 'caster', 'observer', 'production'));

-- Update stream_assignments table to allow 'production' role
ALTER TABLE stream_assignments DROP CONSTRAINT IF EXISTS stream_assignments_role_check;
ALTER TABLE stream_assignments ADD CONSTRAINT stream_assignments_role_check 
  CHECK (role IN ('caster', 'observer', 'production'));