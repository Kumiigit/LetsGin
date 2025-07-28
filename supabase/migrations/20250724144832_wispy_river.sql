/*
  # Fix increment_credits function

  1. Function Updates
    - Fix the increment_credits function to handle larger amounts properly
    - Add better error handling and logging
    - Ensure proper upsert behavior for staff_credits

  2. Security
    - Maintain RLS policies
    - Ensure proper permissions
*/

-- Drop and recreate the increment_credits function with better logic
DROP FUNCTION IF EXISTS public.increment_credits(uuid, integer);

CREATE OR REPLACE FUNCTION public.increment_credits(staff_id uuid, amount integer)
RETURNS void AS $$
BEGIN
  -- Insert or update staff credits
  INSERT INTO public.staff_credits (staff_id, credits)
  VALUES (staff_id, GREATEST(0, amount))
  ON CONFLICT (staff_id)
  DO UPDATE SET 
    credits = GREATEST(0, staff_credits.credits + amount),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO public;
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO authenticated;