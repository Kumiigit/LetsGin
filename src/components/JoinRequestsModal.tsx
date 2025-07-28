import React from 'react';
import { X, Check, UserPlus, Clock, MessageSquare } from 'lucide-react';
import { JoinRequestWithUser } from '../types';

interface JoinRequestsModalProps {
  requests: JoinRequestWithUser[];
  onApprove: (requestId: string, role: 'caster' | 'observer') => void;
  onReject: (requestId: string) => void;
  onClose: () => void;
}

export const JoinRequestsModal: React.FC<JoinRequestsModalProps> = ({
  requests,
  onApprove,
  onReject,
  onClose,
}) => {
  const [selectedRoles, setSelectedRoles] = React.useState<{ [key: string]: 'caster' | 'observer' }>({});

  const handleApprove = (requestId: string) => {
    const role = selectedRoles[requestId] || 'observer';
    onApprove(requestId, role);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Join Requests</h3>
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
              {requests.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>No pending join requests</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-white">{request.userName}</h4>
                      <p className="text-sm text-gray-300">{request.userEmail}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mb-4 p-3 bg-gray-600/50 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">Message</span>
                      </div>
                      <p className="text-sm text-gray-300">{request.message}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Assign Role
                      </label>
                      <select
                        value={selectedRoles[request.id] || 'observer'}
                        onChange={(e) => setSelectedRoles({
                          ...selectedRoles,
                          [request.id]: e.target.value as 'caster' | 'observer'
                        })}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="observer">Observer</option>
                        <option value="caster">Caster</option>
                      </select>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(request.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};