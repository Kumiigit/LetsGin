import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { SpaceSelector } from './components/SpaceSelector';
import { AuthForm } from './components/AuthForm';
import { MainTabs } from './components/MainTabs';
import { WeekNavigator } from './components/WeekNavigator';
import { AvailabilityCalendar } from './components/AvailabilityCalendar';
import { StaffManager } from './components/StaffManager';
import { StaffAvailabilityForm } from './components/StaffAvailabilityForm';
import { StreamsView } from './components/StreamsView';
import { CreditsView } from './components/CreditsView';
import { MembersView } from './components/MembersView';
import { JoinRequestsModal } from './components/JoinRequestsModal';
import { SpaceSettingsModal } from './components/SpaceSettingsModal';
import { SpaceBrandingModal } from './components/SpaceBrandingModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { useAuth } from './hooks/useAuth';
import { useSpaces } from './hooks/useSpaces';
import { useSupabaseData } from './hooks/useSupabaseData';
import { useStreamsData } from './hooks/useStreamsData';
import { useCreditsData } from './hooks/useCreditsData';
import { getWeekDates } from './utils/dateUtils';
import { Staff, TimeSlot } from './types';
import { Settings, Users, ArrowLeft, UserPlus, Image } from 'lucide-react';

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const {
    spaces,
    userSpaces,
    joinRequests,
    pendingRequests,
    spaceMembers,
    currentSpace,
    loading: spacesLoading,
    createSpace,
    joinSpace,
    selectSpace,
    approveJoinRequest,
    rejectJoinRequest,
    updateMemberRole,
    removeMember,
    updateSpace,
  } = useSpaces(user?.id);

  const {
    staff,
    availability,
    loading: dataLoading,
    error: dataError,
    addStaff,
    removeStaff,
    saveAvailability,
    refreshData,
  } = useSupabaseData(currentSpace?.id);

  const {
    streams,
    loading: streamsLoading,
    error: streamsError,
    createStream,
    updateRSVP,
    updateStreamStatus,
    deleteStream,
  } = useStreamsData(currentSpace?.id);

  const {
    credits,
    transactions,
    loading: creditsLoading,
    error: creditsError,
    adjustCredits,
    awardStreamCredits,
  } = useCreditsData(currentSpace?.id);

  const [activeTab, setActiveTab] = useState<'availability' | 'streams' | 'credits' | 'members'>('availability');
  const [activeRole, setActiveRole] = useState<'caster' | 'observer'>('caster');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday;
  });
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    staffId: string;
    date: string;
    time: string;
  } | null>(null);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [showSpaceSettings, setShowSpaceSettings] = useState(false);
  const [showSpaceBranding, setShowSpaceBranding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin/owner of current space
  useEffect(() => {
    if (user && currentSpace) {
      setIsAdmin(currentSpace.ownerId === user.id);
    } else {
      setIsAdmin(false);
    }
  }, [user, currentSpace]);

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    const { user: newUser, error } = await signUp(email, password);
    if (error) throw error;

    if (newUser?.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: newUser.user.id,
          email: newUser.user.email,
          full_name: fullName,
        }]);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
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
      throw error;
    }
  };

  const handleUpdateStreamStatus = async (
    streamId: string,
    status: 'scheduled' | 'live' | 'completed' | 'cancelled',
    streamLink?: string
  ) => {
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
            console.log('Credits awarded successfully');
          } catch (creditsError) {
            console.error('Failed to award credits:', creditsError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update stream status:', error);
      throw error;
    }
  };

  const handleUpdateStaffRole = async (staffId: string, newRole: 'caster' | 'observer') => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .update({ role: newRole })
        .eq('id', staffId);

      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Failed to update staff role:', error);
      throw error;
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    try {
      await removeStaff(staffId);
    } catch (error) {
      console.error('Failed to remove staff:', error);
      throw error;
    }
  };

  const weekDates = getWeekDates(currentWeekStart);

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

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    setCurrentWeekStart(monday);
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
    return <AuthForm onSignIn={signIn} onSignUp={handleSignUp} />;
  }

  // Show space selector if no space is selected
  if (!currentSpace) {
    return (
      <SpaceSelector
        spaces={spaces || []}
        userSpaces={userSpaces || []}
        joinRequests={joinRequests || []}
        isAdmin={true}
        onCreateSpace={createSpace}
        onSelectSpace={selectSpace}
        onJoinSpace={joinSpace}
        loading={spacesLoading}
        onSignOut={signOut}
      />
    );
  }

  if (dataLoading || streamsLoading || creditsLoading) {
    return <LoadingSpinner message="Loading space data..." />;
  }

  if (dataError || streamsError || creditsError) {
    return (
      <ErrorMessage
        message={dataError || streamsError || creditsError || 'An error occurred'}
        onRetry={refreshData}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-effect shadow-2xl border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => selectSpace('')}
                className="professional-button flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                title="Back to Spaces"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{currentSpace.name}</h1>
                {currentSpace.description && (
                  <p className="text-sm text-gray-300">{currentSpace.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {pendingRequests.length > 0 && isAdmin && (
                <button
                  onClick={() => setShowJoinRequestsModal(true)}
                  className="professional-button relative flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Join Requests
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                </button>
              )}
              
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowSpaceBranding(true)}
                    className="professional-button flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    title="Space Branding"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowSpaceSettings(true)}
                    className="professional-button flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    title="Space Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              )}
              
              <button
                onClick={signOut}
                className="professional-button px-3 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <MainTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isSpaceOwner={isAdmin}
            />

            {activeTab === 'availability' && (
              <>
                <StaffManager
                  staff={staff}
                  activeRole={activeRole}
                  onAddStaff={addStaff}
                  onRemoveStaff={removeStaff}
                  selectedStaffId={selectedStaffId}
                  onSelectStaff={setSelectedStaffId}
                />
                
                <WeekNavigator
                  currentWeekStart={currentWeekStart}
                  onPreviousWeek={handlePreviousWeek}
                  onNextWeek={handleNextWeek}
                  onToday={handleToday}
                />
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveRole('caster')}
                    className={`professional-button px-4 py-2 rounded-lg transition-colors ${
                      activeRole === 'caster'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Casters
                  </button>
                  <button
                    onClick={() => setActiveRole('observer')}
                    className={`professional-button px-4 py-2 rounded-lg transition-colors ${
                      activeRole === 'observer'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Observers
                  </button>
                </div>

                <AvailabilityCalendar
                  staff={staff}
                  activeRole={activeRole}
                  availability={availability}
                  weekDates={weekDates}
                  onTimeSlotClick={handleTimeSlotClick}
                />
              </>
            )}

            {activeTab === 'streams' && (
              <StreamsView
                streams={streams}
                staff={staff}
                onCreateStream={handleCreateStream}
                onUpdateRSVP={updateRSVP}
                onUpdateStreamStatus={handleUpdateStreamStatus}
                onDeleteStream={deleteStream}
                isSpaceOwner={isAdmin}
              />
            )}

            {activeTab === 'credits' && (
              <CreditsView
                staff={staff}
                credits={credits}
                transactions={transactions}
                onAdjustCredits={adjustCredits}
                isSpaceOwner={isAdmin}
              />
            )}

            {activeTab === 'members' && isAdmin && (
              <MembersView
                members={spaceMembers}
                staff={staff}
                onUpdateMemberRole={updateMemberRole}
                onRemoveMember={removeMember}
                onUpdateStaffRole={handleUpdateStaffRole}
                onRemoveStaff={handleRemoveStaff}
              />
            )}
          </div>

        </div>
      </main>

      {/* Modals */}
      {showAvailabilityForm && selectedTimeSlot && (
        <StaffAvailabilityForm
          staff={staff.find(s => s.id === selectedTimeSlot.staffId)!}
          selectedDate={selectedTimeSlot.date}
          selectedTime={selectedTimeSlot.time}
          currentSlot={availability[selectedTimeSlot.staffId]?.find(slot => 
            slot.date === selectedTimeSlot.date && 
            slot.startTime <= selectedTimeSlot.time && 
            slot.endTime > selectedTimeSlot.time
          )}
          onSave={handleSaveAvailability}
          onClose={() => {
            setShowAvailabilityForm(false);
            setSelectedTimeSlot(null);
          }}
        />
      )}

      {showJoinRequestsModal && (
        <JoinRequestsModal
          requests={pendingRequests}
          onApprove={approveJoinRequest}
          onReject={rejectJoinRequest}
          onClose={() => setShowJoinRequestsModal(false)}
        />
      )}

      {showSpaceSettings && currentSpace && (
        <SpaceSettingsModal
          space={currentSpace}
          onUpdateSpace={updateSpace}
          onClose={() => setShowSpaceSettings(false)}
        />
      )}

      {showSpaceBranding && currentSpace && (
        <SpaceBrandingModal
          space={currentSpace}
          onClose={() => setShowSpaceBranding(false)}
        />
      )}
    </div>
  );
};

export default App;