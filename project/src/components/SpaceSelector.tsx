import React, { useState } from 'react';
import { Plus, Users, Globe, Lock, ArrowRight, MessageSquare, LogOut } from 'lucide-react';
import { Space, SpaceWithStats, JoinRequest } from '../types';

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
  });
  const [joinMessage, setJoinMessage] = useState('');

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpace.name.trim()) {
      onCreateSpace({
        name: newSpace.name.trim(),
        description: newSpace.description.trim() || undefined,
        isPublic: newSpace.isPublic,
      })
        .then(() => {
          setNewSpace({ name: '', description: '', isPublic: true });
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
      onJoinSpace(showJoinForm, joinMessage.trim() || undefined);
      setJoinMessage('');
      setShowJoinForm(null);
    }
  };

  const hasJoinRequest = (spaceId: string) => {
    return joinRequests.some(request => request.spaceId === spaceId && request.status === 'pending');
  };

  const getJoinRequestStatus = (spaceId: string) => {
    const request = joinRequests.find(request => request.spaceId === spaceId);
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
    return userSpaces.some(space => space.id === spaceId);
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
    <div className="min-h-screen bg-transparent">
      <header className="bg-gray-900/95 backdrop-blur-sm shadow-xl border-b border-gray-700">
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Space
              </button>
            )}
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
        {userSpaces.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Your Spaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userSpaces.map((space) => {
                const spaceWithStats = spaces.find(s => s.id === space.id);
                return (
                  <div
                    key={space.id}
                    className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6 hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => onSelectSpace(space.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{space.name}</h3>
                        {space.description && (
                          <p className="text-gray-300 text-sm mb-3">{space.description}</p>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{spaceWithStats?.memberCount || 0} members</span>
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
                    </div>
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
          
          {spaces.filter(space => !isMember(space.id)).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>No spaces available to join at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaces
                .filter(space => !isMember(space.id))
                .map((space) => (
                  <div
                    key={space.id}
                    className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{space.name}</h3>
                      {space.description && (
                        <p className="text-gray-300 text-sm mb-3">{space.description}</p>
                      )}
                      <div className="text-sm text-gray-400">
                        Hosted by {space.ownerName}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
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
                    </div>

                    <div className="flex gap-2">
                      {(() => {
                        const requestStatus = getJoinRequestStatus(space.id);
                        
                        if (requestStatus === 'pending') {
                          return (
                            <div className="flex-1 px-4 py-2 bg-yellow-600/20 border border-yellow-600 text-yellow-300 rounded-lg text-center text-sm">
                              Request Pending
                            </div>
                          );
                        }
                        
                        if (requestStatus === 'approved') {
                          return (
                            <button
                              onClick={() => onSelectSpace(space.id)}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Open Space
                            </button>
                          );
                        }
                        
                        if (requestStatus === 'rejected') {
                          return (
                            <div className="flex-1 px-4 py-2 bg-red-600/20 border border-red-600 text-red-300 rounded-lg text-center text-sm">
                              Request Denied (7 days)
                            </div>
                          );
                        }
                        
                        return (
                          <button
                            onClick={() => setShowJoinForm(space.id)}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            Request to Join
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Create Space Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create Space
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors"
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
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
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
                        {spaces.find(s => s.id === showJoinForm)?.name}
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Send Request
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowJoinForm(null);
                        setJoinMessage('');
                      }}
                      className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors"
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