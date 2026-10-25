import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BranchesPage } from './pages/BranchesPage';
import { StaffPage } from './pages/StaffPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { AttendancePage } from './pages/AttendancePage';
import { ProfilePage } from './pages/ProfilePage';
import { TasksPage } from './pages/TasksPage';
import { IssuesPage } from './pages/IssuesPage';
import { HandoversPage } from './pages/HandoversPage';
import HealthPage from './pages/HealthPage';

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Routes>
          {/* Dedicated full-viewport Login Portal */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Workspace Application */}
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/health"
                    element={
                      <ProtectedRoute>
                        <HealthPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/branches"
                    element={
                      <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                        <BranchesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/staff"
                    element={
                      <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                        <StaffPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/shifts"
                    element={
                      <ProtectedRoute>
                        <ShiftsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute>
                        <AttendancePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tasks"
                    element={
                      <ProtectedRoute>
                        <TasksPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/issues"
                    element={
                      <ProtectedRoute>
                        <IssuesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/handovers"
                    element={
                      <ProtectedRoute>
                        <HandoversPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
