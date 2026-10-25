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
    <div className="min-h-screen w-full bg-[#f6f5f1] text-[#181a1b] flex flex-col justify-center items-center py-8 px-4 sm:px-6 relative overflow-hidden selection:bg-[#e11d48] selection:text-white">
      {/* Editorial Graphic Motifs: Intersecting Red Circles & Concentric Compass Rings */}
      <div className="absolute -top-28 -left-28 w-88 h-88 rounded-full bg-[#e11d48] pointer-events-none opacity-95" />
      <div className="absolute top-8 left-8 w-52 h-52 rounded-full border border-[#181a1b]/15 pointer-events-none hidden sm:block" />
      <div className="absolute top-14 left-14 w-40 h-40 rounded-full border border-[#181a1b]/10 pointer-events-none hidden sm:block" />
      
      {/* Subtle intersecting line art on bottom right */}
      <div className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full border-2 border-[#e11d48]/20 pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 my-auto">
        {/* Top Editorial Brand Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 pb-4 border-b border-[#ded7cc]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e11d48] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <IconLogo size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#181a1b]">
                ShiftOps
              </h1>
              <p className="text-xs text-[#666159] mt-0.5">
                Store operations and workforce coordination deck
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#666159]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf7f2] border border-[#ded7cc]">
              <span className="w-2 h-2 rounded-full bg-[#e11d48]" />
              <span className="font-medium text-[#181a1b]">Operations deck</span>
            </span>
            <span className="text-[#ded7cc]">/</span>
            <span>Port 8080</span>
          </div>
        </div>

        {/* Dual Column Layout: Editorial Overview on Left, Charcoal Slate on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Editorial Feature Plate (Paper Card) */}
          <div className="hidden lg:flex lg:col-span-6 bg-[#faf7f2] border border-[#ded7cc] rounded-2xl p-7 xl:p-8 flex-col justify-between relative overflow-hidden shadow-xs">
            <div>
              {/* Concentric compass illustration inspired by reference */}
              <div className="w-20 h-20 rounded-full border border-[#181a1b]/20 flex items-center justify-center mb-5 relative">
                <div className="w-14 h-14 rounded-full border border-[#181a1b]/30 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#e11d48] text-white flex items-center justify-center text-xs font-bold">
                    SO
                  </div>
                </div>
              </div>

              <div className="text-xs font-bold text-[#e11d48] uppercase tracking-wide mb-1.5">
                Shift fleet orchestration
              </div>

              <h2 className="text-2xl xl:text-3xl font-bold tracking-tight text-[#181a1b] leading-tight mb-2.5">
                Precision store coordination
              </h2>

              <p className="text-sm text-[#666159] leading-relaxed mb-6">
                Active shift rosters, real-time floor attendance, structured turnover debriefs, and incident triage designed for modern retail fleets.
              </p>

              {/* 3 Editorial Feature Strips with Arrows */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#f6f5f1] border border-[#ded7cc] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#181a1b]">Roster dispatch</div>
                    <div className="text-xs text-[#666159]">Live schedules & floor attendance</div>
                  </div>
                  <span className="text-sm text-[#e11d48] font-bold">→</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f6f5f1] border border-[#ded7cc] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#181a1b]">Shift turnover debrief</div>
                    <div className="text-xs text-[#666159]">Cash float & handover notes</div>
                  </div>
                  <span className="text-sm text-[#e11d48] font-bold">→</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f6f5f1] border border-[#ded7cc] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#181a1b]">Floor incident triage</div>
                    <div className="text-xs text-[#666159]">Real-time operational escalation</div>
                  </div>
                  <span className="text-sm text-[#e11d48] font-bold">→</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#ded7cc] flex items-center justify-between text-xs text-[#666159]">
              <span>JWT session encryption</span>
              <span>Level 4 clearance</span>
            </div>
          </div>

          {/* Right Column: Charcoal Slate Auth Card (Matching Reference Reader Card) */}
          <div className="w-full lg:col-span-6 bg-[#1f2326] border border-[#31363a] rounded-2xl p-6 sm:p-8 text-white relative shadow-md flex flex-col justify-between">
            {/* Top red circular corner pip */}
            <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-[#e11d48]" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#e11d48] tracking-wide uppercase">
                  Clearance Access
                </span>
                <span className="text-xs text-[#cbd5e1]">· ShiftOps v2.4</span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
                Sign in to operations
              </h2>
              <p className="text-xs text-[#cbd5e1] mb-6">
                Pick a demo role clearance below or enter operator credentials.
              </p>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 bg-[#331c1f] border-l-3 border-l-[#c5221f] border border-[#c5221f]/30 rounded-lg flex items-start gap-2.5 text-xs text-[#fce8e6]">
                  <IconAlertTriangle size={15} className="text-[#c5221f] flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quick Role Clearance Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5 text-xs">
                  <span className="font-semibold text-[#cbd5e1]">Role clearance</span>
                  <span className="text-xs text-[#cbd5e1]">Pass: Password123!</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('OWNER', 'owner@shiftops.com')}
                    onDoubleClick={() => handleQuickSignIn('OWNER', 'owner@shiftops.com')}
                    title="Click to select, double-click to sign in instantly"
                    className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedRole === 'OWNER'
                        ? 'bg-[#2a2f33] border-[#e11d48] text-white shadow-xs'
                        : 'bg-[#181b1d] border-[#31363a] text-[#cbd5e1] hover:text-white hover:border-[#43494e]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Owner</span>
                      {selectedRole === 'OWNER' && <IconCheck size={12} className="text-[#e11d48]" />}
                    </div>
                    <span className="text-xs text-[#9a9fa3] block mt-0.5">Executive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('MANAGER', 'manager@shiftops.com')}
                    onDoubleClick={() => handleQuickSignIn('MANAGER', 'manager@shiftops.com')}
                    title="Click to select, double-click to sign in instantly"
                    className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedRole === 'MANAGER'
                        ? 'bg-[#2a2f33] border-[#e11d48] text-white shadow-xs'
                        : 'bg-[#181b1d] border-[#31363a] text-[#cbd5e1] hover:text-white hover:border-[#43494e]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Manager</span>
                      {selectedRole === 'MANAGER' && <IconCheck size={12} className="text-[#e11d48]" />}
                    </div>
                    <span className="text-xs text-[#9a9fa3] block mt-0.5">Supervisor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('STAFF', 'staff@shiftops.com')}
                    onDoubleClick={() => handleQuickSignIn('STAFF', 'staff@shiftops.com')}
                    title="Click to select, double-click to sign in instantly"
                    className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedRole === 'STAFF'
                        ? 'bg-[#2a2f33] border-[#e11d48] text-white shadow-xs'
                        : 'bg-[#181b1d] border-[#31363a] text-[#cbd5e1] hover:text-white hover:border-[#43494e]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Staff</span>
                      {selectedRole === 'STAFF' && <IconCheck size={12} className="text-[#e11d48]" />}
                    </div>
                    <span className="text-xs text-[#9a9fa3] block mt-0.5">Floor Ops</span>
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#cbd5e1] mb-1.5">
                    Operator email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@shiftops.com"
                    className="w-full bg-[#181b1d] border border-[#31363a] text-white placeholder-[#6c7278] text-xs px-3.5 py-2.5 rounded-xl transition-colors duration-150 focus:outline-none focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-[#cbd5e1]">
                      Passcode key
                    </label>
                    <span className="text-xs text-[#e11d48]">JWT secure</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#181b1d] border border-[#31363a] text-white placeholder-[#6c7278] text-xs px-3.5 py-2.5 rounded-xl transition-colors duration-150 focus:outline-none focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48]"
                  />
                </div>

                {/* Primary Action Button with Arrow */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#e11d48] hover:bg-[#c9183d] active:translate-y-0.5 text-white font-bold text-sm py-3 px-6 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 border-none"
                  >
                    {isSubmitting ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <span>Enter Operations Deck as {selectedRole === 'OWNER' ? 'Owner' : selectedRole === 'MANAGER' ? 'Manager' : 'Staff'}</span>
                        <span className="text-base font-bold">→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-5 mt-6 border-t border-[#31363a] flex items-center justify-between text-xs text-[#cbd5e1]">
              <span>Authorized personnel only</span>
              <span>Port 8080 active</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-[#666159] mt-6">
          ShiftOps operations portal · Protected by role-based access control.
        </p>
      </div>
    </div>
  );
};
