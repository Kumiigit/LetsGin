import React, { useState } from 'react';
import { Plus, Calendar, Clock, Users, MessageSquare, Settings } from 'lucide-react';
import { StreamWithDetails, Staff } from '../types';
import { StreamCard } from './StreamCard';
import { CreateStreamForm } from './CreateStreamForm';
import { DiscordIntegrationModal } from './DiscordIntegrationModal';
import { useSpaces } from '../hooks/useSpaces';
import { useAuth } from '../hooks/useAuth';

interface StreamsViewProps {
  streams: StreamWithDetails[];
  staff: Staff[];
  onCreateStream: (stream: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    casters: string[];
    observers: string[];
  }) => void;
  onUpdateRSVP: (streamId: string, staffId: string, status: 'attending' | 'not_attending' | 'maybe', notes?: string) => void;
  onUpdateStreamStatus: (streamId: string, status: 'scheduled' | 'live' | 'completed' | 'cancelled', streamLink?: string) => void;
  onDeleteStream: (streamId: string) => Promise<void>;
  isSpaceOwner?: boolean;
}

export const StreamsView: React.FC<StreamsViewProps> = ({
  streams,
  staff,
  onCreateStream,
  onUpdateRSVP,
  onUpdateStreamStatus,
  onDeleteStream,
  isSpaceOwner = false,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const { user } = useAuth();
  const { currentSpace } = useSpaces(user?.id);

  // Helper function to create a full datetime from date and time strings
  const createDateTime = (dateStr: string, timeStr: string): Date => {
    return new Date(`${dateStr}T${timeStr}`);
  };

  const now = new Date();

  const upcomingStreams = streams
    .filter(stream => stream.status !== 'completed' && stream.status !== 'cancelled' && createDateTime(stream.date, stream.startTime) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastStreams = streams
    .filter(stream => stream.status === 'completed' || stream.status === 'cancelled' || createDateTime(stream.date, stream.endTime) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="professional-card rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Stream Schedule</h2>
          </div>
          <div className="flex items-center gap-3">
            {isSpaceOwner && (
              <>
                <button
                  onClick={() => setShowDiscordModal(true)}
                  className="professional-button flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  title="Discord Integration"
                >
                  <Settings className="w-4 h-4" />
                  Discord
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="professional-button flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Stream
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-900/50 backdrop-blur-sm border border-purple-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{upcomingStreams.length}</div>
            <div className="text-sm text-purple-300">Upcoming Streams</div>
          </div>
          <div className="bg-green-900/50 backdrop-blur-sm border border-green-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {upcomingStreams.reduce((acc, stream) => 
                acc + stream.rsvps.filter(rsvp => rsvp.status === 'attending').length, 0
              )}
            </div>
            <div className="text-sm text-green-300">Total Attendees</div>
          </div>
          <div className="bg-blue-900/50 backdrop-blur-sm border border-blue-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{pastStreams.length}</div>
            <div className="text-sm text-blue-300">Past Streams</div>
          </div>
        </div>
      </div>

      {showCreateForm && isSpaceOwner && (
        <CreateStreamForm
          staff={staff}
          onSave={onCreateStream}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {upcomingStreams.length > 0 && (
        <div className="professional-card rounded-xl shadow-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Streams</h3>
          <div className="space-y-4">
            {upcomingStreams.map(stream => (
              <StreamCard
                key={stream.id}
                stream={stream}
                staff={staff}
                onUpdateRSVP={onUpdateRSVP}
                onUpdateStreamStatus={onUpdateStreamStatus}
                onDeleteStream={onDeleteStream}
                isSpaceOwner={isSpaceOwner}
              />
            ))}
          </div>
        </div>
      )}

      {pastStreams.length > 0 && (
        <div className="professional-card rounded-xl shadow-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Past Streams</h3>
          <div className="space-y-4">
            {pastStreams.slice(0, 5).map(stream => (
              <StreamCard
                key={stream.id}
                stream={stream}
                staff={staff}
                onUpdateRSVP={onUpdateRSVP}
                onUpdateStreamStatus={onUpdateStreamStatus}
                onDeleteStream={onDeleteStream}
                isSpaceOwner={isSpaceOwner}
                isPast={true}
              />
            ))}
          </div>
        </div>
      )}

      {streams.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p>No streams scheduled yet. Click "Schedule Stream" to get started.</p>
        </div>
      )}

      {/* Discord Integration Modal */}
      {showDiscordModal && currentSpace && (
        <DiscordIntegrationModal
          space={currentSpace}
          onClose={() => setShowDiscordModal(false)}
        />
      )}
    </div>
  );
};