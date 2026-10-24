import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogo, IconAlertTriangle } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        setError('AUTHENTICATION FAILED: Check security credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center items-center py-10 px-4">
      <div className="w-full max-w-sm">
        {/* Terminal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#181c24] border border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)] mb-3 clip-chamfer-btn">
            <IconLogo size={24} />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono tracking-widest text-[#00f0ff] uppercase">
            <span>PRTS</span>
            <span>//</span>
            <span>AUTH_GATEWAY_v4.2</span>
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-widest text-white uppercase mt-1">
            SHIFTOPS
          </h1>
          <p className="text-xs font-mono text-[#9da8b9] mt-1">
            TACTICAL SHIFT & OPERATIONS TERMINAL
          </p>
        </div>

        {/* Tactical Auth Dossier */}
        <div className="bg-[#11141a] border border-[#2a2f3d] p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] clip-chamfer-card">
          {error && (
            <div className="mb-5 p-3 rounded-sm bg-[#ff1744]/15 border border-[#ff1744]/40 flex items-start gap-2.5 text-xs font-mono text-[#ff335c]">
              <IconAlertTriangle size={15} className="text-[#ff1744] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="OPERATOR IDENTIFIER (EMAIL)"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@shiftops.com"
            />

            <Input
              label="SECURITY CLEARANCE KEY"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3 font-bold tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.25)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'VERIFYING...' : '[ INITIATE SESSION ]'}
            </Button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="mt-6 pt-5 border-t border-[#1e222b]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-mono font-bold text-[#606c80] uppercase tracking-wider">
                TACTICAL CLEARANCE SELECTOR
              </span>
              <span className="text-[10px] font-mono text-[#606c80]">PASS: Password123!</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner@shiftops.com')}
                className="py-2 px-2 text-center border border-[#e5c07b]/40 rounded-sm bg-[#161922] hover:bg-[#e5c07b]/10 hover:border-[#e5c07b] text-xs font-mono font-bold text-[#e5c07b] transition-all cursor-pointer"
              >
                [ OWNER ]
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@shiftops.com')}
                className="py-2 px-2 text-center border border-[#ff6b00]/40 rounded-sm bg-[#161922] hover:bg-[#ff6b00]/10 hover:border-[#ff6b00] text-xs font-mono font-bold text-[#ff6b00] transition-all cursor-pointer"
              >
                [ MANAGER ]
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff@shiftops.com')}
                className="py-2 px-2 text-center border border-[#00f0ff]/40 rounded-sm bg-[#161922] hover:bg-[#00f0ff]/10 hover:border-[#00f0ff] text-xs font-mono font-bold text-[#00f0ff] transition-all cursor-pointer"
              >
                [ STAFF ]
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] font-mono text-[#606c80] mt-6 tracking-wider">
          ENCRYPTED LINK · SECURE ROLE-BASED ACCESS
        </p>
      </div>
    </div>
  );
};
