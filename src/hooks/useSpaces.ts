import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Space, SpaceWithStats, SpaceMembership, JoinRequest, JoinRequestWithUser } from '../types';

export function useSpaces(userId?: string) {
  const [spaces, setSpaces] = useState<SpaceWithStats[]>([]);
  const [userSpaces, setUserSpaces] = useState<Space[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequestWithUser[]>([]);
  const [spaceMembers, setSpaceMembers] = useState<any[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadSpaces();
      if (currentSpace) {
        loadSpaceMembers();
      }
      
      // Set up real-time subscriptions
      const spacesChannel = supabase
        .channel(`spaces_changes_${userId}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'spaces' },
          (payload) => {
            console.log('Space change detected:', payload);
            loadSpaces();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'space_memberships' },
          (payload) => {
            console.log('Membership change detected:', payload);
            loadSpaces();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'join_requests' },
          (payload) => {
            console.log('Join request change detected:', payload);
            loadSpaces();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(spacesChannel);
      };
    }
  }, [userId]);

  // Load space members when current space changes
  useEffect(() => {
    if (currentSpace && userId) {
      loadSpaceMembers();
    }
  }, [currentSpace, userId]);

  const loadSpaceMembers = async () => {
    if (!currentSpace || !userId) return;
    
    try {
      console.log('Loading space members for space:', currentSpace.id);
      
      // Load space memberships first
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('space_memberships')
        .select('*')
        .eq('space_id', currentSpace.id)
        .eq('status', 'approved');

      if (membershipsError) throw membershipsError;

      // Get user profiles separately
      const userIds = membershipsData?.map(m => m.user_id) || [];
      let userProfiles: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        userProfiles = profilesData || [];
      }

      // Transform the data
      const transformedMembers = (membershipsData || []).map(membership => {
        const userProfile = userProfiles.find(p => p.id === membership.user_id);
        return {
          id: membership.id,
          userId: membership.user_id,
          role: membership.role,
          status: membership.status,
          createdAt: membership.created_at,
          updatedAt: membership.updated_at,
          userName: userProfile?.full_name || 'Unknown',
          userEmail: userProfile?.email || 'Unknown',
        };
      });

      setSpaceMembers(transformedMembers);
      console.log('Space members loaded:', transformedMembers.length);
    // If user is not currently a member and has an approved request, 
    // treat it as null so they can request to join again
    if (request.status === 'approved' && !isMember(spaceId)) {
      return null;
    }
    
    } catch (err) {
      console.error('Error loading space members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load space members');
    }
  };
  const loadSpaces = async () => {
    if (!userId) {
      setLoading(false);
      return;
      
      // If rejection is older than 7 days, allow new request
      return null;
    }
    
    try {
      setError(null);
      console.log('Loading spaces for user:', userId);
      
      // Load all public spaces
      const { data: publicSpacesData, error: publicSpacesError } = await supabase
        .from('spaces')
        .select('*')
        .eq('is_public', true);

      if (publicSpacesError) throw publicSpacesError;
      console.log('Public spaces loaded:', publicSpacesData?.length || 0);

      // Load user's owned spaces
      const { data: userSpacesData, error: userSpacesError } = await supabase
        .from('spaces')
        .select('*')
        .eq('owner_id', userId);

      if (userSpacesError) throw userSpacesError;
      console.log('User owned spaces loaded:', userSpacesData?.length || 0);

      // Load user's memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('space_memberships')
        .select('space_id')
        .eq('user_id', userId)
        .eq('status', 'approved');

      if (membershipsError) throw membershipsError;
      console.log('User memberships loaded:', membershipsData?.length || 0);

      // Add member spaces to user spaces
      let memberSpaces: any[] = [];
      if (membershipsData && membershipsData.length > 0) {
        const memberSpaceIds = membershipsData.map(m => m.space_id);
        const { data: memberSpacesData, error: memberSpacesError } = await supabase
          .from('spaces')
          .select('*')
          .in('id', memberSpaceIds);

        if (memberSpacesError) throw memberSpacesError;
        memberSpaces = memberSpacesData || [];
        console.log('Member spaces loaded:', memberSpaces.length);
      }

      // Combine owned and member spaces
      const allUserSpaces = [...(userSpacesData || []), ...memberSpaces]
        .filter((space, index, self) => self.findIndex(s => s.id === space.id) === index);
      
      setUserSpaces(allUserSpaces.map(convertDatabaseSpace));
      console.log('Total user spaces:', allUserSpaces.length);

      // Combine all spaces for the spaces list
      const allSpaces = [...(publicSpacesData || []), ...(userSpacesData || [])]
        .filter((space, index, self) => self.findIndex(s => s.id === space.id) === index);

      // Load join requests made by user
      const { data: joinRequestsData, error: joinRequestsError } = await supabase
        .from('join_requests')
        .select('*')
        .eq('user_id', userId);

      if (joinRequestsError) throw joinRequestsError;

      // Load pending requests for spaces owned by user
      let pendingRequestsData: any[] = [];
      const ownedSpaceIds = allUserSpaces.filter(s => s.owner_id === userId).map(s => s.id);
      
      if (ownedSpaceIds.length > 0) {
        // First get the join requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('join_requests')
          .select('*')
          .eq('status', 'pending')
          .in('space_id', ownedSpaceIds);

        if (requestsError) throw requestsError;

        // Then get user profiles for those requests
        if (requestsData && requestsData.length > 0) {
          const userIds = requestsData.map(r => r.user_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .in('id', userIds);

          if (profilesError) throw profilesError;

          // Combine the data
          pendingRequestsData = requestsData.map(request => ({
            ...request,
            userProfile: profilesData?.find(p => p.id === request.user_id) || { full_name: 'Unknown', email: 'Unknown' }
          }));
        }
      }


      // Get member counts for each space
      const spaceIds = allSpaces.map(s => s.id);
      let memberCounts: any[] = [];
      if (spaceIds.length > 0) {
        const { data: memberCountsData, error: memberCountsError } = await supabase
          .from('space_memberships')
          .select('space_id')
          .eq('status', 'approved')
          .in('space_id', spaceIds);

        if (memberCountsError) throw memberCountsError;
        memberCounts = memberCountsData || [];
      }

      // Get owner names
      const ownerIds = [...new Set(allSpaces.map(s => s.owner_id))];
      let ownerProfiles: any[] = [];
      if (ownerIds.length > 0) {
        const { data: ownerProfilesData, error: ownerProfilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', ownerIds);

        if (ownerProfilesError) throw ownerProfilesError;
        ownerProfiles = ownerProfilesData || [];
      }

      // Combine data
      const spacesWithStats: SpaceWithStats[] = allSpaces.map(space => {
        const memberCount = memberCounts.filter(m => m.space_id === space.id).length;
        const owner = ownerProfiles?.find(p => p.id === space.owner_id);
        
        return {
          id: space.id,
          name: space.name,
          description: space.description,
          ownerId: space.owner_id,
          isPublic: space.is_public,
          createdAt: space.created_at,
          updatedAt: space.updated_at,
          userName: owner?.full_name || 'Unknown',
          ownerName: owner?.full_name || 'Unknown',
          memberCount,
        };
      });

      const convertedJoinRequests: JoinRequest[] = (joinRequestsData || []).map(request => ({
        id: request.id,
        spaceId: request.space_id,
        userId: request.user_id,
        message: request.message,
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      }));

      const convertedPendingRequests: JoinRequestWithUser[] = (pendingRequestsData || []).map(request => ({
        id: request.id,
        spaceId: request.space_id,
        userId: request.user_id,
        message: request.message,
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        userName: request.userProfile.full_name || 'Unknown',
        userEmail: request.userProfile.email || 'Unknown',
      }));

      setSpaces(spacesWithStats);
      setJoinRequests(convertedJoinRequests);
      setPendingRequests(convertedPendingRequests);
      console.log('Spaces loading completed successfully');
    } catch (err) {
      console.error('Error loading spaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load spaces');
    } finally {
      setLoading(false);
    }
  };

  const convertDatabaseSpace = (dbSpace: any): Space => ({
    id: dbSpace.id,
    name: dbSpace.name,
    description: dbSpace.description,
    ownerId: dbSpace.owner_id,
    isPublic: dbSpace.is_public,
    createdAt: dbSpace.created_at,
    updatedAt: dbSpace.updated_at,
  });

  const createSpace = async (spaceData: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert([{
          name: spaceData.name,
          description: spaceData.description,
          owner_id: userId,
          is_public: spaceData.isPublic,
        }])
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Create owner membership
      const { error: membershipError } = await supabase
        .from('space_memberships')
        .insert([{
          space_id: space.id,
          user_id: userId,
          role: 'owner',
          status: 'approved',
        }]);

      if (membershipError) throw membershipError;

      await loadSpaces();
      return space;
    } catch (err) {
      console.error('Error creating space:', err);
      throw err;
    }
  };

  const joinSpace = async (spaceId: string, message?: string) => {
    try {
      const { error } = await supabase
        .from('join_requests')
        .insert([{
          space_id: spaceId,
          user_id: userId,
          message,
        }]);

      if (error) throw error;
      await loadSpaces();
    } catch (err) {
      throw err;
    }
  };

  const approveJoinRequest = async (requestId: string, role: 'caster' | 'observer') => {
    try {
      // Get the request details
      const { data: request, error: requestError } = await supabase
        .from('join_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Create membership
      const { error: membershipError } = await supabase
        .from('space_memberships')
        .insert([{
          space_id: request.space_id,
          user_id: request.user_id,
          role,
          status: 'approved',
        }]);

      if (membershipError) throw membershipError;

      // Update request status
      const { error: updateError } = await supabase
        .from('join_requests')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      await loadSpaces();
    } catch (err) {
      throw err;
    }
  };

  const rejectJoinRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('join_requests')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      await loadSpaces();
    } catch (err) {
      throw err;
    }
  };

  const updateSpace = async (spaceId: string, updates: {
    isPublic?: boolean;
    name?: string;
    description?: string;
  }) => {
    try {
      const updateData: any = {};
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;

      const { error } = await supabase
        .from('spaces')
        .update(updateData)
        .eq('id', spaceId);

      if (error) throw error;
      await loadSpaces();
    } catch (err) {
      throw err;
    }
  };

  const updateMemberRole = async (membershipId: string, newRole: 'caster' | 'observer') => {
    try {
      const { error } = await supabase
        .from('space_memberships')
        .update({ role: newRole })
        .eq('id', membershipId);

      if (error) throw error;
      await loadSpaces();
      await loadSpaceMembers();
    } catch (err) {
      throw err;
    }
  };

  const removeMember = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('space_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
      await loadSpaces();
      await loadSpaceMembers();
    } catch (err) {
      throw err;
    }
  };

  const selectSpace = (spaceId: string) => {
    if (spaceId === '') {
      // Clear current space
      setCurrentSpace(null);
      localStorage.removeItem('currentSpaceId');
    } else {
      const space = userSpaces.find(s => s.id === spaceId);
      if (space) {
        setCurrentSpace(space);
        localStorage.setItem('currentSpaceId', spaceId);
      }
    }
  };

  // Load current space from localStorage on mount
  useEffect(() => {
    if (userSpaces.length > 0) {
      const savedSpaceId = localStorage.getItem('currentSpaceId');
      // Only load saved space if user has access to it
      if (savedSpaceId && userSpaces.some(space => space.id === savedSpaceId)) {
        selectSpace(savedSpaceId);
      } else {
        // Clear invalid space from localStorage
        localStorage.removeItem('currentSpaceId');
        setCurrentSpace(null);
      }
    }
  }, [userSpaces]);

  return {
    spaces,
    userSpaces,
    joinRequests,
    pendingRequests,
    spaceMembers,
    currentSpace,
    loading,
    error,
    createSpace,
    joinSpace,
    approveJoinRequest,
    rejectJoinRequest,
    updateMemberRole,
    removeMember,
    updateSpace,
    selectSpace,
    refreshSpaces: loadSpaces,
    refreshSpaceMembers: loadSpaceMembers,
  };
}