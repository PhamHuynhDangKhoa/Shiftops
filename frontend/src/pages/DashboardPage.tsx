import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ApiResponse, Branch } from '../lib/types';
import { Card, Badge } from '../components/ui';

interface HealthData {
  status: string;
  version: string;
  database: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';

  // Health check query
  const { data: health } = useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<HealthData>>('/health');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  // Branches query
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: isOwner || isManager,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Hero Card */}
      <Card className="p-6 md:p-8 bg-gradient-to-r from-white via-white to-blue-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome back, {user?.fullName}! 👋
            </h1>
            <p className="text-sm md:text-base text-gray-600 flex items-center gap-2 flex-wrap">
              <span>Logged in as</span>
              <Badge variant="brand">{user?.role}</Badge>
              {user?.primaryBranchName && (
                <span>
                  at <strong className="text-gray-900 font-semibold">{user.primaryBranchName}</strong>
                </span>
              )}
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {(isOwner || isManager) && (
              <Link
                to="/staff"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                Manage Staff
              </Link>
            )}
            {(isOwner || isManager) && (
              <Link
                to="/branches"
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                Branches
              </Link>
            )}
            <Link
              to="/attendance"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              ⏱️ Attendance
            </Link>
            <Link
              to="/tasks"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              📋 Tasks
            </Link>
            <Link
              to="/issues"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              ⚠️ Issues
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              My Profile
            </Link>
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card accent="blue">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Operating Branches
          </span>
          <div className="text-3xl font-extrabold text-gray-900 mt-1">
            {branches ? branches.length : '—'}
          </div>
          <span className="text-xs font-medium text-emerald-600 mt-1 block">
            {branches?.filter((b) => b.active).length || 0} active locations
          </span>
        </Card>

        <Card accent={health?.status === 'UP' ? 'green' : 'orange'}>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            System Status
          </span>
          <div
            className={`text-3xl font-extrabold mt-1 ${
              health?.status === 'UP' ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {health?.status || 'Connecting...'}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            DB: {health?.database || 'PostgreSQL'} • API: v{health?.version || '1.0'}
          </span>
        </Card>

        <Card accent={user?.mustChangePassword ? 'orange' : 'green'}>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Security Status
          </span>
          <div
            className={`text-3xl font-extrabold mt-1 ${
              user?.mustChangePassword ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {user?.mustChangePassword ? 'Action Required' : 'Healthy'}
          </div>
          <span
            className={`text-xs mt-1 block ${
              user?.mustChangePassword ? 'text-amber-600' : 'text-gray-500'
            }`}
          >
            {user?.mustChangePassword ? 'Temporary password active' : 'Credentials up-to-date'}
          </span>
        </Card>
      </div>

      {/* Modules Roadmap Notice */}
      <Card className="bg-slate-50 border-slate-200">
        <h3 className="text-base font-bold text-slate-800 mb-2">ShiftOps Modules Status</h3>
        <p className="text-xs md:text-sm text-slate-600 space-y-1 leading-relaxed">
          • <strong>Phase 1:</strong> Authentication & Core Entities (Complete ✅)<br />
          • <strong>Phase 2:</strong> Branch & Staff Management (Complete ✅)<br />
          • <strong>Phase 3:</strong> Shift Scheduling & Concurrency Engine (Complete ✅)<br />
          • <strong>Phase 4:</strong> Attendance & Punctuality Engine (Complete ✅)<br />
          • <strong>Phase 5:</strong> Task Assignment & Templates (Complete ✅)<br />
          • <strong>Phase 5.5:</strong> Technical Cleanup & Architecture Hardening (In Progress ⚡)<br />
          • <strong>Phase 6:</strong> Issue Management & Resolution (Scheduled ⏳)
        </p>
      </Card>
    </div>
  );
};
