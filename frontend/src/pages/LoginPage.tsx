import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div
      style={{
        maxWidth: '440px',
        margin: '3rem auto',
        padding: '2.5rem',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Welcome to ShiftOps
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Sign in to access your branch and shifts
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.35rem' }}>
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. owner@shiftops.com"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.35rem' }}>
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1rem',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div
        style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.75rem 0', textAlign: 'center', fontWeight: 500 }}>
          Quick Demo Credentials (Password: Password123!)
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => handleQuickLogin('owner@shiftops.com')}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '4px',
              border: '1px solid #c4b5fd',
              backgroundColor: '#f5f3ff',
              color: '#6d28d9',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Owner
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('manager@shiftops.com')}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '4px',
              border: '1px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Manager
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('staff@shiftops.com')}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '4px',
              border: '1px solid #a7f3d0',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Staff
          </button>
        </div>
      </div>
    </div>
  );
};
