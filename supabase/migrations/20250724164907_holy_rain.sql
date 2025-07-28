/*
  # Create increment credits RPC function

  1. Functions
    - `increment_credits` - Safely increment staff credits with UPSERT logic
  
  2. Security
    - Function is accessible to authenticated users
    - Handles both insert and update cases automatically
*/

-- Create or replace the increment_credits function
CREATE OR REPLACE FUNCTION increment_credits(p_staff_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update staff credits
  INSERT INTO staff_credits (staff_id, credits, space_id)
  SELECT 
    p_staff_id, 
    p_amount,
    sm.space_id
  FROM staff_members sm 
  WHERE sm.id = p_staff_id
  ON CONFLICT (staff_id) 
  DO UPDATE SET 
    credits = staff_credits.credits + p_amount,
    updated_at = now();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_credits(uuid, integer) TO authenticated;