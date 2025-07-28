import React, { useState } from 'react';
import { Calendar, Clock, Users, MessageSquare, Check, X, HelpCircle, ExternalLink, Play, CheckCircle, XCircle, Trash2, Link } from 'lucide-react';
import { StreamWithDetails, Staff } from '../types';
import { formatTime } from '../utils/dateUtils';

interface StreamCardProps {
  stream: StreamWithDetails;
  staff: Staff[];
  onUpdateRSVP: (streamId: string, staffId: string, status: 'attending' | 'not_attending' | 'maybe', notes?: string) => void;
  onUpdateStreamStatus: (streamId: string, status: 'scheduled' | 'live' | 'completed' | 'cancelled', streamLink?: string) => void;
  onDeleteStream: (streamId: string) => Promise<void>;
  isSpaceOwner?: boolean;
  isPast?: boolean;
}

export const StreamCard: React.FC<StreamCardProps> = ({
  stream,
  staff,
  onUpdateRSVP,
  onUpdateStreamStatus,
  onDeleteStream,
  isSpaceOwner = false,
  isPast = false,
}) => {
  const [showRSVPForm, setShowRSVPForm] = useState<string | null>(null);
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [showStreamLinkForm, setShowStreamLinkForm] = useState(false);
  const [streamLink, setStreamLink] = useState(stream.streamLink || '');

  // Helper function to determine if stream is actually in the past
  const isStreamPast = () => {
    const streamEndDateTime = new Date(`${stream.date}T${stream.endTime}`);
    return streamEndDateTime < new Date();
  };

  const actuallyPast = isStreamPast();

  const getStaffById = (id: string) => staff.find(s => s.id === id);
  
  const assignedCasters = stream.assignments
    .filter(a => a.role === 'caster')
    .map(a => getStaffById(a.staffId))
    .filter(Boolean);
    
  const assignedObservers = stream.assignments
    .filter(a => a.role === 'observer')
    .map(a => getStaffById(a.staffId))
    .filter(Boolean);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRSVPStatus = (staffId: string) => {
    return stream.rsvps.find(rsvp => rsvp.staffId === staffId)?.status || 'maybe';
  };

  const handleRSVPSubmit = (staffId: string, status: 'attending' | 'not_attending' | 'maybe') => {
    console.log('Submitting RSVP:', { staffId, status, notes: rsvpNotes });
    
    onUpdateRSVP(stream.id, staffId, status, rsvpNotes || undefined)
      .then(() => {
        console.log('RSVP submitted successfully');
        setShowRSVPForm(null);
        setRsvpNotes('');
      })
      .catch((error) => {
        console.error('Failed to submit RSVP:', error);
        alert(`Failed to update RSVP: ${error.message || 'Please try again.'}`);
      });
  };

  const handleStreamStatusUpdate = (status: 'scheduled' | 'live' | 'completed' | 'cancelled') => {
    if (status === 'completed' && !streamLink.trim()) {
      setShowStreamLinkForm(true);
      return;
    }
    
    console.log('Updating stream status:', { status, streamLink });
    
    onUpdateStreamStatus(stream.id, status, streamLink || undefined)
      .then(() => {
        console.log('Stream status updated successfully');
        setShowStreamLinkForm(false);
      })
      .catch((error) => {
        console.error('Failed to update stream status:', error);
        alert('Failed to update stream status. Please try again.');
      });
  };

  const handleDeleteStream = () => {
    if (confirm('Are you sure you want to delete this stream? This action cannot be undone.')) {
      console.log('Deleting stream:', stream.id);
      
      onDeleteStream(stream.id)
        .then(() => {
          console.log('Stream deleted successfully');
        })
        .catch((error) => {
          console.error('Failed to delete stream:', error);
          alert('Failed to delete stream. Please try again.');
        });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attending':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'not_attending':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attending':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'not_attending':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStreamStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className={`border rounded-lg p-6 ${actuallyPast ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-700/50 backdrop-blur-sm border-gray-600'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-white">{stream.title}</h4>
          {stream.description && (
            <p className="text-gray-300 mt-1">{stream.description}</p>
          )}
          {stream.streamLink && (
            <a
              href={stream.streamLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="w-4 h-4" />
              View Stream
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full border ${getStreamStatusColor(stream.status)}`}>
            {stream.status === 'live' && <Play className="w-3 h-3 inline mr-1" />}
            {stream.status === 'completed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
            {stream.status === 'cancelled' && <XCircle className="w-3 h-3 inline mr-1" />}
            {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
          </span>
          {!actuallyPast && isSpaceOwner && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleStreamStatusUpdate('live')}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Mark as Live"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStreamStatusUpdate('completed')}
                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Mark as Done"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStreamStatusUpdate('cancelled')}
                className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                title="Mark as Cancelled"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteStream}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete Stream"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Calendar className="w-4 h-4" />
          {formatDate(stream.date)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Clock className="w-4 h-4" />
          {formatTime(stream.startTime)} - {formatTime(stream.endTime)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Users className="w-4 h-4" />
          {stream.rsvps.filter(rsvp => rsvp.status === 'attending').length} attending
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="font-medium text-white mb-2">Assigned Casters</h5>
          <div className="space-y-1">
            {assignedCasters.map(caster => (
              <div key={caster?.id} className="text-sm text-gray-300">
                {caster?.name}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="font-medium text-white mb-2">Assigned Observers</h5>
          <div className="space-y-1">
            {assignedObservers.map(observer => (
              <div key={observer?.id} className="text-sm text-gray-300">
                {observer?.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {!actuallyPast && (
        <div>
          <h5 className="font-medium text-white mb-3">RSVP Status</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {staff.map(member => {
              const status = getRSVPStatus(member.id);
              return (
                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-600/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{member.name}</span>
                    <span className="text-xs text-gray-400">({member.role})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
                    </span>
                    <button
                      onClick={() => setShowRSVPForm(member.id)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Update
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showStreamLinkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Link className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Add Stream Link</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Twitch/YouTube Link
                  </label>
                  <input
                    type="url"
                    value={streamLink}
                    onChange={(e) => setStreamLink(e.target.value)}
                    placeholder="https://twitch.tv/... or https://youtube.com/..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleStreamStatusUpdate('completed')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Mark as Done
                </button>
                <button
                  onClick={() => setShowStreamLinkForm(false)}
                  className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRSVPForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Update RSVP for {getStaffById(showRSVPForm)?.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Attendance Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleRSVPSubmit(showRSVPForm, 'attending')}
                      className="flex items-center justify-center gap-2 p-3 border-2 border-green-300 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Attending</span>
                    </button>
                    <button
                      onClick={() => handleRSVPSubmit(showRSVPForm, 'maybe')}
                      className="flex items-center justify-center gap-2 p-3 border-2 border-yellow-300 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-sm">Maybe</span>
                    </button>
                    <button
                      onClick={() => handleRSVPSubmit(showRSVPForm, 'not_attending')}
                      className="flex items-center justify-center gap-2 p-3 border-2 border-red-300 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm">Can't Attend</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={rsvpNotes}
                    onChange={(e) => setRsvpNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRSVPForm(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};