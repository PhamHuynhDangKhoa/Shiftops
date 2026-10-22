import React, { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ApiResponse, User } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import {
  IconUser,
  IconMapPin,
  IconKey,
  IconCheck,
  IconAlertTriangle,
} from '../components/ui/Icons';

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
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
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
        setPasswordMsg({ type: 'success', text: 'Password updated. Temporary password requirement cleared.' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await refreshUser();
      }
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { error?: { message?: string } } } };
      const errMsg = anyErr.response?.data?.error?.message || (err instanceof Error ? err.message : 'Failed to change password');
      setPasswordMsg({ type: 'error', text: errMsg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950 flex items-center gap-2">
          <IconUser size={20} className="text-zinc-950" />
          <span>User Profile & Security</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage your personal identity credentials, contact information, and session password
        </p>
      </div>

      {/* Account Info Summary Card */}
      <Card compact className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">{user?.fullName}</h2>
            <p className="text-xs font-mono text-zinc-500 mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" size="sm">
              {user?.role}
            </Badge>
            {user?.primaryBranchName && (
              <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                <IconMapPin size={11} className="text-zinc-400" />
                {user.primaryBranchName}
              </span>
            )}
            {user?.mustChangePassword && (
              <Badge variant="urgent" size="sm">
                Password Change Required
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Details Form */}
        <Card className="p-5 space-y-4">
          <div className="pb-2 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-950">Personal Details</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Keep your operational contact information current</p>
          </div>

          {profileMsg && (
            <div
              className={`p-3 rounded-md text-xs border flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                  : 'bg-rose-50 text-rose-800 border-rose-200/90'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <IconCheck size={14} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <IconAlertTriangle size={14} className="text-rose-600 flex-shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full Name *"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Contact Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555-0100"
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Details'}
            </Button>
          </form>
        </Card>

        {/* Change Password Form */}
        <Card className="p-5 space-y-4">
          <div className="pb-2 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-950 flex items-center gap-1.5">
              <IconKey size={14} className="text-zinc-600" />
              <span>Update Password</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Enforce account security and revoke temporary password</p>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-md text-xs border flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                  : 'bg-rose-50 text-rose-800 border-rose-200/90'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <IconCheck size={14} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <IconAlertTriangle size={14} className="text-rose-600 flex-shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <Input
              label="Current Password *"
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Input
              label="New Password *"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />

            <Input
              label="Confirm New Password *"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Updating Password...' : 'Change Password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
