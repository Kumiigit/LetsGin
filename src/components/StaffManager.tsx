import React, { useState } from 'react';
import { Users, Plus, Mail, Trash2 } from 'lucide-react';
import { Staff } from '../types';

interface StaffManagerProps {
  staff: Staff[];
  activeRole: 'caster' | 'observer';
  onAddStaff: (staff: Omit<Staff, 'id'>) => void;
  onRemoveStaff: (staffId: string) => void;
  selectedStaffId?: string;
  onSelectStaff: (staffId: string) => void;
}

export const StaffManager: React.FC<StaffManagerProps> = ({
  staff,
  activeRole,
  onAddStaff,
  onRemoveStaff,
  selectedStaffId,
  onSelectStaff,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: activeRole });

  // Update role when activeRole changes
  React.useEffect(() => {
    setNewStaff(prev => ({ ...prev, role: activeRole }));
  }, [activeRole]);

  // Filter staff by active role
  const filteredStaff = staff.filter(member => member.role === activeRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaff.name && newStaff.email) {
      onAddStaff(newStaff);
      setNewStaff({ name: '', email: '', role: '' });
      setShowAddForm(false);
    }
  };

  return (
    <div className="professional-card rounded-xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">
            {activeRole === 'caster' ? 'Casters' : 'Observers'}
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="professional-button flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add {activeRole === 'caster' ? 'Caster' : 'Observer'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="professional-card rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              className="professional-input px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              className="professional-input px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800">
              <span className="text-gray-300 capitalize">{activeRole}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="professional-button px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add {activeRole === 'caster' ? 'Caster' : 'Observer'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="professional-button px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedStaffId === member.id
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-800 professional-card hover:border-gray-600'
            }`}
            onClick={() => onSelectStaff(member.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-gray-300 mb-2 capitalize">{member.role}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  {member.email}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveStaff(member.id);
                }}
                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p>No {activeRole}s added yet. Click "Add {activeRole === 'caster' ? 'Caster' : 'Observer'}" to get started.</p>
        </div>
      )}
    </div>
  );
};