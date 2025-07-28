import { useState, useEffect } from 'react';
import { supabase, DatabaseStaff, DatabaseAvailabilitySlot } from '../lib/supabase';
import { Staff, TimeSlot, AvailabilityData } from '../types';

export function useSupabaseData(spaceId?: string) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert database staff to app format
  const convertDatabaseStaff = (dbStaff: DatabaseStaff): Staff => ({
    id: dbStaff.id,
    name: dbStaff.name,
    email: dbStaff.email,
    role: dbStaff.role,
    avatar: dbStaff.avatar,
  });

  // Convert database slot to app format
  const convertDatabaseSlot = (dbSlot: DatabaseAvailabilitySlot): TimeSlot => ({
    id: dbSlot.id,
    staffId: dbSlot.staff_id,
    date: dbSlot.date,
    startTime: dbSlot.start_time,
    endTime: dbSlot.end_time,
    status: dbSlot.status,
    notes: dbSlot.notes,
  });

  // Load initial data
  useEffect(() => {
    if (spaceId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [spaceId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!spaceId) {
      console.log('No spaceId, skipping real-time subscriptions');
      return;
    }

    console.log('Setting up real-time subscriptions for space:', spaceId);

    const staffChannel = supabase
      .channel(`staff_changes_${spaceId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'staff_members',
          filter: `space_id=eq.${spaceId}`
        },
        (payload) => {
          console.log('Staff change detected:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            loadStaff();
          }, 100);
        }
      )
      .subscribe();

    const availabilityChannel = supabase
      .channel(`availability_changes_${spaceId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'availability_slots',
          filter: `space_id=eq.${spaceId}`
        },
        (payload) => {
          console.log('Availability change detected:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            loadAvailability();
          }, 100);
        }
      )
      .subscribe();

    // Log subscription status
    staffChannel.subscribe((status) => {
      console.log('Staff channel subscription status:', status);
    });
    
    availabilityChannel.subscribe((status) => {
      console.log('Availability channel subscription status:', status);
    });
    return () => {
      console.log('Cleaning up real-time subscriptions for space:', spaceId);
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(availabilityChannel);
    };
  }, [spaceId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    console.log('Loading data for space:', spaceId);
    
    try {
      await Promise.all([loadStaff(), loadAvailability()]);
      console.log('Data loading completed successfully');
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    if (!spaceId) return;
    console.log('Loading staff for space:', spaceId);

    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    setStaff(data?.map(convertDatabaseStaff) || []);
    console.log('Staff loaded:', data?.length || 0);
  };

  const loadAvailability = async () => {
    if (!spaceId) return;
    console.log('Loading availability for space:', spaceId);

    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('space_id', spaceId)
      .order('date', { ascending: true });

    if (error) throw error;

    const availabilityMap: AvailabilityData = {};
    data?.forEach(slot => {
      const convertedSlot = convertDatabaseSlot(slot);
      if (!availabilityMap[convertedSlot.staffId]) {
        availabilityMap[convertedSlot.staffId] = [];
      }
      availabilityMap[convertedSlot.staffId].push(convertedSlot);
    });

    setAvailability(availabilityMap);
    console.log('Availability loaded:', data?.length || 0, 'slots');
  };

  const addStaff = async (newStaff: Omit<Staff, 'id'>) => {
    if (!spaceId) throw new Error('No space selected');

    const { error } = await supabase
      .from('staff_members')
      .insert([{
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        avatar: newStaff.avatar,
        space_id: spaceId,
      }]);

    if (error) throw error;
  };

  const removeStaff = async (staffId: string) => {
    const { error } = await supabase
      .from('staff_members')
      .delete()
      .eq('id', staffId);

    if (error) throw error;
  };

  const saveAvailability = async (slot: Omit<TimeSlot, 'id'>) => {
    if (!spaceId) throw new Error('No space selected');

    // Check if slot already exists
    const { data: existingSlots } = await supabase
      .from('availability_slots')
      .select('id')
      .eq('staff_id', slot.staffId)
      .eq('date', slot.date)
      .eq('start_time', slot.startTime)
      .eq('space_id', spaceId);

    const slotData = {
      staff_id: slot.staffId,
      date: slot.date,
      start_time: slot.startTime,
      end_time: slot.endTime,
      status: slot.status,
      notes: slot.notes,
      space_id: spaceId,
    };

    let error;
    if (existingSlots && existingSlots.length > 0) {
      // Update existing slot
      ({ error } = await supabase
        .from('availability_slots')
        .update(slotData)
        .eq('id', existingSlots[0].id));
    } else {
      // Insert new slot
      ({ error } = await supabase
        .from('availability_slots')
        .insert([slotData]));
    }

    if (error) throw error;
  };

  return {
    staff,
    availability,
    loading,
    error,
    addStaff,
    removeStaff,
    saveAvailability,
    refreshData: loadData,
  };
}