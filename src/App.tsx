import { SpaceSettingsModal } from './components/SpaceSettingsModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { SpaceBrandingModal } from './components/SpaceBrandingModal';
import { DiscordIntegrationModal } from './components/DiscordIntegrationModal';
import { useSpaceAssets } from './hooks/useSpaceAssets';
import { SpaceBrandingModal } from './components/SpaceBrandingModal';
import { DiscordIntegrationModal } from './components/DiscordIntegrationModal';
import { useSpaceAssets } from './hooks/useSpaceAssets';
import { formatDate, getWeekDates } from './utils/dateUtils';
import { Settings, UserPlus, LogOut, Bell, Image, MessageSquare } from 'lucide-react';
import { Staff, TimeSlot } from './types';

export default function App() {
  // ... existing code ...
  
  const {
    refreshCredits,
  } = useCreditsData(currentSpace?.id);

  // UI State
  const [activeTab, setActiveTab] = useState<'availability' | 'streams' | 'credits' | 'members'>('availability');
  // ... existing state ...
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [showSpaceSettingsModal, setShowSpaceSettingsModal] = useState(false);

  // Derived state
  // ... existing code ...
  // Event handlers
  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const handleToday = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    setCurrentWeekStart(monday);
  };

  const handleTimeSlotClick = (staffId: string, date: string, time: string) => {
    setSelectedTimeSlot({ staffId, date, time });
    setShowAvailabilityForm(true);
  };

  const handleSaveAvailability = async (slot: Omit<TimeSlot, 'id'>) => {
    try {
      await saveAvailability(slot);
      setShowAvailabilityForm(false);
      setSelectedTimeSlot(null);
    } catch (error) {
      console.error('Failed to save availability:', error);
      alert('Failed to save availability. Please try again.');
    }
  };

  const handleAddStaff = async (newStaff: Omit<Staff, 'id'>) => {
    try {
      await addStaff(newStaff);
    } catch (error) {
      console.error('Failed to add staff:', error);
      alert('Failed to add staff member. Please try again.');
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      try {
        await removeStaff(staffId);
        if (selectedStaffId === staffId) {
          setSelectedStaffId('');
        }
      } catch (error) {
        console.error('Failed to remove staff:', error);
        alert('Failed to remove staff member. Please try again.');
      }
    }
  };

  const handleCreateStream = async (streamData: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    casters: string[];
    observers: string[];
  }) => {
    try {
      await createStream(streamData);
    } catch (error) {
      console.error('Failed to create stream:', error);
      alert('Failed to create stream. Please try again.');
    }
  };

  const handleUpdateRSVP = async (streamId: string, staffId: string, status: 'attending' | 'not_attending' | 'maybe', notes?: string) => {
    try {
      await updateRSVP(streamId, staffId, status, notes);
    } catch (error) {
      console.error('Failed to update RSVP:', error);
      throw error; // Re-throw to let the component handle the error display
    }
  };

  const handleUpdateStreamStatus = async (streamId: string, status: 'scheduled' | 'live' | 'completed' | 'cancelled', streamLink?: string) => {
    try {
      const streamData = await updateStreamStatus(streamId, status, streamLink);
      
      // Award credits if stream is completed
      if (status === 'completed' && streamData?.stream_assignments) {
        const casterIds = streamData.stream_assignments
          .filter((a: any) => a.role === 'caster')
          .map((a: any) => a.staff_id);
        
        if (casterIds.length > 0) {
          try {
            await awardStreamCredits(streamId, casterIds);
          } catch (creditsError) {
            console.error('Failed to award credits:', creditsError);
            // Don't fail the stream completion, just log the error
          }
        }
      }
    } catch (error) {
      console.error('Failed to update stream status:', error);
      throw error;
    }
  };

  const handleAdjustCredits = async (staffId: string, amount: number, reason: string) => {
    try {
      await adjustCredits(staffId, amount, reason);
    } catch (error) {
      console.error('Failed to adjust credits:', error);
      throw error;
    }
  };

  const handleApproveJoinRequest = async (requestId: string, role: 'caster' | 'observer') => {
    try {
      await approveJoinRequest(requestId, role);
    } catch (error) {
      console.error('Failed to approve join request:', error);
      alert('Failed to approve join request. Please try again.');
    }
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    try {
      await rejectJoinRequest(requestId);
    } catch (error) {
      console.error('Failed to reject join request:', error);
      alert('Failed to reject join request. Please try again.');
    }
  };

  const handleUpdateMemberRole = async (membershipId: string, newRole: 'caster' | 'observer') => {
    try {
      await updateMemberRole(membershipId, newRole);
    } catch (error) {
      console.error('Failed to update member role:', error);
      alert('Failed to update member role. Please try again.');
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    try {
      await removeMember(membershipId);
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  const handleUpdateSpace = async (spaceId: string, updates: { isPublic?: boolean; name?: string; description?: string }) => {
    try {
      await updateSpace(spaceId, updates);
    } catch (error) {
      console.error('Failed to update space:', error);
      throw error;
    }
  };

  // Get current slot for the form
  const getCurrentSlot = (): TimeSlot | undefined => {
    if (!selectedTimeSlot) return undefined;
    const staffSlots = availability[selectedTimeSlot.staffId] || [];
    return staffSlots.find(slot => 
      slot.date === selectedTimeSlot.date && 
      slot.startTime === selectedTimeSlot.time
    );
  };

  const getSelectedStaff = (): Staff | undefined => {
    if (!selectedTimeSlot) return undefined;
    return staff?.find(s => s.id === selectedTimeSlot.staffId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        onSignIn={signIn}
        onSignUp={signUp}
        onModeChange={setMode}
        error={authError}
      />
    );
  }

  // Show space selector if no current space is selected
  if (!currentSpace) {
    return (
      <SpaceSelector
        spaces={spaces || []}
        userSpaces={userSpaces || []}
        joinRequests={joinRequests || []}
        isAdmin={isAdmin}
        onCreateSpace={createSpace}
        onSelectSpace={selectSpace}
        onJoinSpace={joinSpace}
        loading={spacesLoading}
        onSignOut={signOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="bg-gray-900/95 backdrop-blur-sm shadow-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {currentSpace.name}
                </h1>
              </div>
              
              <button
                onClick={() => selectSpace('')}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Switch Space
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {isSpaceOwner && (
                <button
                  onClick={() => setShowJoinRequestsModal(true)}
                  className="relative p-2 text-gray-300 hover:text-white transition-colors"
                  title="Join Requests"
                >
                  <Bell className="w-5 h-5" />
                  {hasJoinRequests && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                      {pendingRequests?.length || 0}
                    </span>
                  )}
                </button>
              )}
              {isSpaceOwner && (
                <button
                  onClick={() => setShowSpaceSettingsModal(true)}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  title="Space Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <span className="text-sm text-gray-300">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(spacesError || dataError || streamsError || creditsError) && (
          <div className="mb-6">
            <ErrorMessage 
              message={spacesError || dataError || streamsError || creditsError || 'An error occurred'} 
              onRetry={() => {
                refreshSpaces();
                refreshData();
                refreshStreams();
                refreshCredits();
              }}
            />
          </div>
        )}

        <MainTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSpaceOwner={isSpaceOwner}
        />

        {activeTab === 'availability' && (
          <div className="space-y-6">
            <WeekNavigator
              currentWeekStart={currentWeekStart}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
              onToday={handleToday}
            />

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveRole('caster')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeRole === 'caster'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Casters
              </button>
              <button
                onClick={() => setActiveRole('observer')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeRole === 'observer'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Observers
              </button>
            </div>

            {isSpaceOwner && (
              <StaffManager
                staff={staff || []}
                activeRole={activeRole}
                onAddStaff={handleAddStaff}
                onRemoveStaff={handleRemoveStaff}
                selectedStaffId={selectedStaffId}
                onSelectStaff={setSelectedStaffId}
              />
            )}

            <AvailabilityCalendar
              staff={staff || []}
              activeRole={activeRole}
              availability={availability || {}}
              weekDates={weekDates}
              onTimeSlotClick={handleTimeSlotClick}
            />
          </div>
        )}

        {activeTab === 'streams' && (
          <StreamsView
            streams={streams || []}
            staff={staff || []}
            onCreateStream={handleCreateStream}
            onUpdateRSVP={handleUpdateRSVP}
            onUpdateStreamStatus={handleUpdateStreamStatus}
            onDeleteStream={deleteStream}
            isSpaceOwner={isSpaceOwner}
          />
        )}

        {activeTab === 'credits' && (
          <CreditsView
            staff={staff || []}
            credits={credits || []}
            transactions={transactions || []}
            onAdjustCredits={handleAdjustCredits}
            isSpaceOwner={isSpaceOwner}
          />
        )}

        {activeTab === 'members' && isSpaceOwner && (
          <MembersView
            members={spaceMembers || []}
            staff={staff || []}
            onUpdateMemberRole={handleUpdateMemberRole}
            onRemoveMember={handleRemoveMember}
            onUpdateStaffRole={(staffId, newRole) => {
              // This would need to be implemented to update staff roles
              console.log('Update staff role:', staffId, newRole);
            }}
            onRemoveStaff={handleRemoveStaff}
          />
        )}

        {/* Modals */}
        {showAvailabilityForm && selectedTimeSlot && getSelectedStaff() && (
          <StaffAvailabilityForm
            staff={getSelectedStaff()!}
            selectedDate={selectedTimeSlot.date}
            selectedTime={selectedTimeSlot.time}
            currentSlot={getCurrentSlot()}
            onSave={handleSaveAvailability}
            onClose={() => {
              setShowAvailabilityForm(false);
              setSelectedTimeSlot(null);
            }}
          />
        )}

        {showJoinRequestsModal && (
          <JoinRequestsModal
            requests={pendingRequests || []}
            onApprove={handleApproveJoinRequest}
            onReject={handleRejectJoinRequest}
            onClose={() => setShowJoinRequestsModal(false)}
          />
        )}

        {showSpaceSettingsModal && currentSpace && (
          <SpaceSettingsModal
            space={currentSpace}
            onUpdateSpace={handleUpdateSpace}
            onClose={() => setShowSpaceSettingsModal(false)}
          />
        )}
      </main>
    </div>
  );
}