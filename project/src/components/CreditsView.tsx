import React, { useState } from 'react';
import { Trophy, Plus, Minus, Award, History, Users, TrendingUp } from 'lucide-react';
import { Staff, StaffCredits, CreditTransaction } from '../types';

interface CreditsViewProps {
  staff: Staff[];
  credits: StaffCredits[];
  transactions: CreditTransaction[];
  onAdjustCredits: (staffId: string, amount: number, reason: string) => void;
  isSpaceOwner?: boolean;
}

export const CreditsView: React.FC<CreditsViewProps> = ({
  staff,
  credits,
  transactions,
  onAdjustCredits,
  isSpaceOwner = false,
}) => {
  const [showAdjustForm, setShowAdjustForm] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Get staff member by ID
  const getStaffById = (id: string) => staff.find(s => s.id === id);

  // Get credits for staff member
  const getCreditsForStaff = (staffId: string) => {
    return credits.find(c => c.staffId === staffId)?.credits || 0;
  };

  // Create leaderboard data
  const leaderboardData = staff.map(member => ({
    ...member,
    credits: getCreditsForStaff(member.id),
  })).sort((a, b) => b.credits - a.credits);

  // Separate casters and observers
  const casterLeaderboard = leaderboardData.filter(member => member.role === 'caster');
  const observerLeaderboard = leaderboardData.filter(member => member.role === 'observer');

  // Recent transactions
  const recentTransactions = transactions.slice(0, 10);

  const handleAdjustSubmit = (staffId: string) => {
    if (adjustAmount !== 0 && adjustReason.trim()) {
      onAdjustCredits(staffId, adjustAmount, adjustReason)
        .then(() => {
          setShowAdjustForm(null);
          setAdjustAmount(0);
          setAdjustReason('');
        })
        .catch((error) => {
          console.error('Failed to adjust credits:', error);
          alert('Failed to adjust credits. Please try again.');
        });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Award className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{index + 1}</span>;
    }
  };

  const totalCredits = credits.reduce((sum, credit) => sum + credit.credits, 0);
  const totalTransactions = transactions.length;
  const avgCreditsPerStaff = staff.length > 0 ? Math.round(totalCredits / staff.length) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-semibold text-white">Credits System</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-900/50 backdrop-blur-sm border border-yellow-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{totalCredits}</div>
            <div className="text-sm text-yellow-300">Total Credits Awarded</div>
          </div>
          <div className="bg-blue-900/50 backdrop-blur-sm border border-blue-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{avgCreditsPerStaff}</div>
            <div className="text-sm text-blue-300">Average per Staff</div>
          </div>
          <div className="bg-green-900/50 backdrop-blur-sm border border-green-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{totalTransactions}</div>
            <div className="text-sm text-green-300">Total Transactions</div>
          </div>
          <div className="bg-purple-900/50 backdrop-blur-sm border border-purple-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {transactions.filter(t => t.reason === 'Stream completion bonus').length}
            </div>
            <div className="text-sm text-purple-300">Stream Bonuses</div>
          </div>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Caster Leaderboard */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Caster Leaderboard</h3>
          </div>
          
          <div className="space-y-3">
            {casterLeaderboard.map((caster, index) => (
              <div key={caster.id} className="flex items-center justify-between p-3 bg-gray-700/50 backdrop-blur-sm rounded-lg">
                <div className="flex items-center gap-3">
                  {getRankIcon(index)}
                  <div>
                    <div className="font-medium text-white">{caster.name}</div>
                    <div className="text-sm text-gray-300">{caster.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{caster.credits}</div>
                    <div className="text-xs text-gray-400">credits</div>
                  </div>
                  {isSpaceOwner && (
                    <button
                      onClick={() => setShowAdjustForm(caster.id)}
                      className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
                      title="Adjust Credits"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observer Leaderboard */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Observer Leaderboard</h3>
          </div>
          
          <div className="space-y-3">
            {observerLeaderboard.map((observer, index) => (
              <div key={observer.id} className="flex items-center justify-between p-3 bg-gray-700/50 backdrop-blur-sm rounded-lg">
                <div className="flex items-center gap-3">
                  {getRankIcon(index)}
                  <div>
                    <div className="font-medium text-white">{observer.name}</div>
                    <div className="text-sm text-gray-300">{observer.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">{observer.credits}</div>
                    <div className="text-xs text-gray-400">credits</div>
                  </div>
                  {isSpaceOwner && (
                    <button
                      onClick={() => setShowAdjustForm(observer.id)}
                      className="p-1 text-gray-500 hover:text-purple-400 transition-colors"
                      title="Adjust Credits"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-300">Staff Member</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-300">Amount</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-300">Reason</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => {
                const staffMember = getStaffById(transaction.staffId);
                return (
                  <tr key={transaction.id} className="border-b border-gray-700">
                    <td className="py-2 px-3">
                      <div className="font-medium text-white">{staffMember?.name}</div>
                      <div className="text-sm text-gray-300 capitalize">({staffMember?.role})</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`font-medium ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-300">{transaction.reason}</td>
                    <td className="py-2 px-3 text-sm text-gray-400">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {recentTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>No transactions yet. Credits will appear here when awarded.</p>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Credits Modal */}
      {showAdjustForm && isSpaceOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Adjust Credits</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Staff Member
                  </label>
                  <div className="p-3 bg-gray-700 rounded-md">
                    <div className="font-medium text-white">
                      {getStaffById(showAdjustForm)?.name}
                    </div>
                    <div className="text-sm text-gray-300">
                      Current Credits: {getCreditsForStaff(showAdjustForm)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustAmount(-5)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md border transition-colors ${
                        adjustAmount === -5
                          ? 'border-red-500 bg-red-900/50 text-red-300'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                      5
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAmount(5)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md border transition-colors ${
                        adjustAmount === 5
                          ? 'border-green-500 bg-green-900/50 text-green-300'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      5
                    </button>
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Custom amount"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g., Manual adjustment, Bonus, Penalty"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleAdjustSubmit(showAdjustForm)}
                  disabled={adjustAmount === 0 || !adjustReason.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Apply Adjustment
                </button>
                <button
                  onClick={() => {
                    setShowAdjustForm(null);
                    setAdjustAmount(0);
                    setAdjustReason('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};