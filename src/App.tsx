import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { SpaceSelector } from './components/SpaceSelector';
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
import { useSupabaseData } from './hooks/useSupabaseData';
import { useStreamsData } from './hooks/useStreamsData';
import { useCreditsData } from './hooks/useCreditsData';
import { useSpaces } from './components/RoleTabs';
import { formatDate, getWeekDates } from './utils/dateUtils';
import { Staff, TimeSlot } from './types';
import { Settings, UserPlus, Image, ArrowLeft } from 'lucide-react';

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Space management
  const {
    spaces,
    userSpaces,
    joinRequests,
    pendingRequests,
    spaceMembers,
    currentSpace,
    loading: spacesLoading,
    error: spacesError,
    createSpace,
    joinSpace,
    approveJoinRequest,
    rejectJoinRequest,
    updateMemberRole,
    removeMember,
    updateSpace,
    selectSpace,
    refreshSpaces,
    refreshSpaceMembers,
  } = useSpaces(user?.id);

  // Main app state
  const [activeTab, setActiveTab] = useState<'availability' | 'streams' | 'credits' | 'members'>('availability');
  const [activeRole, setActiveRole] = useState<'caster' | 'observer'>('caster');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday;
  });
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    staffId: string;
    date: string;
    time: string;
    currentSlot?: TimeSlot;
  } | null>(null);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [showSpaceSettingsModal, setShowSpaceSettingsModal] = useState(false);
  const [showSpaceBrandingModal, setShowSpaceBrandingModal] = useState(false);

  // Data hooks
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
    refreshStreams,
  } = useStreamsData(currentSpace?.id);

  const {
    credits,
    transactions,
    loading: creditsLoading,
    error: creditsError,
    awardStreamCredits,
    adjustCredits,
    refreshCredits,
  } = useCreditsData(currentSpace?.id);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get user profile to check admin status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          isAdmin: profile?.admin_password === 'MyAdmin',
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              admin_password: adminPassword || null,
            });

          if (profileError) throw profileError;

          setUser({
            id: data.user.id,
            email: data.user.email || '',
            isAdmin: adminPassword === 'MyAdmin',
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Get user profile to check admin status
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          setUser({
            id: data.user.id,
            email: data.user.email || '',
            isAdmin: profile?.admin_password === 'MyAdmin',
          });
        }
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    selectSpace('');
  };

  const handleCreateSpace = async (spaceData: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    return createSpace(spaceData);
  };

  const handleSelectSpace = (spaceId: string) => {
    selectSpace(spaceId);
    setActiveTab('availability');
  };

  const handleBackToSpaces = () => {
    selectSpace('');
  };

  // Navigation handlers
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

  // Staff and availability handlers
  const handleAddStaff = async (newStaff: Omit<Staff, 'id'>) => {
    await addStaff(newStaff);
    refreshData();
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      await removeStaff(staffId);
      refreshData();
    }
  };

  const handleTimeSlotClick = (staffId: string, date: string, time: string) => {
    const staffSlots = availability[staffId] || [];
    const existingSlot = staffSlots.find(slot => 
      slot.date === date && 
      slot.startTime <= time && 
      slot.endTime > time
    );

    setSelectedSlot({
      staffId,
      date,
      time,
      currentSlot: existingSlot,
    });
    setShowAvailabilityForm(true);
  };

  const handleSaveAvailability = async (slot: Omit<TimeSlot, 'id'>) => {
    await saveAvailability(slot);
    refreshData();
  };

  // Stream handlers
  const handleCreateStream = async (streamData: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    casters: string[];
    observers: string[];
  }) => {
    await createStream(streamData);
    refreshStreams();
  };

  const handleUpdateRSVP = async (streamId: string, staffId: string, status: 'attending' | 'not_attending' | 'maybe', notes?: string) => {
    await updateRSVP(streamId, staffId, status, notes);
    refreshStreams();
  };

  const handleUpdateStreamStatus = async (streamId: string, status: 'scheduled' | 'live' | 'completed' | 'cancelled', streamLink?: string) => {
    const streamData = await updateStreamStatus(streamId, status, streamLink);
    
    // Award credits if stream is completed
    if (status === 'completed' && streamData) {
      const casterIds = streamData.stream_assignments
        .filter((a: any) => a.role === 'caster')
        .map((a: any) => a.staff_id);
      
      if (casterIds.length > 0) {
        await awardStreamCredits(streamId, casterIds);
        refreshCredits();
      }
    }
    
    refreshStreams();
  };

  const handleDeleteStream = async (streamId: string) => {
    await deleteStream(streamId);
    refreshStreams();
  };

  // Credits handlers
  const handleAdjustCredits = async (staffId: string, amount: number, reason: string) => {
    await adjustCredits(staffId, amount, reason);
    refreshCredits();
  };

  // Member management handlers
  const handleUpdateMemberRole = async (membershipId: string, newRole: 'admin' | 'caster' | 'observer') => {
    await updateMemberRole(membershipId, newRole);
    refreshSpaceMembers();
  };

  const handleRemoveMember = async (membershipId: string) => {
    await removeMember(membershipId);
    refreshSpaceMembers();
  };

  const handleUpdateStaffRole = async (staffId: string, newRole: 'caster' | 'observer') => {
    const staffMember = staff.find(s => s.id === staffId);
    if (staffMember) {
      await removeStaff(staffId);
      await addStaff({ ...staffMember, role: newRole });
      refreshData();
      refreshSpaceMembers();
    }
  };

  const handleRemoveStaffFromMembers = async (staffId: string) => {
    await removeStaff(staffId);
    refreshData();
    refreshSpaceMembers();
  };

  if (loading) {
    return <LoadingSpinner message="Loading application..." />;
  }

  // Show authentication form if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="professional-card rounded-xl shadow-2xl w-full max-w-md mx-4 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Staff Availability Manager</h1>
            <p className="text-gray-300">
              {authMode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="professional-button w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {authLoading ? 'Loading...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                setAuthError(null);
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {authMode === 'signin' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show space selector if no space is selected
  if (!currentSpace) {
    return (
      <SpaceSelector
        spaces={spaces}
        userSpaces={userSpaces}
        joinRequests={joinRequests}
        isAdmin={user.isAdmin}
        onCreateSpace={handleCreateSpace}
        onSelectSpace={handleSelectSpace}
        onJoinSpace={joinSpace}
        loading={spacesLoading}
        onSignOut={handleSignOut}
      />
    );
  }

  // Check if user is space owner
  const isSpaceOwner = currentSpace.ownerId === user.id;

  // Main application view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-effect shadow-2xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToSpaces}
                className="professional-button p-2 rounded-lg transition-colors"
                title="Back to Spaces"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{currentSpace.name}</h1>
                <p className="text-gray-300">{currentSpace.description || 'Staff availability and stream management'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {pendingRequests.length > 0 && isSpaceOwner && (
                <button
                  onClick={() => setShowJoinRequestsModal(true)}
                  className="professional-button relative flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Join Requests
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                </button>
              )}
              
              {isSpaceOwner && (
                <>
                  <button
                    onClick={() => setShowSpaceBrandingModal(true)}
                    className="professional-button p-2 rounded-lg transition-colors"
                    title="Space Branding"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowSpaceSettingsModal(true)}
                    className="professional-button p-2 rounded-lg transition-colors"
                    title="Space Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </>
              )}
              
              <button
                onClick={handleSignOut}
                className="professional-button px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <MainTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSpaceOwner={isSpaceOwner}
        />

        {/* Error Display */}
        {(dataError || streamsError || creditsError || spacesError) && (
          <ErrorMessage
            message={dataError || streamsError || creditsError || spacesError || 'An error occurred'}
            onRetry={() => {
              refreshData();
              refreshStreams();
              refreshCredits();
              refreshSpaces();
            }}
          />
        )}

        {/* Tab Content */}
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

            {isSpaceOwner && (
              <StaffManager
                staff={staff}
                activeRole={activeRole}
                onAddStaff={handleAddStaff}
                onRemoveStaff={handleRemoveStaff}
                selectedStaffId={selectedStaffId}
                onSelectStaff={setSelectedStaffId}
              />
            )}

            <AvailabilityCalendar
              staff={staff}
              activeRole={activeRole}
              availability={availability}
              weekDates={getWeekDates(currentWeekStart)}
              onTimeSlotClick={handleTimeSlotClick}
            />
          </div>
        )}

        {activeTab === 'streams' && (
          <StreamsView
            streams={streams}
            staff={staff}
            onCreateStream={handleCreateStream}
            onUpdateRSVP={handleUpdateRSVP}
            onUpdateStreamStatus={handleUpdateStreamStatus}
            onDeleteStream={handleDeleteStream}
            isSpaceOwner={isSpaceOwner}
          />
        )}

        {activeTab === 'credits' && (
          <CreditsView
            staff={staff}
            credits={credits}
            transactions={transactions}
            onAdjustCredits={handleAdjustCredits}
            isSpaceOwner={isSpaceOwner}
          />
        )}

        {activeTab === 'members' && isSpaceOwner && (
          <MembersView
            members={spaceMembers}
            staff={staff}
            onUpdateMemberRole={handleUpdateMemberRole}
            onRemoveMember={handleRemoveMember}
            onUpdateStaffRole={handleUpdateStaffRole}
            onRemoveStaff={handleRemoveStaffFromMembers}
          />
        )}
      </main>

      {/* Modals */}
      {showAvailabilityForm && selectedSlot && (
        <StaffAvailabilityForm
          staff={staff.find(s => s.id === selectedSlot.staffId)!}
          selectedDate={selectedSlot.date}
          selectedTime={selectedSlot.time}
          currentSlot={selectedSlot.currentSlot}
          onSave={handleSaveAvailability}
          onClose={() => {
            setShowAvailabilityForm(false);
            setSelectedSlot(null);
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

      {showSpaceSettingsModal && (
        <SpaceSettingsModal
          space={currentSpace}
          onUpdateSpace={updateSpace}
          onClose={() => setShowSpaceSettingsModal(false)}
        />
      )}

      {showSpaceBrandingModal && (
        <SpaceBrandingModal
          space={currentSpace}
          onClose={() => setShowSpaceBrandingModal(false)}
        />
      )}
    </div>
  );
}

export default App;