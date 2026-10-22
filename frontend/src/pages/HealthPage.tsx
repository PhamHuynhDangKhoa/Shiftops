import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse } from '../lib/types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { IconCheck, IconAlertTriangle } from '../components/ui/Icons';

interface HealthData {
  status: string;
  application: string;
  timestamp: string;
}

function HealthPage() {
  const { data, isLoading, isError, error } = useQuery<ApiResponse<HealthData>>({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<HealthData>>('/health');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs font-mono text-zinc-400">
        Checking backend diagnostics...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto py-8">
        <Card accent="red" className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-rose-800">
            <IconAlertTriangle size={18} className="text-rose-600" />
            <h2 className="text-sm font-semibold">Backend Unreachable</h2>
          </div>
          <p className="text-xs text-rose-700 font-mono">
            {error instanceof Error ? error.message : 'Unknown connection error'}
          </p>
          <p className="text-[11px] text-zinc-500">
            Verify the ShiftOps Spring Boot backend service is listening on port 8080.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Card accent="green" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IconCheck size={14} />
            </span>
            <h2 className="text-sm font-semibold text-zinc-950">Backend Health: Normal</h2>
          </div>
          <Badge variant="success" size="sm">
            {data?.data?.status || 'UP'}
          </Badge>
        </div>

        <div className="divide-y divide-zinc-100 text-xs font-mono">
          <div className="py-2 flex justify-between">
            <span className="text-zinc-500">Application</span>
            <span className="font-semibold text-zinc-900">{data?.data?.application}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-zinc-500">Timestamp</span>
            <span className="text-zinc-700 tabular-nums">{data?.data?.timestamp}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default HealthPage;
