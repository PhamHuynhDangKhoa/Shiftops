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
        setError('Login failed. Please check your credentials.');
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
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-950 text-white shadow-xs mb-3">
            <IconLogo size={20} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950">ShiftOps</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Operations & Shift Coordination Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200/90 flex items-start gap-2.5 text-xs text-rose-800">
              <IconAlertTriangle size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@shiftops.com"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign in to ShiftOps'}
            </Button>
          </form>

          {/* Quick Demo Segment */}
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                Demo Quick Access
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Default pass: Password123!</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner@shiftops.com')}
                className="py-1.5 px-2 text-center border border-zinc-200 rounded-md bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-xs font-medium text-zinc-700 transition-colors cursor-pointer"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@shiftops.com')}
                className="py-1.5 px-2 text-center border border-zinc-200 rounded-md bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-xs font-medium text-zinc-700 transition-colors cursor-pointer"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff@shiftops.com')}
                className="py-1.5 px-2 text-center border border-zinc-200 rounded-md bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-xs font-medium text-zinc-700 transition-colors cursor-pointer"
              >
                Staff
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] font-mono text-zinc-400 mt-6">
          Encrypted Session · Role-Based Access Control
        </p>
      </div>
    </div>
  );
};
