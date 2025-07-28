import React from 'react';
import { Calendar, Video, Trophy, Users } from 'lucide-react';

interface MainTabsProps {
  activeTab: 'availability' | 'streams' | 'credits' | 'members';
  onTabChange: (tab: 'availability' | 'streams' | 'credits' | 'members') => void;
  isSpaceOwner?: boolean;
}

export const MainTabs: React.FC<MainTabsProps> = ({
  activeTab,
  onTabChange,
  isSpaceOwner = false,
}) => {
  return (
    <div className="professional-card rounded-xl shadow-2xl p-1 inline-flex mb-6">
      <button
        onClick={() => onTabChange('availability')}
        className={`professional-button flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
          activeTab === 'availability'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="font-medium">Availability</span>
      </button>
      <button
        onClick={() => onTabChange('streams')}
        className={`professional-button flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
          activeTab === 'streams'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <Video className="w-5 h-5" />
        <span className="font-medium">Streams</span>
      </button>
      <button
        onClick={() => onTabChange('credits')}
        className={`professional-button flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
          activeTab === 'credits'
            ? 'bg-yellow-600 text-white shadow-lg'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <Trophy className="w-5 h-5" />
        <span className="font-medium">Credits</span>
      </button>
      {isSpaceOwner && (
        <button
          onClick={() => onTabChange('members')}
          className={`professional-button flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
            activeTab === 'members'
              ? 'bg-green-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Members</span>
        </button>
      )}
    </div>
  );
};