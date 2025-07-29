// src/hooks/useSpaces.ts

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

  // ... (existing useEffects and loadSpaceMembers function)

  const loadSpaces = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      console.log('loadSpaces: Starting to load spaces for user:', userId); // Added log
      
      // Load all public spaces
      const { data: publicSpacesData, error: publicSpacesError } = await supabase
        .from('spaces')
        .select('*')
        .eq('is_public', true);

      if (publicSpacesError) throw publicSpacesError;
      console.log('loadSpaces: Public spaces loaded:', publicSpacesData?.length || 0); // Added log

      // Load user's owned spaces
      const { data: userSpacesData, error: userSpacesError } = await supabase
        .from('spaces')
        .select('*')
        .eq('owner_id', userId);

      if (userSpacesError) throw userSpacesError;
      console.log('loadSpaces: User owned spaces loaded:', userSpacesData?.length || 0); // Added log

      // Load user's memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('space_memberships')
        .select('space_id')
        .eq('user_id', userId)
        .eq('status', 'approved');

      if (membershipsError) throw membershipsError;
      console.log('loadSpaces: User memberships loaded (approved only):', membershipsData?.length || 0); // Added log

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
        console.log('loadSpaces: Member spaces loaded:', memberSpaces.length); // Added log
      }

      // Combine owned and member spaces
      const allUserSpaces = [...(userSpacesData || []), ...memberSpaces]
        .filter((space, index, self) => self.findIndex(s => s.id === space.id) === index);
      
      setUserSpaces(allUserSpaces.map(convertDatabaseSpace));
      console.log('loadSpaces: Total user spaces (after set):', allUserSpaces.length); // Added log

      // ... (rest of loadSpaces function)

      setSpaces(spacesWithStats);
      setJoinRequests(convertedJoinRequests);
      setPendingRequests(convertedPendingRequests);
      console.log('loadSpaces: Spaces loading completed successfully'); // Added log
    } catch (err) {
      console.error('loadSpaces: Error loading spaces:', err); // Added log
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

  // Add this helper function for debugging isMember
  const isMember = (spaceId: string) => {
    const memberStatus = userSpaces.some(space => space.id === spaceId);
    console.log(`isMember(${spaceId}): Checking if user is member. Result: ${memberStatus}. Current userSpaces:`, userSpaces);
    return memberStatus;
  };

  const getJoinRequestStatus = (spaceId: string) => {
    const request = joinRequests.find(request => request.spaceId === spaceId);

    console.log(`getJoinRequestStatus(${spaceId}): Found request:`, request);
    console.log(`getJoinRequestStatus(${spaceId}): isMember check result:`, isMember(spaceId));

    if (!request) {
      console.log(`getJoinRequestStatus(${spaceId}): No request found, returning null.`);
      return null;
    }

    // Case 1: Request is pending
    if (request.status === 'pending') {
      console.log(`getJoinRequestStatus(${spaceId}): Request is pending, returning 'pending'.`);
      return 'pending';
    }

    // Case 2: Request was rejected
    if (request.status === 'rejected') {
      const rejectionDate = new Date(request.updatedAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (rejectionDate > sevenDaysAgo) {
        console.log(`getJoinRequestStatus(${spaceId}): Request rejected within 7 days, returning 'rejected'.`);
        return 'rejected';
      } else {
        console.log(`getJoinRequestStatus(${spaceId}): Request rejected more than 7 days ago, returning null.`);
        return null;
      }
    }

    // Case 3: Request was approved
    if (request.status === 'approved') {
      if (!isMember(spaceId)) {
        // User is approved in join_requests but NOT a member in userSpaces (was kicked)
        console.log(`getJoinRequestStatus(${spaceId}): Request approved but user not a member, returning null.`);
        return null;
      } else {
        // User is approved AND is a member, so they can open the space.
        console.log(`getJoinRequestStatus(${spaceId}): Request approved and user is a member, returning 'approved'.`);
        return 'approved';
      }
    }

    // Fallback, should ideally not be reached if all statuses are handled
    console.warn(`getJoinRequestStatus(${spaceId}): Reached unexpected state, returning null.`);
    return null;
  };

  const createSpace = async (spaceData: { name: string; description?: string; isPublic: boolean }) => {
    if (!userId) throw new Error('User must be logged in to create a space');

    try {
      // Create the space
      const { data: spaceResult, error: spaceError } = await supabase
        .from('spaces')
        .insert({
          name: spaceData.name,
          description: spaceData.description,
          owner_id: userId,
          is_public: spaceData.isPublic,
        })
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Create membership for the owner
      const { error: membershipError } = await supabase
        .from('space_memberships')
        .insert({
          space_id: spaceResult.id,
          user_id: userId,
          role: 'owner',
          status: 'approved',
        });

      if (membershipError) throw membershipError;

      // Refresh spaces data
      await loadSpaces();

      // Select the newly created space
      const newSpace = convertDatabaseSpace(spaceResult);
      setCurrentSpace(newSpace);

      return newSpace;
    } catch (err) {
      console.error('Failed to create space:', err);
      throw err;
    }
  };

  const joinSpace = async (spaceId: string, message?: string) => {
    if (!userId) throw new Error('User must be logged in to join a space');

    try {
      const { error } = await supabase
        .from('join_requests')
        .insert({
          space_id: spaceId,
          user_id: userId,
          message: message || '',
          status: 'pending',
        });

      if (error) throw error;
      await loadSpaces();
    } catch (err) {
      console.error('Failed to join space:', err);
      throw err;
    }
  };

  const approveJoinRequest = async (requestId: string) => {
    try {
      // Get the join request details
      const { data: request, error: requestError } = await supabase
        .from('join_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Update the join request status
      const { error: updateError } = await supabase
        .from('join_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create space membership
      const { error: membershipError } = await supabase
        .from('space_memberships')
        .insert({
          space_id: request.space_id,
          user_id: request.user_id,
          role: 'caster',
          status: 'approved',
        });

      if (membershipError) throw membershipError;

      await loadSpaces();
    } catch (err) {
      console.error('Failed to approve join request:', err);
      throw err;
    }
  };

  const rejectJoinRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      await loadSpaces();
    } catch (err) {
      console.error('Failed to reject join request:', err);
      throw err;
    }
  };

  const updateSpace = async (spaceId: string, updates: Partial<Space>) => {
    try {
      const { error } = await supabase
        .from('spaces')
        .update({
          name: updates.name,
          description: updates.description,
          is_public: updates.isPublic,
        })
        .eq('id', spaceId);

      if (error) throw error;
      await loadSpaces();
    } catch (err) {
      console.error('Failed to update space:', err);
      throw err;
    }
  };

  const updateMemberRole = async (membershipId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('space_memberships')
        .update({ role: newRole })
        .eq('id', membershipId);

      if (error) throw error;
      await loadSpaces();
      await loadSpaceMembers();
    } catch (err) {
      console.error('Failed to update member role:', err);
      throw err;
    }
  };

  const removeMember = async (membershipId: string) => {
    try {
      console.log('removeMember: Attempting to remove membership:', membershipId); // Added log
      const { error } = await supabase
        .from('space_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) {
        console.error('removeMember: Error deleting membership:', error); // Added log
        throw error;
      }
      console.log('removeMember: Membership deleted successfully. Reloading spaces...'); // Added log
      await loadSpaces(); // This should refresh userSpaces
      await loadSpaceMembers();
      console.log('removeMember: Spaces and members reloaded after removal.'); // Added log
    } catch (err) {
      console.error('removeMember: Failed to remove member:', err); // Added log
      throw err;
    }
  };

  const selectSpace = (space: Space) => {
    setCurrentSpace(space);
  };

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