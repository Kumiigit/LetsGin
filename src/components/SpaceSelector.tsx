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
  // Add safety checks for props
  const safeSpaces = spaces || [];
  const safeUserSpaces = userSpaces || [];
  const safeJoinRequests = joinRequests || [];

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
            <div className="flex-shrink-0">
              {logoAsset ? (
                <img
                  src={getAssetUrl(logoAsset)}
                  alt={`${space.name} logo`}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-gray-600">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {logoAsset ? (
                  <img
                    src={getAssetUrl(logoAsset)}
                    alt={space.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : null}
                <h3 className="text-lg font-semibold text-white truncate">{space.name}</h3>
              </div>
              {space.description && (
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{space.description}</p>
              )}
              <div className="text-sm text-gray-400">
                Hosted by {space.ownerName}
              </div>
            </div>

            {!showJoinButton && (
              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{space.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                {space.isPublic ? (
                  <Globe className="w-4 h-4 text-green-400" />
                ) : (
                  <Lock className="w-4 h-4 text-yellow-400" />
                )}
                <span>{space.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>

            {showJoinButton && (
              <div className="flex gap-2">
                {(() => {
                  const requestStatus = getJoinRequestStatus(space.id);
                  
                  if (requestStatus === 'pending') {
                    return (
                      <div className="px-4 py-2 bg-yellow-600/20 border border-yellow-600 text-yellow-300 rounded-lg text-center text-sm">
                        Request Pending
                      </div>
                    );
                  }
                  
                  if (requestStatus === 'approved') {
                    return (
                      <button
                        onClick={onClick}
                        className="professional-button px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Open Space
                      </button>
                    );
                  }
                  
                  if (requestStatus === 'rejected') {
                    return (
                      <div className="px-4 py-2 bg-red-600/20 border border-red-600 text-red-300 rounded-lg text-center text-sm">
                        Request Denied (7 days)
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      onClick={() => setShowJoinForm(space.id)}
                      className="professional-button px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Request to Join
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpace.name.trim() && newSpace.adminPassword.trim()) {
      onCreateSpace?.({
        name: newSpace.name.trim(),
        description: newSpace.description.trim() || undefined,
        isPublic: newSpace.isPublic,
        adminPassword: newSpace.adminPassword.trim(),
      })
        .then(() => {
          setNewSpace({ name: '', description: '', isPublic: true, adminPassword: '' });
          setShowCreateForm(false);
        })
        .catch((error) => {
          console.error('Failed to create space:', error);
          alert(`Failed to create space: ${error.message}`);
        });
    }
  };

  const handleJoinSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (showJoinForm) {
      onJoinSpace?.(showJoinForm, joinMessage.trim() || undefined);
      setJoinMessage('');
      setShowJoinForm(null);
    }
  };

  const hasJoinRequest = (spaceId: string) => {
    return safeJoinRequests.some(request => request.spaceId === spaceId && request.status === 'pending');
  };

  const getJoinRequestStatus = (spaceId: string) => {
    const request = safeJoinRequests.find(request => request.spaceId === spaceId);
    if (!request) return null;
    
    // Check if rejection is within 7 days
    if (request.status === 'rejected') {
      const rejectionDate = new Date(request.updatedAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      if (rejectionDate > sevenDaysAgo) {
        return 'rejected';
      }
    }
    
    return request.status;
  };

  const isMember = (spaceId: string) => {
    return safeUserSpaces.some(space => space.id === spaceId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading spaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-effect shadow-2xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {isAdmin ? 'Your Spaces' : 'Available Spaces'}
                </h1>
                <p className="text-gray-300">
                  {isAdmin ? 'Create and manage your spaces' : 'Browse and join spaces'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="professional-button flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Space
              </button>
            )}
            <button
              onClick={() => onSignOut?.()}
              className="professional-button flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User's Spaces */}
        {safeUserSpaces.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Your Spaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeUserSpaces.map((space) => {
                const spaceWithStats = safeSpaces.find(s => s.id === space.id);
                if (!spaceWithStats) return null;
                return (
                  <div key={space.id} onClick={() => onSelectSpace?.(space.id)} className="cursor-pointer">
                    <SpaceCard space={spaceWithStats} onClick={() => onSelectSpace?.(space.id)} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Spaces */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {isAdmin ? 'Other Spaces' : 'Available Spaces'}
          </h2>
          
          {safeSpaces.filter(space => !isMember(space.id)).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>No spaces available to join at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeSpaces
                .filter(space => !isMember(space.id))
                .map((space) => (
                  <SpaceCard 
                    key={space.id} 
                    space={space} 
                    onClick={() => onSelectSpace?.(space.id)} 
                    showJoinButton={true}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Create Space Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="professional-card rounded-xl shadow-2xl w-full max-w-md mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Create New Space</h3>
                
                <form onSubmit={handleCreateSpace} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Space Name *
                    </label>
                    <input
                      type="text"
                      value={newSpace.name}
                      onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                      placeholder="e.g., My Gaming Community"
                      className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newSpace.description}
                      onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                      placeholder="Brief description of your space..."
                      rows={3}
                      className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      value={newSpace.adminPassword}
                      onChange={(e) => setNewSpace({ ...newSpace, adminPassword: e.target.value })}
                      placeholder="Enter admin password"
                      className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Required to create and manage spaces
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      value={newSpace.adminPassword}
                      onChange={(e) => setNewSpace({ ...newSpace, adminPassword: e.target.value })}
                      placeholder="Enter admin password"
                      className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Required to create and manage spaces
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      value={newSpace.adminPassword}
                      onChange={(e) => setNewSpace({ ...newSpace, adminPassword: e.target.value })}
                      placeholder="Enter admin password"
                      className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Required to create and manage spaces
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      value={newSpace.adminPassword}
                      onChange={(e) => setNewSpace({ ...newSpace, adminPassword: e.target.value })}
                      placeholder="Enter admin password"
                      className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Required to create and manage spaces
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newSpace.isPublic}
                        onChange={(e) => setNewSpace({ ...newSpace, isPublic: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">Make this space public</span>
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Public spaces can be discovered and joined by anyone
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={!newSpace.name.trim() || !newSpace.adminPassword.trim()}
                      className="professional-button flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Space
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="professional-button px-4 py-2 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Join Space Modal */}
        {showJoinForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="professional-card rounded-xl shadow-2xl w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Request to Join Space</h3>
                </div>
                
                <form onSubmit={handleJoinSpace} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Space
                    </label>
                    <div className="p-3 bg-gray-700 rounded-md">
                      <div className="font-medium text-white">
                        {safeSpaces.find(s => s.id === showJoinForm)?.name}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message (optional)
                    </label>
                    <textarea
                      value={joinMessage}
                      onChange={(e) => setJoinMessage(e.target.value)}
                      placeholder="Tell the space owner why you'd like to join..."
                      rows={3}
                      className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="professional-button flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Send Request
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowJoinForm(null);
                        setJoinMessage('');
                      }}
                      className="professional-button px-4 py-2 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};