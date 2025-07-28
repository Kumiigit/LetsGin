import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DatabaseStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAvailabilitySlot {
  id: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'busy' | 'off';
  notes?: string;
  created_at: string;
  updated_at: string;
}