import React, { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ApiResponse, User } from '../lib/types';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile edit states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsUpdatingProfile(true);

    try {
      const res = await api.put<ApiResponse<User>>('/auth/profile', {
        fullName,
        phone: phone || undefined,
      });
      if (res.data.success) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        await refreshUser();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProfileMsg({ type: 'error', text: err.message });
      } else {
        setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await api.post<ApiResponse<User>>('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      if (res.data.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully! Temporary password cleared.' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await refreshUser();
      }
    } catch (err: unknown) {
      // Axios error response data extraction
      const anyErr = err as { response?: { data?: { error?: { message?: string } } } };
      const errMsg = anyErr.response?.data?.error?.message || (err instanceof Error ? err.message : 'Failed to change password');
      setPasswordMsg({ type: 'error', text: errMsg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#111827' }}>
        My Profile & Settings
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
        Manage your personal information and account credentials
      </p>

      {/* Account Info Summary Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: '#111827' }}>{user?.fullName}</h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{user?.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: '#eff6ff',
                color: '#2563eb',
              }}
            >
              Role: {user?.role}
            </span>
            {user?.primaryBranchName && (
              <span
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                }}
              >
                📍 {user.primaryBranchName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Personal Profile Form */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Personal Details</h2>

          {profileMsg && (
            <div
              style={{
                backgroundColor: profileMsg.type === 'success' ? '#ecfdf5' : '#fee2e2',
                border: `1px solid ${profileMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                color: profileMsg.type === 'success' ? '#065f46' : '#b91c1c',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555-0100"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: isUpdatingProfile ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
              }}
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Change Password</h2>

          {passwordMsg && (
            <div
              style={{
                backgroundColor: passwordMsg.type === 'success' ? '#ecfdf5' : '#fee2e2',
                border: `1px solid ${passwordMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                color: passwordMsg.type === 'success' ? '#065f46' : '#b91c1c',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Current Password *
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current or temporary password"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                New Password * <span style={{ color: '#6b7280', fontWeight: 400 }}>(min 8 characters)</span>
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new permanent password"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#111827',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
              }}
            >
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
