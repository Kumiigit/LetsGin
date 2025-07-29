import React, { useState } from 'react';
import { Save, X, Calendar, Clock, Users } from 'lucide-react';
import { Staff } from '../types';

interface CreateStreamFormProps {
  staff: Staff[];
  onSave: (stream: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    casters: string[];
    observers: string[];
  }) => void;
  onClose: () => void;
}

export const CreateStreamForm: React.FC<CreateStreamFormProps> = ({
  staff,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [description, setDescription] = useState('');
  const [selectedCasters, setSelectedCasters] = useState<string[]>([]);
  const [selectedObservers, setSelectedObservers] = useState<string[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<string[]>([]);

  const casters = staff.filter(member => member.role === 'caster');
  const observers = staff.filter(member => member.role === 'observer');
  const production = staff.filter(member => member.role === 'production');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && date && startTime && endTime && (selectedCasters.length > 0 || selectedProduction.length > 0)) {
      onSave({
        title,
        date,
        startTime,
        endTime,
        description: description || undefined,
        casters: selectedCasters,
        observers: selectedObservers,
        production: selectedProduction,
      });
      onClose();
    }
  };

  const toggleStaffSelection = (staffId: string, role: 'caster' | 'observer') => {
    if (role === 'caster') {
      setSelectedCasters(prev => 
        prev.includes(staffId) 
          ? prev.filter(id => id !== staffId)
          : prev.length < 2 ? [...prev, staffId] : prev
      );
    } else if (role === 'observer') {
      setSelectedObservers(prev => 
        prev.includes(staffId) 
          ? prev.filter(id => id !== staffId)
          : prev.length < 2 ? [...prev, staffId] : prev
      );
    } else if (role === 'production') {
      setSelectedProduction(prev => 
        prev.includes(staffId) 
          ? prev.filter(id => id !== staffId)
          : prev.length < 2 ? [...prev, staffId] : prev
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="professional-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Schedule New Stream</h3>
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
              Stream Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Community Stream"
              className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description or notes about the stream..."
              rows={3}
              className="professional-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Casters * (max 2)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {casters.map(caster => (
                  <label
                    key={caster.id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedCasters.includes(caster.id)
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCasters.includes(caster.id)}
                      onChange={() => toggleStaffSelection(caster.id, 'caster')}
                      disabled={!selectedCasters.includes(caster.id) && selectedCasters.length >= 2}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-white">{caster.name}</div>
                      <div className="text-sm text-gray-300">{caster.email}</div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedCasters.length === 0 && selectedProduction.length === 0 && (
                <p className="text-sm text-red-400 mt-2">At least one caster or production member is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Observers (max 2)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {observers.map(observer => (
                  <label
                    key={observer.id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedObservers.includes(observer.id)
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedObservers.includes(observer.id)}
                      onChange={() => toggleStaffSelection(observer.id, 'observer')}
                      disabled={!selectedObservers.includes(observer.id) && selectedObservers.length >= 2}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-white">{observer.name}</div>
                      <div className="text-sm text-gray-300">{observer.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Production (max 2)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {production.map(prod => (
                  <label
                    key={prod.id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedProduction.includes(prod.id)
                        ? 'border-orange-500 bg-orange-900/30'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProduction.includes(prod.id)}
                      onChange={() => toggleStaffSelection(prod.id, 'production')}
                      disabled={!selectedProduction.includes(prod.id) && selectedProduction.length >= 2}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-white">{prod.name}</div>
                      <div className="text-sm text-gray-300">{prod.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={!title || !date || !startTime || !endTime || (selectedCasters.length === 0 && selectedProduction.length === 0)}
              className="professional-button flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Schedule Stream
            </button>
            <button
              type="button"
              onClick={onClose}
              className="professional-button px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};