import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogo, IconAlertTriangle } from '../components/ui/Icons';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('manager@shiftops.com');
  const [password, setPassword] = useState('Password123!');
  const [selectedRole, setSelectedRole] = useState<'OWNER' | 'MANAGER' | 'STAFF'>('MANAGER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRole = (role: 'OWNER' | 'MANAGER' | 'STAFF', quickEmail: string) => {
    setSelectedRole(role);
    setEmail(quickEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5f7] text-[#1d1d1f] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-4xl mx-auto my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Store Fleet Identity (Apple Store Manager aesthetic) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-6">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-lg mb-4">
                <IconLogo size={22} />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] leading-tight">
                ShiftOps
              </div>
              <p className="text-sm text-[#48484a] mt-2 leading-relaxed">
                Precision store coordination and live workforce operations for retail and hospitality teams.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 bg-white border border-[#e5e5ea] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-[#1d1d1f] block">Floor Scheduling</span>
                  <span className="text-sm text-[#48484a]">Live rosters & time tracking</span>
                </div>
                <span className="text-sm font-semibold text-[#1d1d1f]">→</span>
              </div>

              <div className="p-3.5 bg-white border border-[#e5e5ea] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-[#1d1d1f] block">Shift Handover</span>
                  <span className="text-sm text-[#48484a]">Cash float & debrief logs</span>
                </div>
                <span className="text-sm font-semibold text-[#1d1d1f]">→</span>
              </div>

              <div className="p-3.5 bg-white border border-[#e5e5ea] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-[#1d1d1f] block">Routine Compliance</span>
                  <span className="text-sm text-[#48484a]">Operational task execution</span>
                </div>
                <span className="text-sm font-semibold text-[#1d1d1f]">→</span>
              </div>
            </div>

            <div className="pt-2 text-sm text-[#48484a]">
              <span>Active branch: Shibuya Flagship</span>
            </div>
          </div>

          {/* Right Column: Apple-style Centered Auth Card */}
          <div className="w-full lg:col-span-7 bg-white border border-[#e5e5ea] rounded-2xl p-6 sm:p-8">
            <div className="mb-6">
              <div className="lg:hidden flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-sm">
                  <IconLogo size={20} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#1d1d1f]">ShiftOps</div>
                  <p className="text-xs text-[#48484a]">Store workforce coordination</p>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">
                Sign in to your shift
              </h1>
              <p className="text-sm text-[#48484a] mt-1">
                Select a demo operator role or enter your credentials.
              </p>
            </div>

            {/* Quick Demo Role Picker (Apple Segmented Control) */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1d1d1f]">Demo Role</span>
                <span className="text-xs text-[#48484a]">Default: Password123!</span>
              </div>

              <div
                className="bg-[#f2f2f7] p-1 rounded-xl flex items-center gap-1"
                role="radiogroup"
                aria-label="Role selector"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === 'MANAGER'}
                  aria-label="Sign in as Manager"
                  onClick={() => handleSelectRole('MANAGER', 'manager@shiftops.com')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-center ${
                    selectedRole === 'MANAGER'
                      ? 'bg-white text-[#1d1d1f] border border-[#e5e5ea]'
                      : 'text-[#48484a] hover:text-[#1d1d1f] border border-transparent'
                  }`}
                >
                  Manager
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === 'STAFF'}
                  aria-label="Sign in as Store Staff"
                  onClick={() => handleSelectRole('STAFF', 'staff@shiftops.com')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-center ${
                    selectedRole === 'STAFF'
                      ? 'bg-white text-[#1d1d1f] border border-[#e5e5ea]'
                      : 'text-[#48484a] hover:text-[#1d1d1f] border border-transparent'
                  }`}
                >
                  Store Staff
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === 'OWNER'}
                  aria-label="Sign in as Executive Owner"
                  onClick={() => handleSelectRole('OWNER', 'owner@shiftops.com')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-center ${
                    selectedRole === 'OWNER'
                      ? 'bg-white text-[#1d1d1f] border border-[#e5e5ea]'
                      : 'text-[#48484a] hover:text-[#1d1d1f] border border-transparent'
                  }`}
                >
                  Executive
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div role="alert" className="mb-4 p-3 bg-[#fff2f2] border border-[#ff3b30]/20 rounded-xl flex items-start gap-2.5 text-xs text-[#d70015]">
                <IconAlertTriangle size={15} className="text-[#d70015] flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="operator-email" className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  Operator email
                </label>
                <input
                  id="operator-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@shiftops.com"
                  autoComplete="email"
                  className="w-full h-11 bg-white border border-[#d1d1d6] text-[#1d1d1f] placeholder-[#48484a] text-sm px-3.5 rounded-xl transition-colors focus:outline-none focus:border-[#1d1d1f] focus:ring-1 focus:ring-[#1d1d1f]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="operator-password" className="block text-sm font-medium text-[#1d1d1f]">
                    Passcode key
                  </label>
                  <span className="text-xs text-[#48484a]">Encrypted</span>
                </div>
                <input
                  id="operator-password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 bg-white border border-[#d1d1d6] text-[#1d1d1f] placeholder-[#48484a] text-sm px-3.5 rounded-xl transition-colors focus:outline-none focus:border-[#1d1d1f] focus:ring-1 focus:ring-[#1d1d1f]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#1d1d1f] hover:bg-[#323236] text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
                >
                  {isSubmitting ? (
                    <span>Signing in...</span>
                  ) : (
                    <span>Continue to Operations as {selectedRole === 'OWNER' ? 'Executive' : selectedRole === 'MANAGER' ? 'Manager' : 'Staff'}</span>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-4 mt-6 border-t border-[#f2f2f7] flex items-center justify-between text-xs text-[#48484a]">
              <span>Authorized personnel only</span>
              <span>Shibuya Fleet</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-[#48484a] mt-8">
          ShiftOps Enterprise Operations · Protected by role-based access control.
        </p>
      </div>
    </div>
  );
};
