import React, { useState } from 'react';
import { User, Lock, Mail, UserPlus, LogIn, Shield, Users, Search } from 'lucide-react';

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, fullName: string, adminPassword?: string) => Promise<void>;
  onModeChange: (mode: 'host' | 'join') => void;
  error: string | null;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  onSignIn,
  onSignUp,
  onModeChange,
  error,
}) => {
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      if (isSignUp) {
        await onSignUp(email, password, fullName, mode === 'host' ? adminPassword : undefined);
      } else {
        await onSignIn(email, password);
      }
      
      // If successful and not signing up, set the mode
      if (!isSignUp) {
        onModeChange(mode as 'host' | 'join');
      }
    } catch (err) {
      // Error is handled by the parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleModeSelect = (selectedMode: 'host' | 'join') => {
    setMode(selectedMode);
    setIsSignUp(false);
    setEmail('');
    setPassword('');
    setFullName('');
    setAdminPassword('');
  };

  const handleBack = () => {
    setMode('select');
    setIsSignUp(false);
    setEmail('');
    setPassword('');
    setFullName('');
    setAdminPassword('');
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 w-full max-w-md mx-4">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Shield className="w-12 h-12 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Staff Availability Manager
              </h1>
              <p className="text-gray-300">
                Choose how you'd like to use the platform
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleModeSelect('host')}
                className="w-full p-6 bg-blue-600/20 border-2 border-blue-600 rounded-lg hover:bg-blue-600/30 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <Users className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">Host Spaces</h3>
                    <p className="text-sm text-gray-300">Create and manage your own spaces with full admin control</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleModeSelect('join')}
                className="w-full p-6 bg-purple-600/20 border-2 border-purple-600 rounded-lg hover:bg-purple-600/30 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <Search className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">Join Spaces</h3>
                    <p className="text-sm text-gray-300">Browse and request to join existing spaces</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 w-full max-w-md mx-4">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {mode === 'host' ? (
                <Users className="w-12 h-12 text-blue-400" />
              ) : (
                <Search className="w-12 h-12 text-purple-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {mode === 'host' ? 'Host Spaces' : 'Join Spaces'}
            </h1>
            <p className="text-gray-300">
              {isSignUp ? 'Create your account' : 'Sign in to continue'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {isSignUp && mode === 'host' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter admin password"
                    required={isSignUp && mode === 'host'}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Required to create and host spaces
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
            
            <div>
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                ← Back to mode selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};