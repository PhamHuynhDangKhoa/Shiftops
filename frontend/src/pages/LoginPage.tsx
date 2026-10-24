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
        setError('Authentication failed. Please verify your credentials.');
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
          <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 text-white rounded-2xl shadow-xs mb-3">
            <IconLogo size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            ShiftOps
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Store operations & shift management deck
          </p>
        </div>

        {/* Clean Auth Card */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-7 shadow-xs">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 font-medium">
              <IconAlertTriangle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
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
              placeholder="e.g. manager@shiftops.com"
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
              size="lg"
              className="w-full mt-2 font-semibold shadow-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2.5 text-xs">
              <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[11px]">
                Demo Role Accounts
              </span>
              <span className="text-zinc-400 text-[11px]">Password123!</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner@shiftops.com')}
                className="py-2 px-2 text-center border border-zinc-200 rounded-lg bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-xs font-semibold text-zinc-800 transition-all cursor-pointer"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@shiftops.com')}
                className="py-2 px-2 text-center border border-zinc-200 rounded-lg bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-xs font-semibold text-zinc-800 transition-all cursor-pointer"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff@shiftops.com')}
                className="py-2 px-2 text-center border border-zinc-200 rounded-lg bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-xs font-semibold text-zinc-800 transition-all cursor-pointer"
              >
                Staff
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Protected by role-based access control and JWT session encryption.
        </p>
      </div>
    </div>
  );
};
