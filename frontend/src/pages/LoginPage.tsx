import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogo, IconAlertTriangle, IconCheck } from '../components/ui/Icons';

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

  const handleQuickSignIn = async (role: 'OWNER' | 'MANAGER' | 'STAFF', quickEmail: string) => {
    setSelectedRole(role);
    setEmail(quickEmail);
    setPassword('Password123!');
    setError(null);
    setIsSubmitting(true);
    try {
      await login(quickEmail, 'Password123!');
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

  return (
    <div className="min-h-screen w-full bg-[#f9fbfc] text-[#131416] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-4xl my-auto">
        {/* Top Operational Brand Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 pb-4 border-b border-[#e8eaec]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1b6c80] text-white flex items-center justify-center font-semibold text-sm">
              <IconLogo size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#131416]">
                ShiftOps
              </h1>
              <p className="text-sm text-[#5d5f60] mt-0.5">
                Store operations and workforce coordination deck
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#5d5f60]">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#ffffff] border border-[#e8eaec]">
              <span className="w-2 h-2 rounded-full bg-[#1e7b4f]" aria-hidden="true" />
              <span className="font-medium text-[#131416]">Operations active</span>
            </span>
            <span className="text-[#cdced1]" aria-hidden="true">/</span>
            <span className="tabular-nums">Port 8080</span>
          </div>
        </header>

        {/* Dual Column Layout: Editorial Overview on Left, Auth Form on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Platform Overview */}
          <div className="hidden lg:flex lg:col-span-6 bg-[#ffffff] border border-[#e8eaec] rounded-xl p-7 flex-col">
            <div>
              <div className="text-sm font-medium text-[#1b6c80] mb-2">
                Shift fleet orchestration
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-[#131416] mb-3">
                Precision store coordination
              </h2>

              <p className="text-sm text-[#5d5f60] leading-relaxed mb-6">
                Active shift rosters, real-time floor attendance, structured turnover debriefs, and incident triage designed for modern retail fleets.
              </p>

              {/* Operational Feature Strips */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#f4f6f8] border border-[#e8eaec] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#131416]">Roster dispatch</div>
                    <div className="text-sm text-[#5d5f60]">Live schedules & floor attendance</div>
                  </div>
                  <span className="text-sm text-[#1b6c80] font-semibold" aria-hidden="true">→</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#f4f6f8] border border-[#e8eaec] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#131416]">Shift turnover debrief</div>
                    <div className="text-sm text-[#5d5f60]">Cash float & handover notes</div>
                  </div>
                  <span className="text-sm text-[#1b6c80] font-semibold" aria-hidden="true">→</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#f4f6f8] border border-[#e8eaec] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#131416]">Floor incident triage</div>
                    <div className="text-sm text-[#5d5f60]">Real-time operational escalation</div>
                  </div>
                  <span className="text-sm text-[#1b6c80] font-semibold" aria-hidden="true">→</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#f0f1f2] flex items-center justify-between text-xs text-[#5d5f60]">
              <span>Session encrypted</span>
              <span>Level 4 clearance</span>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="w-full lg:col-span-6 bg-[#ffffff] border border-[#e8eaec] rounded-xl p-6 sm:p-7 text-[#131416] flex flex-col">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium text-[#1b6c80]">
                  Clearance access
                </span>
                <span className="text-xs text-[#5d5f60]">· ShiftOps v2.4</span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-[#131416] mb-1.5">
                Sign in to operations
              </h2>
              <p className="text-sm text-[#5d5f60] mb-5">
                Pick a demo role clearance below or enter operator credentials.
              </p>

              {/* Error Alert */}
              {error && (
                <div role="alert" className="mb-4 p-3 bg-[#ffedea] border-l-3 border-[#c4242a] border border-[#c4242a]/20 rounded-md flex items-start gap-2.5 text-sm text-[#831c1e]">
                  <IconAlertTriangle size={16} className="text-[#c4242a] flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quick Role Clearance Selector */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-semibold text-[#131416]">Role clearance</span>
                  <span className="text-xs text-[#5d5f60]">Default: Password123!</span>
                </div>

                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Role clearance selector">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedRole === 'OWNER'}
                    aria-label="Sign in as Owner, Executive role"
                    onClick={() => handleSelectRole('OWNER', 'owner@shiftops.com')}
                    onDoubleClick={() => handleQuickSignIn('OWNER', 'owner@shiftops.com')}
                    title="Click to select, double-click to sign in instantly"
                    className={`p-2.5 text-left rounded-lg border transition-colors cursor-pointer ${
                      selectedRole === 'OWNER'
                        ? 'bg-[#e9f4f7] border-[#1b6c80] text-[#131416]'
                        : 'bg-[#ffffff] border-[#e8eaec] text-[#5d5f60] hover:text-[#131416] hover:border-[#cdced1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#131416]">Owner</span>
                      {selectedRole === 'OWNER' && <IconCheck size={12} className="text-[#1b6c80]" />}
                    </div>
                    <span className="text-xs text-[#5d5f60] block mt-0.5">Executive</span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedRole === 'MANAGER'}
                    aria-label="Sign in as Manager, Supervisor role"
                    onClick={() => handleSelectRole('MANAGER', 'manager@shiftops.com')}
                    onDoubleClick={() => handleQuickSignIn('MANAGER', 'manager@shiftops.com')}
                    title="Click to select, double-click to sign in instantly"
                    className={`p-2.5 text-left rounded-lg border transition-colors cursor-pointer ${
                      selectedRole === 'MANAGER'
                        ? 'bg-[#e9f4f7] border-[#1b6c80] text-[#131416]'
                        : 'bg-[#ffffff] border-[#e8eaec] text-[#5d5f60] hover:text-[#131416] hover:border-[#cdced1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#131416]">Manager</span>
                      {selectedRole === 'MANAGER' && <IconCheck size={12} className="text-[#1b6c80]" />}
                    </div>
                    <span className="text-xs text-[#5d5f60] block mt-0.5">Supervisor</span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedRole === 'STAFF'}
                    aria-label="Sign in as Staff, Floor Operations role"
                    onClick={() => handleSelectRole('STAFF', 'staff@shiftops.com')}
                    onDoubleClick={() => handleQuickSignIn('STAFF', 'staff@shiftops.com')}
                    title="Click to select, double-click to sign in instantly"
                    className={`p-2.5 text-left rounded-lg border transition-colors cursor-pointer ${
                      selectedRole === 'STAFF'
                        ? 'bg-[#e9f4f7] border-[#1b6c80] text-[#131416]'
                        : 'bg-[#ffffff] border-[#e8eaec] text-[#5d5f60] hover:text-[#131416] hover:border-[#cdced1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#131416]">Staff</span>
                      {selectedRole === 'STAFF' && <IconCheck size={12} className="text-[#1b6c80]" />}
                    </div>
                    <span className="text-xs text-[#5d5f60] block mt-0.5">Floor Ops</span>
                  </button>
                </div>
              </div>

              {/* Form Inputs with explicit accessibility associations */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="operator-email" className="block text-sm font-medium text-[#131416] mb-1.5">
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
                    className="w-full bg-[#ffffff] border border-[#cdced1] text-[#131416] placeholder-[#727477] text-sm px-3 py-2 rounded-md transition-colors focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="operator-password" className="block text-sm font-medium text-[#131416]">
                      Passcode key
                    </label>
                    <span className="text-xs text-[#1b6c80] font-medium">JWT secure</span>
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
                    className="w-full bg-[#ffffff] border border-[#cdced1] text-[#131416] placeholder-[#727477] text-sm px-3 py-2 rounded-md transition-colors focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
                  />
                </div>

                {/* Primary Action Button with Arrow */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1b6c80] hover:bg-[#155464] text-white font-medium text-sm py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
                  >
                    {isSubmitting ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <span>Enter Operations Deck as {selectedRole === 'OWNER' ? 'Owner' : selectedRole === 'MANAGER' ? 'Manager' : 'Staff'}</span>
                        <span className="text-base font-semibold" aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-5 mt-6 border-t border-[#f0f1f2] flex items-center justify-between text-xs text-[#5d5f60]">
              <span>Authorized personnel only</span>
              <span>Port 8080 active</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-[#5d5f60] mt-8">
          ShiftOps operations portal · Protected by role-based access control.
        </p>
      </div>
    </div>
  );
};
