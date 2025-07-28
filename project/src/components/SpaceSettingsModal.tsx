import React, { useState } from 'react';
import { X, Settings, Globe, Lock, Save } from 'lucide-react';
import { Space } from '../types';

interface SpaceSettingsModalProps {
  space: Space;
  onUpdateSpace: (spaceId: string, updates: { isPublic: boolean; name?: string; description?: string }) => void;
  onClose: () => void;
}

export const SpaceSettingsModal: React.FC<SpaceSettingsModalProps> = ({
  space,
  onUpdateSpace,
  onClose,
}) => {
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description || '');
  const [isPublic, setIsPublic] = useState(space.isPublic);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    
    setSaving(true);
    
    try {
      await onUpdateSpace(space.id, {
        isPublic,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update space:', err);
      alert('Failed to update space settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Space Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Space Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your space..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Visibility
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border-2 border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mr-3"
                />
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="font-medium text-white">Public</div>
                    <div className="text-sm text-gray-300">Anyone can discover and request to join this space</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mr-3"
                />
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="font-medium text-white">Private</div>
                    <div className="text-sm text-gray-300">Only you can invite people to this space</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};