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
      <div className="py-12 text-center text-xs font-mono text-[#8a94a6]">
        Checking system telemetry...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto py-8 font-mono">
        <Card className="p-5 space-y-2 border border-[#ff1744]/40 bg-[#161922]" chamfer>
          <div className="flex items-center gap-2 text-[#ff335c]">
            <IconAlertTriangle size={18} className="text-[#ff1744]" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Backend Service Offline</h2>
          </div>
          <p className="text-xs text-[#ff335c] font-mono">
            {error instanceof Error ? error.message : 'Unknown connection error'}
          </p>
          <p className="text-[11px] text-[#8a94a6]">
            Verify the ShiftOps Spring Boot backend service is listening on port 8080.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 font-mono">
      <Card className="p-5 space-y-4 border border-[#262c38] bg-[#11141a]" chamfer>
        <div className="flex items-center justify-between pb-3 border-b border-[#262c38]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30 flex items-center justify-center">
              <IconCheck size={14} />
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">System Telemetry: Online</h2>
          </div>
          <Badge variant="success" size="sm">
            {data?.data?.status || 'UP'}
          </Badge>
        </div>

        <div className="divide-y divide-[#1e222b] text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-[#8a94a6] uppercase text-[10px]">Application Core</span>
            <span className="font-bold text-white">{data?.data?.application}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-[#8a94a6] uppercase text-[10px]">Timestamp</span>
            <span className="text-[#00f0ff] tabular-nums">{data?.data?.timestamp}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default HealthPage;
