/*
  # Remove Credits System

  1. Tables to Drop
    - `credit_transactions` - All credit transaction records
    - `staff_credits` - Staff credit balances

  2. Functions to Drop
    - `increment_credits` - Credit increment function

  3. Security
    - All related RLS policies will be automatically dropped with tables
*/

-- Drop credit transactions table
DROP TABLE IF EXISTS credit_transactions CASCADE;

-- Drop staff credits table  
DROP TABLE IF EXISTS staff_credits CASCADE;

-- Drop increment credits function if it exists
DROP FUNCTION IF EXISTS increment_credits(uuid, integer) CASCADE;