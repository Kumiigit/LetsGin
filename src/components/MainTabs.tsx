export const MainTabs: React.FC<MainTabsProps> = ({
  activeTab,
  onTabChange,
  isSpaceOwner = false,
}) => {
  return (
    <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-800 p-1 inline-flex mb-8">
      <button
        onClick={() => onTabChange('availability')}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
          activeTab === 'availability'
            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
      >
        <Calendar className="w-5 h-5" />
        Availability
      </button>
      <button
        onClick={() => onTabChange('streams')}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
          activeTab === 'streams'
            ? 'bg-purple-600 text-white shadow-lg transform scale-105'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
      >
        <Video className="w-5 h-5" />
        Streams
      </button>
      <button
        onClick={() => onTabChange('credits')}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
          activeTab === 'credits'
            ? 'bg-yellow-600 text-white shadow-lg transform scale-105'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
      >
        <Trophy className="w-5 h-5" />
        Credits
      </button>
      {isSpaceOwner && (
        <button
          onClick={() => onTabChange('members')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
            activeTab === 'members'
              ? 'bg-green-600 text-white shadow-lg transform scale-105'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Users className="w-5 h-5" />
          Members
        </button>
      )}
    </div>
  );
};