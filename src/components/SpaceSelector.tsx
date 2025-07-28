if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-gray-400">Loading spaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 shadow-2xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Spaces</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  Create Space
                </button>
              )}
              
              <button
                onClick={onSignOut}
                className="btn-secondary"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Spaces */}
        {mySpaces.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Home className="w-5 h-5" />
              My Spaces
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySpaces
                .map((space) => {
                  const spaceWithStats = spacesWithStats.find(s => s.id === space.id);
                  return (
                    <div
                      key={space.id}
                      className="card p-6 hover:border-blue-500 transition-all duration-200 cursor-pointer hover:scale-105 fade-in"
                      onClick={() => onSelectSpace(space.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">{space.name}</h3>
                          <p className="text-gray-400 text-sm line-clamp-2">{space.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{spaceWithStats?.memberCount || 0} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{spaceWithStats?.messageCount || 0} messages</span>
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full">
                          Owner
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Available Spaces */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Available Spaces
          </h2>
          
          {availableSpaces.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No spaces available</h3>
              <p className="text-gray-500">Check back later for new spaces to join.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableSpaces
                .map((space) => (
                  <div
                    key={space.id}
                    className="card p-6 fade-in"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{space.name}</h3>
                      <p className="text-gray-400 text-sm line-clamp-3">{space.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{space.memberCount} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{space.messageCount} messages</span>
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
                              className="btn-primary bg-green-600 hover:bg-green-700 flex-1 text-sm"
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
                            className="btn-primary bg-purple-600 hover:bg-purple-700 flex-1 text-sm"
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
        </section>
      </main>

      {/* Create Space Modal */}
      {showCreateForm && (
        <div className="modal-backdrop flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4 scale-in">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Create New Space</h3>
              
              <form onSubmit={handleCreateSpace} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Space Name
                  </label>
                  <input
                    type="text"
                    value={newSpace.name}
                    onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                    placeholder="e.g., My Gaming Community"
                    className="form-input"
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
                    className="form-textarea"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    Create Space
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary"
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
        <div className="modal-backdrop flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4 scale-in">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Request to Join Space</h3>
              </div>
              
              <form onSubmit={handleJoinRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message to Space Owner
                  </label>
                  <textarea
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="Tell the space owner why you'd like to join..."
                    rows={3}
                    className="form-textarea focus:ring-purple-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary bg-purple-600 hover:bg-purple-700 flex-1"
                  >
                    Send Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(null);
                      setJoinMessage('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );