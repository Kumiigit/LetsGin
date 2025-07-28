import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { SpaceSelector } from './components/SpaceSelector';
import { AuthForm } from './components/AuthForm';
import { useAuth } from './hooks/useAuth';
import { useSpaces } from './hooks/useSpaces';

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const {
    spaces,
    userSpaces,
    joinRequests,
    loading: spacesLoading,
    createSpace,
    joinSpace,
    selectSpace,
  } = useSpaces(user?.id);

  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin (you can implement your own logic here)
  useEffect(() => {
    if (user) {
      // For now, we'll consider all authenticated users as potential admins
      // You can implement proper admin checking logic here
      setIsAdmin(true);
    }
  }, [user]);

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
    return <AuthForm onSignIn={signIn} onSignUp={signUp} />;
  }

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
};

export default App;