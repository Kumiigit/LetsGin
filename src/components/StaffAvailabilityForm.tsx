import React, { useState } from 'react';
import { User, Save, X } from 'lucide-react';
import { Staff, TimeSlot } from '../types';
import { formatTime } from '../utils/dateUtils';

interface StaffAvailabilityFormProps {
  staff: Staff;
  selectedDate: string;
  selectedTime: string;
  currentSlot?: TimeSlot;
  onSave: (slot: Omit<TimeSlot, 'id'>) => void;
  onClose: () => void;
}

export const StaffAvailabilityForm: React.FC<StaffAvailabilityFormProps> = ({
  staff,
  selectedDate,
  selectedTime,
  currentSlot,
  onSave,
  onClose,
}) => {
  // Calculate default end time (1 hour after start time)
  const getDefaultEndTime = () => {
    if (currentSlot?.endTime) return currentSlot.endTime;
    
    const startHour = parseInt(selectedTime.split(':')[0]);
    return `${(startHour + 1).toString().padStart(2, '0')}:00`;
  };

  const [status, setStatus] = useState<'available' | 'busy' | 'off'>(
    currentSlot?.status || 'available'
  );
  const [endTime, setEndTime] = useState(getDefaultEndTime());
  const [notes, setNotes] = useState(currentSlot?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      staffId: staff.id,
      date: selectedDate,
      startTime: selectedTime,
      endTime,
      status,
      notes,
    });
    onClose();
  };

  const dateObj = new Date(selectedDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Set Availability</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Staff Member</label>
            <div className="p-3 bg-gray-700 rounded-md">
              <div className="font-medium text-white">{staff.name}</div>
              <div className="text-sm text-gray-300">{staff.role}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
            <div className="p-3 bg-gray-700 rounded-md">
              <div className="font-medium text-white">{formattedDate}</div>
              <div className="text-sm text-gray-300">
                Starting at {formatTime(selectedTime)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(() => {
                const startHour = parseInt(selectedTime.split(':')[0]);
                const options = [];
                
                // Add 1 hour option
                const oneHourLater = `${(startHour + 1).toString().padStart(2, '0')}:00`;
                options.push(
                  <option key="1hour" value={oneHourLater}>
                    {formatTime(oneHourLater)} (1 hour)
                  </option>
                );
                
                // Add 2 hour option
                const twoHourLater = `${(startHour + 2).toString().padStart(2, '0')}:00`;
                options.push(
                  <option key="2hour" value={twoHourLater}>
                    {formatTime(twoHourLater)} (2 hours)
                  </option>
                );
                
                // Add 3 hour option
                const threeHourLater = `${(startHour + 3).toString().padStart(2, '0')}:00`;
                options.push(
                  <option key="3hour" value={threeHourLater}>
                    {formatTime(threeHourLater)} (3 hours)
                  </option>
                );
                
                // Add 4 hour option
                const fourHourLater = `${(startHour + 4).toString().padStart(2, '0')}:00`;
                options.push(
                  <option key="4hour" value={fourHourLater}>
                    {formatTime(fourHourLater)} (4 hours)
                  </option>
                );
                
                return options;
              })()}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Availability Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('available')}
                className={`p-3 rounded-md border-2 transition-colors ${
                  status === 'available'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-medium">Available</div>
                <div className="text-xs">Ready to work</div>
              </button>
              <button
                type="button"
                onClick={() => setStatus('busy')}
                className={`p-3 rounded-md border-2 transition-colors ${
                  status === 'busy'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-medium">Busy</div>
                <div className="text-xs">Already scheduled</div>
              </button>
              <button
                type="button"
                onClick={() => setStatus('off')}
                className={`p-3 rounded-md border-2 transition-colors ${
                  status === 'off'
                    ? 'border-gray-500 bg-gray-600 text-gray-300'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-medium">Off</div>
                <div className="text-xs">Not working</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Availability
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};