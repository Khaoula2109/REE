import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store/hooks';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/users/UserManagement';
import ReadingsList from './pages/readings/ReadingsList';
import ReadingDetail from './pages/readings/ReadingDetail';
import AgentsList from './pages/agents/AgentsList';
import AgentDetail from './pages/agents/AgentDetail';
import MetersList from './pages/meters/MetersList';
import MeterDetail from './pages/meters/MeterDetail';
import AddMeter from './pages/meters/AddMeter';
import Reports from './pages/Reports';

function App() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Redirect to change password if required
  if (isAuthenticated && user?.mustChangePassword) {
    return (
      <Routes>
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
      />

      {/* Protected routes */}
      {isAuthenticated ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* User management (SUPERADMIN only) */}
          {user?.role === 'SUPERADMIN' && (
            <Route path="/users" element={<UserManagement />} />
          )}

          {/* Readings */}
          <Route path="/readings" element={<ReadingsList />} />
          <Route path="/readings/:id" element={<ReadingDetail />} />

          {/* Agents */}
          <Route path="/agents" element={<AgentsList />} />
          <Route path="/agents/:id" element={<AgentDetail />} />

          {/* Meters */}
          <Route path="/meters" element={<MetersList />} />
          <Route path="/meters/add" element={<AddMeter />} />
          <Route path="/meters/:id" element={<MeterDetail />} />

          {/* Reports */}
          <Route path="/reports" element={<Reports />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;
