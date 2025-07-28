/*
  # Fix increment_credits function for proper leaderboard updates

  1. Database Function Updates
    - Fix the increment_credits RPC function to properly handle UPSERT operations
    - Ensure staff_credits table is updated correctly for leaderboard display
    - Add proper error handling and logging

  2. Security
    - Maintain SECURITY DEFINER for proper permissions
    - Grant necessary execution rights
*/

-- Drop the existing function first to ensure clean recreation
DROP FUNCTION IF EXISTS public.increment_credits(uuid, integer);

-- Create the corrected increment_credits function
CREATE OR REPLACE FUNCTION public.increment_credits(p_staff_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
    -- Use INSERT with ON CONFLICT to handle both new records and updates
    INSERT INTO public.staff_credits (staff_id, credits, created_at, updated_at)
    VALUES (p_staff_id, p_amount, now(), now())
    ON CONFLICT (staff_id) DO UPDATE SET
        credits = public.staff_credits.credits + p_amount,
        updated_at = now();
        
    -- Log the operation for debugging
    RAISE NOTICE 'Updated credits for staff_id: %, amount: %, new_total: %', 
        p_staff_id, 
        p_amount, 
        (SELECT credits FROM public.staff_credits WHERE staff_id = p_staff_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO public;

-- Ensure the staff_credits table has proper indexes
CREATE INDEX IF NOT EXISTS idx_staff_credits_staff_id_credits ON public.staff_credits(staff_id, credits);

-- Add a helper function to recalculate credits from transactions (for data consistency)
CREATE OR REPLACE FUNCTION public.recalculate_staff_credits()
RETURNS void AS $$
BEGIN
    -- Recalculate credits for all staff based on their transactions
    INSERT INTO public.staff_credits (staff_id, credits, created_at, updated_at)
    SELECT 
        ct.staff_id,
        COALESCE(SUM(ct.amount), 0) as total_credits,
        now(),
        now()
    FROM public.credit_transactions ct
    GROUP BY ct.staff_id
    ON CONFLICT (staff_id) DO UPDATE SET
        credits = EXCLUDED.credits,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions for the recalculation function
GRANT EXECUTE ON FUNCTION public.recalculate_staff_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_staff_credits() TO anon;
GRANT EXECUTE ON FUNCTION public.recalculate_staff_credits() TO public;