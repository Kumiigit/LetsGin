import React, { useState } from 'react';
import { Plus, Users, Globe, Lock, ArrowRight, MessageSquare, LogOut, Image } from 'lucide-react';
import { Space, SpaceWithStats, JoinRequest } from '../types';
import { useSpaceAssets } from '../hooks/useSpaceAssets';

interface SpaceSelectorProps {
  spaces: SpaceWithStats[];
  userSpaces: Space[];
  joinRequests: JoinRequest[];
  isAdmin: boolean;
  onCreateSpace: (space: { name: string; description?: string; isPublic: boolean }) => void;
  onSelectSpace: (spaceId: string) => void;
  onJoinSpace: (spaceId: string, message?: string) => void;
  loading: boolean;
  onSignOut: () => void;
}

export const SpaceSelector: React.FC<SpaceSelectorProps> = ({
  spaces,
  userSpaces,
  joinRequests,
  isAdmin,
  onCreateSpace,
  onSelectSpace,
  onJoinSpace,
  loading,
  onSignOut,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState<string | null>(null);
  const [newSpace, setNewSpace] = useState({
    name: '',
    description: '',
    isPublic: true,
    adminPassword: '',
  });
  const [joinMessage, setJoinMessage] = useState('');

  // Component to display space with assets
  const SpaceCard: React.FC<{ space: SpaceWithStats; onClick: () => void; showJoinButton?: boolean }> = ({ 
    space, 
    onClick, 
    showJoinButton = false 
  }) => {
    const { getAssetByType, getAssetUrl } = useSpaceAssets(space.id);
    const logoAsset = getAssetByType('logo');
    const bannerAsset = getAssetByType('banner');

    return (
      <div className="professional-card rounded-xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
        {/* Banner */}
        {bannerAsset ? (
          <div className="h-32 overflow-hidden">
            <img
              src={getAssetUrl(bannerAsset)}
              alt={`${space.name} banner`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
            <Image className="w-8 h-8 text-gray-600" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            {/* Logo */}
          </div>
        </div>
      </div>
    );
  };
};

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Trophy, Settings, UserPlus, Bell } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useSpaces } from './hooks/useSpaces';
import { useSupabaseData } from './hooks/useSupabaseData';
import { useStreamsData } from './hooks/useStreamsData';
import { useCreditsData } from './hooks/useCreditsData';
import { SpaceSelector } from './components/SpaceSelector';
import { AvailabilityCalendar } from './components/AvailabilityCalendar';
import { StreamsView } from './components/StreamsView';
import { CreditsView } from './components/CreditsView';
import { MembersView } from './components/MembersView';
import { MainTabs } from './components/MainTabs';
import { JoinRequestsModal } from './components/JoinRequestsModal';
import { SpaceSettingsModal } from './components/SpaceSettingsModal';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
  const { user, signOut, AuthComponent } = useAuth();
  const { 
    spaces, 
    userSpaces, 
    joinRequests, 
    selectedSpaceId, 
    isAdmin, 
    loading: spacesLoading,
    error: spacesError,
    createSpace, 
    selectSpace, 
    joinSpace,
    approveJoinRequest,
    rejectJoinRequest
  } = useSpaces();
  
  const [activeTab, setActiveTab] = useState('availability');
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current space data
  const currentSpace = selectedSpaceId ? spaces.find(s => s.id === selectedSpaceId) : null;
  const isSpaceOwner = currentSpace?.ownerId === user?.id;
  const pendingRequests = joinRequests.filter(r => r.spaceId === selectedSpaceId && r.status === 'pending');

  // Initialize data hooks for selected space
  const { 
    staffMembers, 
    availabilitySlots, 
    loading: dataLoading,
    error: dataError,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    addAvailabilitySlot,
    updateAvailabilitySlot,
    deleteAvailabilitySlot
  } = useSupabaseData(selectedSpaceId);

  const {
    streams,
    streamAssignments,
    streamRsvps,
    loading: streamsLoading,
    error: streamsError,
    createStream,
    updateStream,
    deleteStream,
    assignStaffToStream,
    updateStreamRsvp
  } = useStreamsData(selectedSpaceId);

  const {
    staffCredits,
    creditTransactions,
    loading: creditsLoading,
    error: creditsError,
    addCreditTransaction
  } = useCreditsData(selectedSpaceId);

  // Handle errors
  useEffect(() => {
    const errors = [spacesError, dataError, streamsError, creditsError].filter(Boolean);
    if (errors.length > 0) {
      setError(errors[0]);
    } else {
      setError(null);
    }
  }, [spacesError, dataError, streamsError, creditsError]);

  // Show authentication if not logged in
  if (!user) {
    return <AuthComponent />;
  }

  // Show space selector if no space selected
  if (!selectedSpaceId) {
    return (
      <SpaceSelector
        spaces={spaces}
        userSpaces={userSpaces}
        joinRequests={joinRequests}
        isAdmin={isAdmin}
        onCreateSpace={createSpace}
        onSelectSpace={selectSpace}
        onJoinSpace={joinSpace}
        loading={spacesLoading}
        onSignOut={signOut}
      />
    );
  }

  // Show loading state
  if (spacesLoading || dataLoading) {
    return <LoadingSpinner message="Loading space data..." />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="glass-effect shadow-2xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => selectSpace(null)}
                className="professional-button flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Switch Space</span>
              </button>
              <div className="h-6 w-px bg-gray-600" />
              <div>
                <h1 className="text-xl font-bold text-white">{currentSpace?.name}</h1>
                <p className="text-sm text-gray-400">
                  {isSpaceOwner ? 'Owner' : 'Member'} • {staffMembers.length} staff members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSpaceOwner && pendingRequests.length > 0 && (
                <button
                  onClick={() => setShowJoinRequests(true)}
                  className="professional-button relative flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Requests</span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                </button>
              )}
              
              {isSpaceOwner && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="professional-button flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              )}
              
              <button
                onClick={signOut}
                className="professional-button px-3 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <MainTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'availability' && (
          <AvailabilityCalendar
            staffMembers={staffMembers}
            availabilitySlots={availabilitySlots}
            onAddStaff={addStaffMember}
            onUpdateStaff={updateStaffMember}
            onDeleteStaff={deleteStaffMember}
            onAddSlot={addAvailabilitySlot}
            onUpdateSlot={updateAvailabilitySlot}
            onDeleteSlot={deleteAvailabilitySlot}
            isOwner={isSpaceOwner}
            spaceId={selectedSpaceId}
          />
        )}

        {activeTab === 'streams' && (
          <StreamsView
            streams={streams}
            staffMembers={staffMembers}
            streamAssignments={streamAssignments}
            streamRsvps={streamRsvps}
            onCreateStream={createStream}
            onUpdateStream={updateStream}
            onDeleteStream={deleteStream}
            onAssignStaff={assignStaffToStream}
            onUpdateRsvp={updateStreamRsvp}
            isOwner={isSpaceOwner}
            spaceId={selectedSpaceId}
          />
        )}

        {activeTab === 'credits' && (
          <CreditsView
            staffMembers={staffMembers}
            staffCredits={staffCredits}
            creditTransactions={creditTransactions}
            onAddTransaction={addCreditTransaction}
            isOwner={isSpaceOwner}
            spaceId={selectedSpaceId}
          />
        )}

        {activeTab === 'members' && isSpaceOwner && (
          <MembersView
            spaceId={selectedSpaceId}
            spaceName={currentSpace?.name || ''}
          />
        )}
      </main>

      {/* Modals */}
      {showJoinRequests && (
        <JoinRequestsModal
          requests={pendingRequests}
          onApprove={approveJoinRequest}
          onReject={rejectJoinRequest}
          onClose={() => setShowJoinRequests(false)}
        />
      )}

      {showSettings && currentSpace && (
        <SpaceSettingsModal
          space={currentSpace}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;