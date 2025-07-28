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
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-1 inline-flex mb-6">
      <button
        onClick={() => onTabChange('availability')}
        className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
          activeTab === 'availability'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-300 hover:text-white hover:bg-gray-700'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="font-medium">Availability</span>
      </button>
      <button
        onClick={() => onTabChange('streams')}
        className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
          activeTab === 'streams'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-300 hover:text-white hover:bg-gray-700'
        }`}
      >
        <Video className="w-5 h-5" />
        <span className="font-medium">Streams</span>
      </button>
      <button
        onClick={() => onTabChange('credits')}
        className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
          activeTab === 'credits'
            ? 'bg-yellow-600 text-white shadow-lg'
            : 'text-gray-300 hover:text-white hover:bg-gray-700'
        }`}
      >
        <Trophy className="w-5 h-5" />
        <span className="font-medium">Credits</span>
      </button>
      {isSpaceOwner && (
        <button
          onClick={() => onTabChange('members')}
          className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
            activeTab === 'members'
              ? 'bg-green-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Members</span>
        </button>
      )}
    </div>
  );
};