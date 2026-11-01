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
      <div className="pb-4 border-b border-[#f0f1f2]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131416] flex items-center gap-2.5">
          <IconUser size={22} className="text-[#131416]" />
          <span>My Profile &amp; Settings</span>
        </h1>
        <p className="text-xs text-[#5d5f60] mt-1">
          Manage your personal details, contact information, and security password
        </p>
      </div>

      {/* Account Info Summary Card */}
      <Card compact className="p-4 sm:p-5 border border-[#e8eaec] bg-white rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#131416]">{user?.fullName}</h2>
            <p className="text-xs text-[#5d5f60] mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" size="md">
              {user?.role}
            </Badge>
            {user?.primaryBranchName && (
              <span className="text-xs font-medium text-[#131416] flex items-center gap-1.5 bg-[#f4f6f8] border border-[#cdced1] px-2.5 py-1 rounded-md">
                <IconMapPin size={12} className="text-[#727477]" />
                <span>{user.primaryBranchName}</span>
              </span>
            )}
            {user?.mustChangePassword && (
              <Badge variant="warning" size="md" showDot>
                Password Update Required
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Details Form */}
        <Card className="p-4 sm:p-5 space-y-4 border border-[#e8eaec] bg-white rounded-xl">
          <div className="pb-3 border-b border-[#f0f1f2]">
            <h3 className="text-sm font-bold text-[#131416]">Personal Information</h3>
            <p className="text-xs text-[#5d5f60] mt-0.5">Keep your contact details up to date</p>
          </div>

          {profileMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-[#dcfae5] text-[#04250e] border-[#1e7b4f]/20'
                  : 'bg-[#ffedea] text-[#831c1e] border-[#c4242a]/30'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <IconCheck size={14} className="text-[#1e7b4f] flex-shrink-0" />
              ) : (
                <IconAlertTriangle size={14} className="text-[#c4242a] flex-shrink-0" />
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
        <Card className="p-4 sm:p-5 space-y-4 border border-[#e8eaec] bg-white rounded-xl">
          <div className="pb-3 border-b border-[#f0f1f2]">
            <h3 className="text-sm font-bold text-[#131416] flex items-center gap-1.5">
              <IconKey size={16} className="text-[#5d5f60]" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-[#5d5f60] mt-0.5">Update password and secure your account</p>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-[#dcfae5] text-[#04250e] border-[#1e7b4f]/20'
                  : 'bg-[#ffedea] text-[#831c1e] border-[#c4242a]/30'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <IconCheck size={14} className="text-[#1e7b4f] flex-shrink-0" />
              ) : (
                <IconAlertTriangle size={14} className="text-[#c4242a] flex-shrink-0" />
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
