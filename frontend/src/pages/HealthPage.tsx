import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse } from '../lib/types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { IconAlertTriangle } from '../components/ui/Icons';

interface HealthData {
  status: string;
  application: string;
  timestamp: string;
}

export const HealthPage: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery<ApiResponse<HealthData>>({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<HealthData>>('/health');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        Checking system health...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto py-8">
        <Card className="p-6 space-y-2 border border-rose-200 bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-700">
            <IconAlertTriangle size={20} className="text-rose-600" />
            <h2 className="text-base font-bold">Backend Service Offline</h2>
          </div>
          <p className="text-sm text-rose-700">
            {error instanceof Error ? error.message : 'Unknown connection error'}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Verify the ShiftOps Spring Boot backend service is running and listening on port 8080.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f1f2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1e7b4f]" />
            <h2 className="text-sm font-semibold text-[#131416]">System status: Online</h2>
          </div>
          <Badge variant="success" size="sm" showDot>
            {data?.data?.status || 'UP'}
          </Badge>
        </div>

        <div className="divide-y divide-[#f0f1f2] text-xs">
          <div className="py-2.5 flex justify-between items-center">
            <span className="text-[#5d5f60] text-xs font-normal">Application</span>
            <span className="font-medium text-[#131416]">{data?.data?.application}</span>
          </div>
          <div className="py-2.5 flex justify-between items-center">
            <span className="text-[#5d5f60] text-xs font-normal">Last checked</span>
            <span className="text-[#5d5f60] text-xs tabular-nums">{data?.data?.timestamp}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HealthPage;
