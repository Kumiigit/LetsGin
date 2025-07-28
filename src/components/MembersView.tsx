import React, { useState } from 'react';
import { Users, Crown, Shield, Mic, Eye, MoreVertical, Trash2 } from 'lucide-react';
import { Staff } from '../types';

interface Member {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'caster' | 'observer';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
}

interface MembersViewProps {
  members: Member[];
  staff: Staff[];
  onUpdateMemberRole: (membershipId: string, newRole: 'admin' | 'caster' | 'observer') => void;
  onRemoveMember: (membershipId: string) => void;
  onUpdateStaffRole?: (staffId: string, newRole: 'caster' | 'observer') => void;
  onRemoveStaff?: (staffId: string) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  staff,
  onUpdateMemberRole,
  onRemoveMember,
  onUpdateStaffRole,
  onRemoveStaff,
}) => {
  // Safety check for props
  if (!members || !staff) {
    console.error('MembersView: Missing required props', { members, staff });
    return (
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6">
        <div className="text-center py-8 text-red-400">
          <p>Error: Missing member or staff data</p>
        </div>
      </div>
    );
  }

  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Add error boundary for debugging
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('MembersView Error:', event.error);
      console.log('Current state:', { 
        membersCount: members?.length || 0, 
        staffCount: staff?.length || 0,
        showDropdown 
      });
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [members, staff, showDropdown]);

  // Debug logging
  try {
    console.log('MembersView render:', { 
      membersCount: members?.length || 0, 
      staffCount: staff?.length || 0,
      showDropdown,
      membersType: typeof members,
      staffType: typeof staff
    });
  } catch (error) {
    console.error('Error in MembersView render logging:', error);
  }

  // Log member data to see what roles we have
  try {
    members?.forEach(member => {
      console.log('Member:', member?.userName, 'Role:', member?.role, 'Type:', typeof member?.role, 'Raw member object:', member);
    });
  } catch (error) {
    console.error('Error logging members:', error);
  }

  try {
    staff?.forEach(staffMember => {
      console.log('Staff:', staffMember?.name, 'Role:', staffMember?.role, 'Type:', typeof staffMember?.role, 'Raw staff object:', staffMember);
    });
  } catch (error) {
    console.error('Error logging staff:', error);
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'caster':
        return <Mic className="w-4 h-4 text-green-500" />;
      case 'observer':
        return <Eye className="w-4 h-4 text-purple-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'caster':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'observer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Add debugging for role functions
  try {
    const testRoles = ['owner', 'admin', 'caster', 'observer', undefined, '', 'ADMIN', 'Caster'];
    console.log('Role function tests:');
    testRoles.forEach(role => {
      console.log(`Role: "${role}" -> Icon:`, getRoleIcon(role), 'Color:', getRoleColor(role));
    });
  } catch (error) {
    console.error('Error in role function tests:', error);
  }
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(null);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRoleChange = (membershipId: string, newRole: 'admin' | 'caster' | 'observer') => {
    try {
      onUpdateMemberRole(membershipId, newRole);
      setShowDropdown(null);
    } catch (error) {
      console.error('Error in handleRoleChange:', error);
    }
  };

  const handleRemoveMember = (membershipId: string) => {
    try {
      console.log('Removing member:', membershipId);
      if (confirm('Are you sure you want to remove this member from the space?')) {
        if (!onRemoveMember) {
          console.error('onRemoveMember function is not available');
          return;
        }
        onRemoveMember(membershipId);
        setShowDropdown(null);
      }
    } catch (error) {
      console.error('Error in handleRemoveMember:', error);
    }
  };

  const handleStaffRoleChange = (staffId: string, newRole: 'caster' | 'observer') => {
    try {
      console.log('Changing staff role:', staffId, newRole);
      console.log('onUpdateStaffRole function:', typeof onUpdateStaffRole);
      if (onUpdateStaffRole) {
        onUpdateStaffRole(staffId, newRole);
        setShowDropdown(null);
      } else {
        console.error('onUpdateStaffRole function is not available');
      }
    } catch (error) {
      console.error('Error in handleStaffRoleChange:', error);
    }
  };

  const handleRemoveStaff = (staffId: string) => {
    try {
      console.log('Removing staff:', staffId);
      if (confirm('Are you sure you want to remove this staff member?')) {
        if (onRemoveStaff) {
          onRemoveStaff(staffId);
          setShowDropdown(null);
        } else {
          console.error('onRemoveStaff function is not available');
        }
      }
    } catch (error) {
      console.error('Error in handleRemoveStaff:', error);
    }
  };
  const totalMembers = members?.length || 0;
  const totalStaff = staff?.length || 0;
  const staffCasters = staff?.filter(s => s?.role === 'caster')?.length || 0;
  const staffObservers = staff?.filter(s => s?.role === 'observer')?.length || 0;
  const adminCount = members?.filter(m => m?.role === 'admin')?.length || 0;

  const renderDropdownMenu = (id: string, type: 'member' | 'staff', currentRole: string) => {
    if (showDropdown !== id) return null;

    console.log('Rendering dropdown for:', id, type, currentRole);

    return (
      <div className="absolute right-0 top-8 w-48 bg-gray-700 rounded-md shadow-lg border border-gray-600 z-[100]">
        <div className="py-1">
          <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-600">
            Change Role
          </div>
          
          {type === 'member' && currentRole !== 'owner' && (
            <>
              {console.log('Member dropdown - current role:', currentRole)}
              {currentRole !== 'admin' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Admin button clicked for:', id);
                    handleRoleChange(id, 'admin');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-blue-500" />
                  Admin
                </button>
              )}
              {currentRole !== 'caster' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Caster button clicked for:', id);
                    handleRoleChange(id, 'caster');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center gap-2"
                >
                  <Mic className="w-4 h-4 text-green-500" />
                  Caster
                </button>
              )}
              {currentRole !== 'observer' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Observer button clicked for:', id);
                    handleRoleChange(id, 'observer');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 text-purple-500" />
                  Observer
                </button>
              )}
              <div className="border-t border-gray-600 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Remove member button clicked for:', id);
                    handleRemoveMember(id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Member
                </button>
              </div>
            </>
          )}
          
          {type === 'staff' && (
            <>
              {console.log('Staff dropdown - current role:', currentRole)}
              {currentRole !== 'caster' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const staffId = id.startsWith('staff-') ? id.replace('staff-', '') : id;
                    console.log('Staff caster button clicked for:', staffId);
                    handleStaffRoleChange(staffId, 'caster');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center gap-2"
                >
                  <Mic className="w-4 h-4 text-green-500" />
                  Caster
                </button>
              )}
              {currentRole !== 'observer' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const staffId = id.startsWith('staff-') ? id.replace('staff-', '') : id;
                    console.log('Staff observer button clicked for:', staffId);
                    handleStaffRoleChange(staffId, 'observer');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 text-purple-500" />
                  Observer
                </button>
              )}
              <div className="border-t border-gray-600 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const staffId = id.startsWith('staff-') ? id.replace('staff-', '') : id;
                    console.log('Remove staff button clicked for:', staffId);
                    handleRemoveStaff(staffId);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Staff
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Space Members</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-900/50 backdrop-blur-sm border border-green-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{totalMembers + totalStaff}</div>
            <div className="text-sm text-green-300">Total People</div>
          </div>
          <div className="bg-blue-900/50 backdrop-blur-sm border border-blue-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{staffCasters}</div>
            <div className="text-sm text-blue-300">Casters</div>
          </div>
          <div className="bg-purple-900/50 backdrop-blur-sm border border-purple-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{staffObservers}</div>
            <div className="text-sm text-purple-300">Observers</div>
          </div>
          <div className="bg-yellow-900/50 backdrop-blur-sm border border-yellow-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{adminCount}</div>
            <div className="text-sm text-yellow-300">Space Admins</div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Space Members & Staff</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Added</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Space Members */}
              {members.map((member) => (
                <tr key={member.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-white">{member.userName}</div>
                      <div className="text-sm text-gray-300">{member.userEmail}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getRoleColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      <span className="capitalize">
                        {member.role || <span className="text-red-500">NO ROLE</span>}
                        {!['owner', 'admin', 'caster', 'observer'].includes(member.role) && (
                          <span className="text-red-500 ml-1">(INVALID: {member.role})</span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Space Member
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : member.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="relative dropdown-container">
                      {member.role !== 'owner' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Dropdown toggle clicked for member:', member.id, 'current state:', showDropdown);
                            setShowDropdown(showDropdown === member.id ? null : member.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      )}
                      {renderDropdownMenu(member.id, 'member', member.role)}
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Staff Members */}
              {staff.map((staffMember) => (
                <tr key={`staff-${staffMember.id}`} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-white">{staffMember.name}</div>
                      <div className="text-sm text-gray-300">{staffMember.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getRoleColor(staffMember.role)}`}>
                      {getRoleIcon(staffMember.role)}
                      <span className="capitalize">
                        {staffMember.role || <span className="text-red-500">NO ROLE</span>}
                        {!['caster', 'observer'].includes(staffMember.role) && (
                          <span className="text-red-500 ml-1">(INVALID: {staffMember.role})</span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Staff Member
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    Staff
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="relative dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Dropdown toggle clicked for staff:', staffMember.id, 'current state:', showDropdown);
                          setShowDropdown(showDropdown === `staff-${staffMember.id}` ? null : `staff-${staffMember.id}`);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {renderDropdownMenu(`staff-${staffMember.id}`, 'staff', staffMember.role)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {members.length === 0 && staff.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>No members or staff found in this space.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};