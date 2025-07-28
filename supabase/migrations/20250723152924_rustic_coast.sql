/*
  # Add Credit System Database Functions

  1. Functions
    - `update_updated_at_column()` - Trigger function to automatically update updated_at timestamps
    - `increment_credits(staff_id, amount)` - RPC function to safely increment staff credits

  2. Security
    - Functions are created with proper permissions
    - RPC function can be called by authenticated and anonymous users

  3. Purpose
    - Enables automatic timestamp updates on record changes
    - Provides atomic credit increment operations
    - Fixes "failed to add adjustment" errors
*/

-- Function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- RPC function to safely increment credits
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
$$ LANGUAGE 'plpgsql';

-- Grant execute permissions on the RPC function
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO public;
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO authenticated;