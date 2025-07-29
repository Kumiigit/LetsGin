import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Staff, TimeSlot } from '../types';
import { formatTime, getDayName, getMonthDay, generateTimeSlots } from '../utils/dateUtils';

interface AvailabilityCalendarProps {
  staff: Staff[];
  activeRole: 'caster' | 'observer' | 'production';
  availability: { [staffId: string]: TimeSlot[] };
  weekDates: Date[];
  onTimeSlotClick: (staffId: string, date: string, time: string) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  staff,
  activeRole,
  availability,
  weekDates,
  onTimeSlotClick,
}) => {
  const timeSlots = generateTimeSlots();
  
  // Filter staff by active role
  const filteredStaff = staff.filter(member => member.role === activeRole);

  const getSlotStatus = (staffId: string, date: string, time: string): 'available' | 'busy' | 'off' | null => {
    const staffSlots = availability[staffId] || [];
    const slot = staffSlots.find((slot) => {
      // Check if this time slot falls within any availability slot
      const slotStartTime = slot.startTime;
      const slotEndTime = slot.endTime;
      
      // Convert times to minutes for easier comparison
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const currentTimeMinutes = timeToMinutes(time);
      const slotStartMinutes = timeToMinutes(slotStartTime);
      const slotEndMinutes = timeToMinutes(slotEndTime);
      
      return slot.date === date && 
             currentTimeMinutes >= slotStartMinutes && 
             currentTimeMinutes < slotEndMinutes;
    });
    return slot?.status || null;
  };

  const getStatusColor = (status: 'available' | 'busy' | 'off' | null): string => {
    switch (status) {
      case 'available':
        return 'bg-green-900/50 border-green-600 text-green-300';
      case 'busy':
        return 'bg-red-900/50 border-red-600 text-red-300';
      case 'off':
        return 'bg-gray-800/50 border-gray-600 text-gray-400';
      default:
        return 'bg-gray-900/50 border-gray-700 text-gray-500 hover:bg-gray-800/50';
    }
  };

  const getStatusText = (status: 'available' | 'busy' | 'off' | null): string => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'off':
        return 'Off';
      default:
        return 'Not Set';
    }
  };

  return (
    <div className="professional-card rounded-xl shadow-2xl">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Weekly Availability</h2>
        </div>
        <p className="text-gray-300 mt-1">
          {activeRole === 'caster' ? 'Caster' : activeRole === 'observer' ? 'Observer' : 'Production'} availability for the selected week
        </p>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-900/50 border border-green-600 rounded"></div>
            <span className="text-gray-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-900/50 border border-red-600 rounded"></div>
            <span className="text-gray-300">Busy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-800/50 border border-gray-600 rounded"></div>
            <span className="text-gray-300">Off</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900/50">
              <th className="sticky left-0 bg-gray-900/50 px-4 py-3 text-left text-sm font-medium text-gray-300 border-r border-gray-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time
                </div>
              </th>
              {weekDates.map((date) => (
                <th key={date.toISOString()} className="px-3 py-3 text-center text-sm font-medium text-gray-300 min-w-32">
                  <div>
                    <div className="font-semibold">{getDayName(date)}</div>
                    <div className="text-xs text-gray-400">{getMonthDay(date)}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time} className="border-b border-gray-800">
                <td className="sticky left-0 bg-black/90 px-4 py-2 text-sm text-gray-300 border-r border-gray-800 font-medium">
                  {formatTime(time)}
                </td>
                {weekDates.map((date) => (
                  <td key={`${time}-${date.toISOString()}`} className="p-1">
                    <div className="space-y-1">
                      {filteredStaff.map((member) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const status = getSlotStatus(member.id, dateStr, time);
                        return (
                          <button
                            key={member.id}
                            onClick={() => onTimeSlotClick(member.id, dateStr, time)}
                            className={`w-full px-2 py-1 text-xs rounded border transition-colors ${getStatusColor(status)}`}
                            title={`${member.name} - ${getStatusText(status)}`}
                          >
                            <div className="truncate">{member.name.split(' ')[0]}</div>
                            <div className="text-xs opacity-75">{getStatusText(status)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};