import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse } from '../lib/types';

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
    return <div className="health-page"><p>Checking backend health...</p></div>;
  }

  if (isError) {
    return (
      <div className="health-page health-error">
        <h2>❌ Backend Unreachable</h2>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
        <p>Make sure the backend is running on port 8080.</p>
      </div>
    );
  }

  return (
    <div className="health-page health-success">
      <h2>✅ Backend Connected</h2>
      <table>
        <tbody>
          <tr><td><strong>Status</strong></td><td>{data?.data?.status}</td></tr>
          <tr><td><strong>Application</strong></td><td>{data?.data?.application}</td></tr>
          <tr><td><strong>Timestamp</strong></td><td>{data?.data?.timestamp}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export default HealthPage;
