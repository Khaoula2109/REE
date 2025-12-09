import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Placeholder components - to be implemented
const Login = () => <div className="flex items-center justify-center min-h-screen"><div className="text-2xl font-bold text-primary-600">Login Page - To be implemented</div></div>;
const Dashboard = () => <div className="p-8"><div className="text-2xl font-bold text-primary-600">Dashboard - To be implemented</div></div>;
const UserManagement = () => <div className="p-8"><div className="text-2xl font-bold text-primary-600">User Management - To be implemented</div></div>;
const AgentList = () => <div className="p-8"><div className="text-2xl font-bold text-primary-600">Agent List - To be implemented</div></div>;
const MeterList = () => <div className="p-8"><div className="text-2xl font-bold text-primary-600">Meter List - To be implemented</div></div>;
const ReadingList = () => <div className="p-8"><div className="text-2xl font-bold text-primary-600">Reading List - To be implemented</div></div>;
const Reports = () => <div className="p-8"><div className="text-2xl font-bold text-primary-600">Reports - To be implemented</div></div>;
const ChangePassword = () => <div className="p-8"><div className="text-2xl font-bold text-primary-600">Change Password - To be implemented</div></div>;

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/agents" element={
          <ProtectedRoute>
            <AgentList />
          </ProtectedRoute>
        } />
        <Route path="/meters" element={
          <ProtectedRoute>
            <MeterList />
          </ProtectedRoute>
        } />
        <Route path="/readings" element={
          <ProtectedRoute>
            <ReadingList />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
