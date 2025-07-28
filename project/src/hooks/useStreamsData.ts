import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StreamWithDetails, Stream, StreamAssignment, StreamRSVP } from '../types';

export function useStreamsData(spaceId?: string) {
  const [streams, setStreams] = useState<StreamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (spaceId) {
      loadStreams();
      console.log('Setting up streams real-time subscriptions for space:', spaceId);
    } else {
      setLoading(false);
      console.log('No spaceId, skipping streams real-time subscriptions');
    }
    
    // Set up real-time subscriptions
    if (!spaceId) {
      return;
    }

    const streamsChannel = supabase
      .channel(`streams_changes_${spaceId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'streams',
          filter: `space_id=eq.${spaceId}`
        },
        (payload) => {
          console.log('Stream change detected:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            loadStreams();
          }, 100);
        }
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'stream_assignments'
        },
        (payload) => {
          console.log('Stream assignment change detected:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            loadStreams();
          }, 100);
        }
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'stream_rsvps'
        },
        (payload) => {
          console.log('Stream RSVP change detected:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            loadStreams();
          }, 100);
        }
      )
      .subscribe();

    // Log subscription status
    streamsChannel.subscribe((status) => {
      console.log('Streams channel subscription status:', status);
    });
    return () => {
      console.log('Cleaning up streams real-time subscriptions for space:', spaceId);
      supabase.removeChannel(streamsChannel);
    };
  }, [spaceId]);

  const loadStreams = async () => {
    if (!spaceId) return;

    try {
      setError(null);
      
      // Load streams
      const { data: streamsData, error: streamsError } = await supabase
        .from('streams')
        .select('*')
        .eq('space_id', spaceId)
        .order('date', { ascending: true });

      if (streamsError) throw streamsError;

      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('stream_assignments')
        .select(`
          *,
          streams!inner(space_id)
        `)
        .eq('streams.space_id', spaceId);

      if (assignmentsError) throw assignmentsError;

      // Load RSVPs
      const { data: rsvpsData, error: rsvpsError } = await supabase
        .from('stream_rsvps')
        .select(`
          *,
          streams!inner(space_id)
        `)
        .eq('streams.space_id', spaceId);

      if (rsvpsError) throw rsvpsError;

      // Combine data
      const streamsWithDetails: StreamWithDetails[] = (streamsData || []).map(stream => ({
        id: stream.id,
        title: stream.title,
        date: stream.date,
        startTime: stream.start_time,
        endTime: stream.end_time,
        description: stream.description,
        streamLink: stream.stream_link,
        status: stream.status,
        createdBy: stream.created_by,
        createdAt: stream.created_at,
        updatedAt: stream.updated_at,
        assignments: (assignmentsData || [])
          .filter(a => a.stream_id === stream.id)
          .map(a => ({
            id: a.id,
            streamId: a.stream_id,
            staffId: a.staff_id,
            role: a.role,
            isPrimary: a.is_primary,
            createdAt: a.created_at,
          })),
        rsvps: (rsvpsData || [])
          .filter(r => r.stream_id === stream.id)
          .map(r => ({
            id: r.id,
            streamId: r.stream_id,
            staffId: r.staff_id,
            status: r.status,
            notes: r.notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          })),
      }));

      setStreams(streamsWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const createStream = async (streamData: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    casters: string[];
    observers: string[];
  }) => {
    if (!spaceId) throw new Error('No space selected');

    try {
      // Create stream
      const { data: stream, error: streamError } = await supabase
        .from('streams')
        .insert([{
          title: streamData.title,
          date: streamData.date,
          start_time: streamData.startTime,
          end_time: streamData.endTime,
          description: streamData.description,
          created_by: 'system', // You might want to use actual user info here
          space_id: spaceId,
        }])
        .select()
        .single();

      if (streamError) throw streamError;

      // Create assignments
      const assignments = [
        ...streamData.casters.map(casterId => ({
          stream_id: stream.id,
          staff_id: casterId,
          role: 'caster',
          is_primary: true,
        })),
        ...streamData.observers.map(observerId => ({
          stream_id: stream.id,
          staff_id: observerId,
          role: 'observer',
          is_primary: true,
        })),
      ];

      if (assignments.length > 0) {
        const { error: assignmentsError } = await supabase
          .from('stream_assignments')
          .insert(assignments);

        if (assignmentsError) throw assignmentsError;
      }

      await loadStreams();
    } catch (err) {
      throw err;
    }
  };

  const updateRSVP = async (streamId: string, staffId: string, status: 'attending' | 'not_attending' | 'maybe', notes?: string) => {
    try {
      console.log('Updating RSVP:', { streamId, staffId, status, notes });
      
      // Check if the staff member exists in either staff_members or space_memberships
      let staffExists = false;
      
      // First check staff_members table
      const { data: staffCheck } = await supabase
        .from('staff_members')
        .select('id')
        .eq('id', staffId)
        .single();
      
      if (staffCheck) {
        staffExists = true;
      } else {
        // If not in staff_members, check if they're a space member
        const { data: memberCheck } = await supabase
          .from('space_memberships')
          .select('user_id')
          .eq('user_id', staffId)
          .eq('status', 'approved')
          .single();
        
        if (memberCheck) {
          staffExists = true;
        }
      }
      
      if (!staffExists) {
        throw new Error('You must be a member of this space to RSVP.');
      }

      const { error } = await supabase
        .from('stream_rsvps')
        .upsert({
          stream_id: streamId,
          staff_id: staffId,
          status,
          notes,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'stream_id,staff_id'
        });

      if (error) throw error;
      
      console.log('RSVP updated successfully');
      
      // Force refresh the streams data to ensure UI updates immediately
      await loadStreams();
    } catch (err) {
      console.error('Error updating RSVP:', err);
      throw err;
    }
  };

  const updateStreamStatus = async (streamId: string, status: 'scheduled' | 'live' | 'completed' | 'cancelled', streamLink?: string) => {
    try {
      console.log('Updating stream status:', { streamId, status, streamLink });
      
      const updateData: any = { status };
      if (streamLink !== undefined) {
        updateData.stream_link = streamLink;
      }

      const { error } = await supabase
        .from('streams')
        .update(updateData)
        .eq('id', streamId);

      if (error) throw error;
      
      console.log('Stream status updated successfully');

      // If marking as completed, return stream data for credits processing
      if (status === 'completed') {
        const { data: streamData } = await supabase
          .from('streams')
          .select(`
            *,
            stream_assignments!inner(staff_id, role)
          `)
          .eq('id', streamId)
          .single();

        return streamData;
      }
      
      // Force refresh the streams data to ensure UI updates immediately
      await loadStreams();
    } catch (err) {
      console.error('Error updating stream status:', err);
      throw err;
    }
  };

  const deleteStream = async (streamId: string) => {
    try {
      console.log('Deleting stream:', streamId);
      
      const { error } = await supabase
        .from('streams')
        .delete()
        .eq('id', streamId);

      if (error) throw error;
      
      console.log('Stream deleted successfully');
      
      // Force refresh the streams data to ensure UI updates immediately
      await loadStreams();
    } catch (err) {
      console.error('Error deleting stream:', err);
      throw err;
    }
  };

  return {
    streams,
    loading,
    error,
    createStream,
    updateRSVP,
    updateStreamStatus,
    deleteStream,
    refreshStreams: loadStreams,
  };
}